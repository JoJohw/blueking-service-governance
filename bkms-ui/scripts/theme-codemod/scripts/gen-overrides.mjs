/**
 * bkui 覆写生成器：从 bkui dist css 抽取含写死 hex 的声明，按"选择器+prop"生成 class 覆写。
 *
 * 值策略（四分类）：
 *   - mapping.json 命中（设计已确认）→ var(--bkms-*)，行尾注释原值
 *   - keep.json 命中（本就不变）→ 不生成
 *   - pending-design.json / 未收录（未确认）→ 组件库原色值占位，行尾 `/* pending * /` 标记
 *   - 渐变/阴影函数内含任一未确认 hex → 整条声明占位（不做局部替换）
 *
 * 范围过滤：只处理 reports/usage.json 白名单组件（.bk-<kebab> 前缀族）的规则；
 * 未归属规则不静默丢弃，进 reports/gen-summary.md 供人工收编。
 *
 * 产出：
 *   - src/styles/theme/patches/bkui-theme/<kebab>.css（bkui 组件覆写，按组件族每组件一文件；手写业务补丁在 patches/bkms/，生成器不触碰）
 *   - reports/gen-summary.md（生成摘要 + 未归属规则 + 未收录 hex）
 *   - reports/pending-values.md（占位值台账，按待确认清单分组）
 *
 * 用法：node scripts/theme-codemod/scripts/gen-overrides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DIST = path.join(ROOT, 'node_modules/bkui-vue/dist');
const PATCHES_DIR = path.join(ROOT, 'src/styles/theme/patches/bkui-theme');
const MANUAL_PATCHES_DIR = path.join(ROOT, 'src/styles/theme/patches/bkms');
const REPORTS = path.join(__dirname, '../reports');

const readJson = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const usage = readJson('../reports/usage.json');
const MAPPING = readJson('../data/mapping.json');
const KEEP = readJson('../data/keep.json');
const PENDING = readJson('../data/pending-design.json');

// 令牌定义值索引：8 位源 hex 若与令牌值完全一致，直接 var() 引用（令牌自带 alpha 时 color-mix 会二次衰减）
const colorsText = fs.readFileSync(path.join(ROOT, 'src/styles/theme/tokens/colors.css'), 'utf8');
const TOKEN_HEX = new Map();
for (const cm of colorsText.matchAll(/(--bkms-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) {
  TOKEN_HEX.set(cm[1], cm[2].toLowerCase());
}

const PENDING_KEYS = new Set(Object.keys(PENDING));
const KEEP_KEYS = new Set(Object.keys(KEEP));
const WHITELIST = new Set(usage.components.map(c => c.kebab));
const COMPONENT_NAME = new Map(usage.components.map(c => [c.kebab, c.name]));

/** 组件 -> 类前缀别名：部分组件的 DOM 类前缀与导出名 kebab 不一致 */
const PREFIX_ALIAS = {
  dialog: ['dialog', 'modal'], // Dialog 渲染 .bk-modal-wrapper 等类
  'date-picker': ['date-picker', 'picker-panel', 'picker-confirm'], // 面板类 .bk-picker-panel-*
};

/** 只解析实际被加载的产物（style.css 为非变量版，项目未引用） */
const DIST_FILES = ['style.variable.css'];

const HEX_TOKEN_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

/** 单个 hex token 的归类：token | keep | pending（含 unknown） */
function classifyHex(hex8) {
  const base6 = hex8.slice(0, 6);
  if (KEEP_KEYS.has(base6)) return { kind: 'keep', base6 };
  const token = MAPPING[base6];
  if (token) return { kind: 'token', base6, token };
  return { kind: 'pending', base6 };
}

/** 解析 css 文本为扁平规则列表（处理 @media 嵌套；keyframes/font-face 跳过） */
function collectBlocks(text, media, out) {
  let pos = 0;
  while (pos < text.length) {
    const open = text.indexOf('{', pos);
    if (open === -1) break;
    const prelude = text.slice(pos, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      const ch = text[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      j++;
    }
    const body = text.slice(open + 1, j - 1);
    pos = j;
    if (prelude.startsWith('@')) {
      const at = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
      if (at === 'media' || at === 'supports' || at === 'layer') {
        collectBlocks(body, at === 'media' ? prelude.replace(/\s+/g, ' ') : media, out);
      }
      continue; // keyframes/font-face/charset 等
    }
    out.push({ selector: prelude.replace(/\s+/g, ' '), body, media });
  }
}

/** 规则归属：选择器中 .bk-xxx token 与白名单前缀（含别名）匹配（精确优先，其次族前缀最长者） */
function findOwner(selector) {
  let best = null;
  for (const m of selector.matchAll(/\.bk-([a-z0-9-]+)/g)) {
    const t = m[1];
    for (const k of WHITELIST) {
      for (const p of PREFIX_ALIAS[k] ?? [k]) {
        const exact = t === p;
        const family = t.startsWith(`${p}-`);
        if (!exact && !family) continue;
        const score = exact ? p.length + 1000 : p.length;
        if (!best || score > best.score) best = { kebab: k, score };
      }
    }
  }
  return best?.kebab ?? null;
}

function normalizeHex(raw) {
  let h = raw.slice(1).toLowerCase();
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  return h; // 6 或 8 位
}

/** 声明值重写。返回 null = 不生成；否则 { value, comment, pendingHexes } */
function rewriteValue(rawValue) {
  const tokens = [...rawValue.matchAll(HEX_TOKEN_RE)].map(m => normalizeHex(m[0]));
  if (tokens.length === 0) return null;
  const kinds = tokens.map(classifyHex);
  const pendingHexes = kinds.filter(k => k.kind === 'pending').map(k => k.base6);
  if (kinds.every(k => k.kind === 'keep')) return null;
  if (pendingHexes.length > 0) {
    return { value: rawValue.trim(), comment: `pending: 待设计确认（原值）`, pendingHexes };
  }
  let out = rawValue;
  let comment = `原 #${kinds.map(k => k.base6).join(' #')}`;
  for (const m of [...rawValue.matchAll(HEX_TOKEN_RE)]) {
    const h = normalizeHex(m[0]);
    const k = classifyHex(h);
    if (k.kind !== 'token') continue;
    if (h.length === 8) {
      if (TOKEN_HEX.get(k.token) === `#${h}`) {
        // 令牌值与源色完全一致（自带 alpha），直接引用，避免 color-mix 二次衰减
        out = out.replace(m[0], `var(${k.token})`);
      } else {
        const alpha = Math.round((parseInt(h.slice(6), 16) / 255) * 100);
        out = out.replace(m[0], `color-mix(in srgb, var(${k.token}) ${alpha}%, transparent)`);
      }
    } else {
      out = out.replace(m[0], `var(${k.token})`);
    }
    comment = `原 ${[...rawValue.matchAll(HEX_TOKEN_RE)].map(x => x[0]).join(' ')}`;
  }
  return { value: out.trim(), comment, pendingHexes: [] };
}

// ---------- 1. 扫描 dist ----------
const rawRules = [];
for (const f of DIST_FILES) {
  collectBlocks(fs.readFileSync(path.join(DIST, f), 'utf8'), null, rawRules);
}

// ---------- 2. 归属 + 声明重写 ----------
// patches[kebab] = Map(key => { selector, media, decls: Map(prop -> {value, comment}) })
const patches = new Map();
const unassigned = [];
const unknownHexes = new Map(); // 未归属规则中的 hex -> selectors
const rulePending = new Map(); // 覆写规则内按原值占位的 hex -> selectors（不在任何清单）
let scannedDecls = 0;

for (const rule of rawRules) {
  const owner = findOwner(rule.selector);
  const decls = [];
  for (const piece of rule.body.split(';')) {
    const idx = piece.indexOf(':');
    if (idx === -1) continue;
    const prop = piece.slice(0, idx).trim();
    const value = piece.slice(idx + 1).trim();
    if (!prop || prop.startsWith('--')) continue; // 变量定义归 bridge
    if (!/#?[0-9a-fA-F]{3,8}\b/.test(value) || !value.includes('#')) continue;
    scannedDecls++;
    decls.push({ prop, value });
  }
  if (decls.length === 0) continue;
  if (!owner) {
    unassigned.push(rule);
    for (const d of decls) {
      for (const m of d.value.matchAll(HEX_TOKEN_RE)) {
        const h = normalizeHex(m[0]);
        const base = h.slice(0, 6);
        if (!KEEP_KEYS.has(base) && !MAPPING[base] && !PENDING_KEYS.has(base)) {
          if (!unknownHexes.has(base)) unknownHexes.set(base, new Set());
          unknownHexes.get(base).add(rule.selector);
        }
      }
    }
    continue;
  }
  if (!patches.has(owner)) patches.set(owner, new Map());
  const bucket = patches.get(owner);
  const key = `${rule.media ?? ''}::${rule.selector}`;
  if (!bucket.has(key)) bucket.set(key, { selector: rule.selector, media: rule.media, decls: new Map() });
  const entry = bucket.get(key);
  for (const d of decls) {
    const r = rewriteValue(d.value);
    if (!r) continue;
    entry.decls.set(d.prop, r); // 后出现的同名 prop 覆盖（与级联一致）
    for (const h of r.pendingHexes) {
      if (!rulePending.has(h)) rulePending.set(h, new Set());
      rulePending.get(h).add(rule.selector);
    }
  }
}

// ---------- 3. 输出 patches + index.css ----------
fs.rmSync(PATCHES_DIR, { recursive: true, force: true });
fs.mkdirSync(PATCHES_DIR, { recursive: true });

let emittedRules = 0;
let emittedDecls = 0;
const perComponent = [];

for (const [kebab, bucket] of [...patches.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const name = COMPONENT_NAME.get(kebab) ?? kebab;
  const lines = [
    `/* bkui ${name} 覆写 — 由 gen-overrides.mjs 生成，重跑会整体覆盖本文件 */`,
    '',
    `/* 值策略：已确认 → var(--bkms-*)；待确认 → 原色值占位 + pending 标记（拍板后由 apply 脚本换 token） */`,
    '',
  ];
  let ruleCount = 0;
  for (const { selector, media, decls } of bucket.values()) {
    if (decls.size === 0) continue;
    const pad = media ? '  ' : '';
    if (media) lines.push(`${media} {`);
    lines.push(`${pad}.bkms-themed ${selector} {`);
    for (const [prop, r] of decls) {
      lines.push(`${pad}  ${prop}: ${r.value}; /* ${r.comment} */`);
      emittedDecls++;
    }
    lines.push(`${pad}}`);
    if (media) lines.push(`}`);
    lines.push('');
    ruleCount++;
  }
  if (ruleCount > 0) {
    fs.writeFileSync(path.join(PATCHES_DIR, `${kebab}.css`), `${lines.join('\n')}\n`);
    emittedRules += ruleCount;
    perComponent.push({
      kebab,
      name,
      rules: ruleCount,
      decls: [...bucket.values()].reduce((s, b) => s + b.decls.size, 0),
    });
  } else {
    fs.rmSync(path.join(PATCHES_DIR, `${kebab}.css`), { force: true });
  }
}

// index.css 统一入口：令牌在前、bkui-theme 覆写居中、手写业务 patches 兜底在后
// （patches/bkms/ 为手工维护目录，生成器只读取现有 *.css 追加 import，不写入）
const manualPatches = fs.existsSync(MANUAL_PATCHES_DIR)
  ? fs
      .readdirSync(MANUAL_PATCHES_DIR)
      .filter(f => f.endsWith('.css'))
      .sort()
  : [];
const indexLines = [
  '/* 主题层统一入口 — bkui-theme 清单由 gen-overrides.mjs 生成，重跑会整体覆盖本文件；patches/bkms 段为手工维护 */',
  "@import './tokens/colors.css';",
  "@import './tokens/semantic.css';",
  ...perComponent.map(p => `@import './patches/bkui-theme/${p.kebab}.css';`),
  ...manualPatches.map(f => `@import './patches/bkms/${f}';`),
  '',
];
fs.writeFileSync(path.join(ROOT, 'src/styles/theme/index.css'), indexLines.join('\n'));

// ---------- 4. 生成摘要 + 台账 ----------
fs.mkdirSync(REPORTS, { recursive: true });

const summary = [
  '# gen-overrides 生成摘要',
  '',
  `- 生成时间：${new Date().toISOString()}`,
  `- dist 数据源：${DIST_FILES.join(', ')}`,
  `- 扫描含 hex 声明：${scannedDecls}；归属组件：${perComponent.length} 个；生成覆写规则：${emittedRules} 条 / ${emittedDecls} 声明`,
  `- 未归属规则（选择器无白名单组件前缀）：${unassigned.length} 条`,
  `- 未收录 hex（不在 mapping/keep/pending 任一清单）：${unknownHexes.size} 种`,
  '',
  '## 按组件产出',
  '',
  '| 文件 | 组件 | 规则数 | 声明数 |',
  '| --- | --- | --- | --- |',
  ...perComponent.map(p => `| patches/bkui-theme/${p.kebab}.css | ${p.name} | ${p.rules} | ${p.decls} |`),
  '',
];
if (unassigned.length > 0) {
  summary.push('## 未归属规则（需人工判定收编或加入白名单/keep）', '');
  const seen = new Set();
  for (const r of unassigned) {
    const hexes = [...new Set([...r.body.matchAll(HEX_TOKEN_RE)].map(m => normalizeHex(m[0]).slice(0, 6)))];
    const line = `- \`${r.selector}\` → ${hexes.map(h => `#${h}`).join(' ')}${r.media ? `（@media ${r.media}）` : ''}`;
    if (!seen.has(line)) {
      seen.add(line);
      summary.push(line);
    }
  }
  summary.push('');
}
if (unknownHexes.size > 0) {
  summary.push('## 未收录 hex（需补录 mapping/pending/keep 后重跑）', '');
  for (const [hex, sels] of [...unknownHexes.entries()].sort()) {
    summary.push(
      `- #${hex}：${[...sels]
        .slice(0, 3)
        .map(s => `\`${s}\``)
        .join('、')}${sels.size > 3 ? ` 等 ${sels.size} 处` : ''}`,
    );
  }
  summary.push('');
}
fs.writeFileSync(path.join(REPORTS, 'gen-summary.md'), summary.join('\n'));

// pending 台账：按 pending-design note 的分组前缀归组
const groups = new Map();
for (const [hex, meta] of Object.entries(PENDING)) {
  const group = (meta.note || '').split('｜')[0] || '未分组';
  if (!groups.has(group)) groups.set(group, []);
  const usedIn = perComponent.filter(p => {
    const text = fs.readFileSync(path.join(PATCHES_DIR, `${p.kebab}.css`), 'utf8');
    return new RegExp(`#${hex}(?![0-9a-f])`, 'i').test(text);
  });
  groups.get(group).push({ hex, suggest: meta.suggest, usedIn: usedIn.map(p => p.kebab) });
}

const ledger = [
  '# 占位值台账（待设计确认）',
  '',
  '> 覆写文件中标记 `pending: 待设计确认` 的原色值清单。设计拍板后：确认值写入 mapping.json → apply 换值脚本清除标记 → 重跑漂移自检。',
  '',
];
for (const [group, items] of groups) {
  ledger.push(`## ${group}（${items.length}）`, '');
  ledger.push('| 色值 | 候选 token | 覆写出现于 | 状态 |', '| --- | --- | --- | --- |');
  for (const it of items) {
    ledger.push(
      `| #${it.hex} | \`${it.suggest}\` | ${it.usedIn.length ? it.usedIn.map(k => `\`${k}.css\``).join('、') : '—（未生成覆写）'} | 待确认 |`,
    );
  }
  ledger.push('');
}
if (unknownHexes.size > 0) {
  ledger.push(`## 未收录（${unknownHexes.size}）`, '');
  ledger.push('以下 hex 不在任何清单，本轮按原值占位；需先归入 spec/pending/keep 再重跑：', '');
  for (const hex of [...unknownHexes.keys()].sort()) ledger.push(`- #${hex}`);
  ledger.push('');
}
if (rulePending.size > 0) {
  ledger.push(`## 覆写内占位（不在任何清单，${rulePending.size}）`, '');
  ledger.push('以下 hex 出现在归属组件的覆写中、按原值占位；需先归入 spec/pending/keep 再重跑：', '');
  for (const [hex, sels] of [...rulePending.entries()].sort()) {
    ledger.push(
      `- #${hex}：${[...sels]
        .slice(0, 3)
        .map(s => `\`${s}\``)
        .join('、')}${sels.size > 3 ? ` 等 ${sels.size} 处` : ''}`,
    );
  }
  ledger.push('');
}
fs.writeFileSync(path.join(REPORTS, 'pending-values.md'), ledger.join('\n'));

console.log(`components: ${perComponent.length}, rules: ${emittedRules}, decls: ${emittedDecls}`);
console.log(
  `unassigned rules: ${unassigned.length}, unknown hexes: ${unknownHexes.size}, in-rule pending: ${rulePending.size}`,
);
