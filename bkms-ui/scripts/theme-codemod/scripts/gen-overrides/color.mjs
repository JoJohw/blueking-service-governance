/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * bkui 覆写生成器：从 bkui dist css 抽取含写死 hex 的声明，按"选择器+prop"生成 class 覆写。
 *
 * 值策略（映射真源：config/overrides.mjs 的 HEX_TOKENS，人工维护，不由产物反推）：
 *   - HEX_TOKENS：旧色 → 新规范令牌的机械映射，全站生效；语义修正（描边/字色/底色/阴影）在手写层 manual/bkui.css
 *   - 命中 color.css 令牌值（本就不变）→ 原值生成
 *   - 未收录 → 组件库原色值占位，行尾 pending 标记，进 gen-summary 清单
 *   - 渐变/阴影函数内含任一未确认 hex → 整条声明占位（不做局部替换）
 *
 * 拍板路径：颜色改 tokens/ 或 bridge/；单个组件与规范不一致时写 manual/bkui.css 的差异。
 * 生成产物只由本脚本写，人工手改会在重跑时丢失；新 hex 拍板后补进 config/overrides.mjs。
 *
 * 范围过滤：只处理 reports/usage.json 白名单组件（.bk-<kebab> 前缀族）的规则；
 * 未归属规则不静默丢弃，进 reports/gen-summary.md 供人工收编。
 *
 * 产出：
 *   - src/styles/theme/generated/bkui/<kebab>.css（bkui 组件覆写，按组件族每组件一文件，含变量版段+字面量段；
 *     手写层在 src/styles/theme/manual/，生成器不读不写）
 *   - reports/gen-summary.md（生成摘要 + 未归属规则 + 未收录 hex 待确认清单）
 *
 * 用法：node scripts/theme-codemod/scripts/gen-overrides/color.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXTRA_OWNERS, HEX_TOKENS, PREFIX_ALIAS } from '../config/overrides.mjs';
import { collectBlocks, splitSelectorList } from '../lib/css-blocks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DIST = path.join(ROOT, 'node_modules/bkui-vue/dist');
const PATCHES_DIR = path.join(ROOT, 'src/styles/theme/generated/bkui');
const REPORTS = path.join(__dirname, '../../reports');

const readJson = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

// 防御性检测：usage.json 是白名单基线（stats-usage.mjs 的产物），缺失时引导生成而非抛裸 ENOENT
const USAGE_PATH = path.join(__dirname, '../../reports/usage.json');
if (!fs.existsSync(USAGE_PATH)) {
  console.error(
    '[gen-overrides] 缺少白名单基线 reports/usage.json，请先执行：node scripts/theme-codemod/scripts/stats-usage.mjs',
  );
  process.exit(1);
}
const usage = readJson('../../reports/usage.json');

// 令牌定义值索引：8 位源 hex 若与令牌值完全一致，直接 var() 引用（令牌自带 alpha 时 color-mix 会二次衰减）。
// 色阶、语义、阴影同在 color.css，漏读会让 8 位精确命中失效
const colorsText = ['color.css']
  .map(name => fs.readFileSync(path.join(ROOT, 'src/styles/theme/tokens', name), 'utf8'))
  .join('\n');
const TOKEN_HEX = new Map();
for (const cm of colorsText.matchAll(/(--bkms-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) {
  TOKEN_HEX.set(cm[1], cm[2].toLowerCase());
}

/** 8 位源 hex → 令牌精确值索引：值完全一致直接 var() 引用（注释索引之外的值维度，避免精确场景落入占位） */
const TOKEN_BY_HEX8 = new Map();
for (const [name, hex] of TOKEN_HEX) {
  if (hex.length === 9) TOKEN_BY_HEX8.set(hex, name);
}

/**
 * 字色位专用：色阶里的同值令牌在深色主题会翻转用途（neutral-10 浅色白、深色是卡片底），
 * 字色必须落语义字令牌，否则白字在深色下变深字。
 */
const INK_PROPS = new Set(['color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color']);
const INK_SEMANTIC_BY_HEX = {
  ffffff: '--bkms-text-inverse', // 彩色底上的白字
  '26323d': '--bkms-text-body', // 浅色浮层的深色正文
};

/** 未收录的 hex 走 pending 进 gen-summary，拍板后补进 config/overrides.mjs 的 HEX_TOKENS */

/** color.css 令牌值反查集（3 位写法先展开，8 位阴影值不参与） */
const TOKEN_VALUE_SET = new Set();
for (const h of TOKEN_HEX.values()) {
  let hex6 = h.slice(1);
  if (hex6.length === 3)
    hex6 = hex6
      .split('')
      .map(c => c + c)
      .join('');
  if (hex6.length === 6) TOKEN_VALUE_SET.add(hex6);
}
const WHITELIST = new Set(usage.components.map(c => c.kebab));

/**
 * 安装目录里存在、但项目未引用的组件：按组件自有 CSS 判定归属，
 * 其规则既不生成，也不进待办报表（避免为未使用组件维护色值映射）。
 */
const BKUI_LIB = path.join(ROOT, 'node_modules/bkui-vue/lib');
const UNUSED_CSS_TEXT = (usage.unusedComponents ?? [])
  .map(kebab => path.join(BKUI_LIB, kebab))
  .filter(dir => fs.existsSync(dir))
  .flatMap(dir =>
    fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.css'))
      .map(f => fs.readFileSync(path.join(dir, f), 'utf8')),
  )
  .join('\n');
const isUnusedClassToken = t => UNUSED_CSS_TEXT.includes(`.bk-${t}`);

const COMPONENT_NAME = new Map([
  ...usage.components.map(c => [c.kebab, c.name]),
  ...EXTRA_OWNERS.map(e => [e.kebab, e.name]),
]);

/** 两个产物源：变量版 = 项目引入的 style.variable.css；字面量版 = dist/style.css（lib/*.less 的编译合体，
 * dev 下组件入口 lib/<comp>/index.js 按需加载 .less，选择器与变量版不完全一致（如 .bk-button.bk-button-primary），
 * 同 specificity 下后加载的字面量版会赢——单独生成字面量段压制（排在变量版段之后） */
const DIST_FILE = 'style.variable.css';
const LITERAL_DIST_FILE = 'style.css';

const HEX_TOKEN_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

/** 单个 hex token 的归类：token | unchanged | pending（含 unknown）。
 * 优先级：HEX_TOKENS（8 位优先，退基色）→ 8 位精确令牌 → 令牌值反查 */
function classifyHex(hex8) {
  const base6 = hex8.slice(0, 6);
  // 人工映射排在按值命中之前：令牌值恰好等于源色不代表该处该用这个令牌
  // （#0000001a 既是 shadow-hover 的值，也是浮层阴影的来源，浮层统一走 shadow-popover）
  const mapped = HEX_TOKENS[hex8] ?? HEX_TOKENS[base6];
  if (mapped) return { kind: 'token', base6, token: mapped };
  // 8 位精确命中：基色可能已另有归属（如 #cccccc4d 的基色 cccccc 是 navy-5），
  // 但完整值已有专属令牌（--bkms-shadow-inset），应按精确值收编
  if (hex8.length === 8 && TOKEN_BY_HEX8.has(`#${hex8}`)) {
    return { kind: 'token', base6, token: TOKEN_BY_HEX8.get(`#${hex8}`) };
  }
  if (TOKEN_VALUE_SET.has(base6)) return { kind: 'unchanged', base6 };
  return { kind: 'pending', base6 };
}

/** 规则归属：先按 .bk-xxx token 与白名单前缀匹配（精确优先，其次族前缀最长者）；
 * 白名单未命中时再试 EXTRA_OWNERS（类 token 去 bk- 前缀后精确/族匹配，无 bk- 前缀的按 rawPrefixes 整体匹配） */
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
  if (best) return best.kebab;
  for (const m of selector.matchAll(/\.([a-zA-Z0-9][a-zA-Z0-9-]+)/g)) {
    const t = m[1].toLowerCase();
    const core = t.startsWith('bk-') ? t.slice(3) : t;
    for (const e of EXTRA_OWNERS) {
      for (const p of e.prefixes) {
        if (core === p || core.startsWith(`${p}-`)) return e.kebab;
      }
      for (const p of e.rawPrefixes ?? []) {
        if (t === p) return e.kebab;
      }
    }
  }
  return null;
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

/**
 * 收窄映射：键 = 归一化选择器::dist 原属性，值 = { prop: 收窄后的属性, token?: 该描边固定的令牌 }。
 * 完整 border 简写会以更高优先级压掉业务侧 border:none 的局部覆写，这些声明只覆盖颜色。
 * 声明式维护，不读旧产物反向继承——产物丢失即无从复原。
 */
const NARROW_DECLS = new Map([
  ['.bk-dialog-footer::border-top', { prop: 'border-top-color' }],
  // #c4c6cc 在 input 内既是描边又是禁用字色，文件级台账只能取其一，这里钉死描边语义
  ['.bk-input::border', { prop: 'border-color', token: '--bkms-line-input' }],
  ['.bk-resize-layout-border::border', { prop: 'border-color' }],
  ['.bk-resize-layout-bottom>.bk-resize-layout-aside::border-top', { prop: 'border-top-color' }],
  ['.bk-resize-layout-left>.bk-resize-layout-aside::border-right', { prop: 'border-right-color' }],
  ['.bk-resize-layout-right>.bk-resize-layout-aside::border-left', { prop: 'border-left-color' }],
  ['.bk-resize-layout-top>.bk-resize-layout-aside::border-bottom', { prop: 'border-bottom-color' }],
]);

/** 声明值重写。返回 null = 不生成；否则 { value, comment, pendingHexes } */
function rewriteValue(rawValue, prop) {
  const rawTokens = [...rawValue.matchAll(HEX_TOKEN_RE)].map(m => m[0]);
  const tokens = rawTokens.map(normalizeHex);
  if (tokens.length === 0) return null;
  // 单色字色位先走语义令牌，盖过色阶映射
  if (prop && INK_PROPS.has(prop) && tokens.length === 1) {
    const semantic = INK_SEMANTIC_BY_HEX[tokens[0]];
    if (semantic) return { value: `var(${semantic})`, comment: `原 ${rawTokens[0]}`, pendingHexes: [] };
  }
  const kinds = tokens.map(h => classifyHex(h));
  const pendingHexes = kinds.filter(k => k.kind === 'pending').map(k => k.base6);
  if (kinds.every(k => k.kind === 'unchanged')) {
    // 令牌值命中的声明也原值生成：值不变，但抬升 specificity 保护级联层级
    // （否则基类覆写 color:var(--bkms-*) 会以同级/更高优先级压过变体规则的白字，如 bk-button-primary）
    const rawHexes = [...rawValue.matchAll(HEX_TOKEN_RE)].map(x => x[0]).join(' ');
    return { value: rawValue.trim(), comment: `原值保留（${rawHexes}）`, pendingHexes: [] };
  }
  if (pendingHexes.length > 0) {
    return { value: rawValue.trim(), comment: 'pending: 待设计确认（原值）', pendingHexes };
  }
  let out = rawValue;
  let comment = `原 #${kinds.map(k => k.base6).join(' #')}`;
  for (const m of [...rawValue.matchAll(HEX_TOKEN_RE)]) {
    const h = normalizeHex(m[0]);
    const k = classifyHex(h);
    if (k.kind !== 'token') continue;
    if (h.length === 8) {
      // 令牌值与源色完全一致（自带 alpha），或阴影位（源 alpha 与令牌不同，但按设计统一收编到阴影令牌）
      if (TOKEN_HEX.get(k.token) === `#${h}` || (prop === 'box-shadow' && k.token.startsWith('--bkms-shadow-'))) {
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

/** 选择器归一化：去注释、逐项去空白，与旧产物索引的键口径一致 */
function selectorKey(selector) {
  return splitSelectorList(selector.replace(/\/\*[\s\S]*?\*\//g, ' '))
    .map(s => s.trim())
    .join(',');
}

// ---------- 1+2. 扫描 dist（双源）+ 归属 + 声明重写 ----------
// patches[kebab] = Map(key => { selector, media, decls: Map(prop -> {value, comment}) })
const patches = new Map(); // 变量版源
const literalPatches = new Map(); // 字面量版源
const unassigned = [];
const unknownHexes = new Map(); // 未归属规则中的 hex -> selectors
const rulePending = new Map(); // 覆写规则内按原值占位的 hex -> selectors（不在任何清单）
let scannedDecls = 0;
let literalUnassigned = 0;
let unusedComponentRules = 0; // 未使用组件的规则：不生成、不告警
let nonComponentRules = 0; // 无 .bk- 类的全局规则（fieldset 等）：不生成、不告警

/** 色彩类属性：规则被覆写时，同规则内的这些声明需一并原值生成（含 transparent/var 等），保住原级联层级 */
const COLOR_PROPS = new Set([
  'color',
  'background',
  'background-color',
  'background-image',
  'border',
  'border-color',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline',
  'outline-color',
  'box-shadow',
  'text-decoration',
  'text-decoration-color',
  'fill',
  'stroke',
  'caret-color',
  'column-rule',
]);

/** 扫描豁免：随组件库产物带入的第三方编辑器/语法高亮主题色（hljs），非组件库设计色——
 * 不归属、不进台账、不计未收录 hex（源码为 #800/#ff0 等 3 位缩写，dist 展开后才成 6 位） */
const SKIP_SELECTOR_RE = /\bhljs\b/i;

function scanDist(file, patchesMap, trackUnassigned) {
  const rawRules = [];
  collectBlocks(fs.readFileSync(path.join(DIST, file), 'utf8'), null, rawRules);
  for (const rule of rawRules) {
    if (SKIP_SELECTOR_RE.test(rule.selector)) continue;
    const owner = findOwner(rule.selector);
    // 单趟解析保持原始声明顺序（shorthand/longhand 混排时顺序参与级联，不可重排）
    const decls = [];
    let hasHexDecl = false;
    for (const piece of rule.body.split(';')) {
      const idx = piece.indexOf(':');
      if (idx === -1) continue;
      const prop = piece.slice(0, idx).trim();
      const value = piece.slice(idx + 1).trim();
      if (!prop || prop.startsWith('--')) continue; // 变量定义归各域 variables.css
      const hasHex = value.includes('#') && /#[0-9a-fA-F]{3,8}\b/.test(value);
      if (hasHex) hasHexDecl = true;
      // 无 hex 的色彩类声明：原值生成（transparent/var 等），
      // 否则基类覆写（+1 specificity）会压过库内变体规则的原级联（如 primary.is-text 的 transparent 库）
      decls.push({ prop, value, hasHex, raw: !hasHex && COLOR_PROPS.has(prop) });
    }
    if (!hasHexDecl) continue;
    const effective = decls.filter(d => d.hasHex || d.raw);
    if (!owner) {
      if (!trackUnassigned) {
        literalUnassigned++;
        continue;
      }
      const selTokens = [...rule.selector.matchAll(/\.bk-([a-z0-9-]+)/g)].map(m => m[1]);
      if (!selTokens.length) {
        nonComponentRules++;
        continue;
      }
      if (selTokens.some(isUnusedClassToken)) {
        unusedComponentRules++;
        continue;
      }
      scannedDecls += effective.length;
      unassigned.push(rule);
      for (const d of effective) {
        for (const m of d.value.matchAll(HEX_TOKEN_RE)) {
          const h = normalizeHex(m[0]);
          const base = h.slice(0, 6);
          if (!HEX_TOKENS[base] && !TOKEN_VALUE_SET.has(base)) {
            if (!unknownHexes.has(base)) unknownHexes.set(base, new Set());
            unknownHexes.get(base).add(rule.selector);
          }
        }
      }
      continue;
    }
    if (!patchesMap.has(owner)) patchesMap.set(owner, new Map());
    const bucket = patchesMap.get(owner);
    const key = `${rule.media ?? ''}::${rule.selector}`;
    if (!bucket.has(key)) bucket.set(key, { selector: rule.selector, media: rule.media, decls: new Map() });
    const entry = bucket.get(key);
    for (const d of effective) {
      scannedDecls++;
      const r = d.raw
        ? { value: d.value.replace(/currentColor/g, 'currentcolor'), comment: '原值保留', pendingHexes: [] }
        : rewriteValue(d.value, d.prop);
      if (!r) continue;
      entry.decls.set(d.prop, r); // 后出现的同名 prop 覆盖（与级联一致）
    }
  }
}

scanDist(DIST_FILE, patches, true);
scanDist(LITERAL_DIST_FILE, literalPatches, false);

// ---------- 3. 输出 generated + index.css ----------
// 生成目录清理：本脚本独占该目录，只保留另一生成器（radius.mjs）产出的 radius.css
const GENERATED_BUILTINS = new Set(['radius.css']);
function cleanGeneratedDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (!GENERATED_BUILTINS.has(f)) fs.rmSync(path.join(dir, f), { force: true });
  }
}
cleanGeneratedDir(PATCHES_DIR);

// 文件内段标记：check-overrides.mjs 依赖此字符串切分校验源（两处须同步）
const LITERAL_SECTION_MARKER =
  '/* 字面量版源：dist/style.css —— 压制 lib/*.less 字面量旧色（选择器逐字复刻），须排在变量版段之后 */';

// 与 eslint.config.mjs 的 LICENSE_HEADER 保持一致；产物每次重跑都整体覆盖，头必须由生成器写
const LICENSE_LINES = `/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */
`
  .trimEnd()
  .split('\n');

let emittedRules = 0;
let emittedDecls = 0;
let literalRules = 0;
let literalDecls = 0;
const perComponent = [];

/** 待拍板记账只统计真正落盘的声明：字面量源的同名选择器/属性会被变量版段盖掉，扫描期记账会留幻影 */
function recordPending(r, selector) {
  for (const h of r.pendingHexes) {
    if (!rulePending.has(h)) rulePending.set(h, new Set());
    rulePending.get(h).add(selector);
  }
}

/** 多选择器逐个加作用域（每项一行，长列表可读）：只给整串加一个前缀，后续选择器会脱离 .bkms-themed 约束，深色值漏出作用域 */
function scopeSelector(selector, indent = '') {
  return splitSelectorList(selector)
    .map(s => `.bkms-themed ${s}`)
    .join(`,\n${indent}`);
}

/** 命中收窄映射时只输出颜色；提取不到唯一颜色说明 dist 写法变了，回退原声明并进摘要告警 */
const narrowMisses = [];
function narrowDecl(selector, prop, r) {
  const narrow = NARROW_DECLS.get(`${selectorKey(selector)}::${prop}`);
  if (!narrow) return null;
  const colors = [...r.value.matchAll(/var\(--bkms-[\w-]+\)|#[0-9a-fA-F]{3,8}\b/g)].map(x => x[0]);
  if (colors.length !== 1) {
    narrowMisses.push({ selector, prop, value: r.value.trim() });
    return null;
  }
  return { prop: narrow.prop, value: narrow.token ? `var(${narrow.token})` : colors[0] };
}

// 同名组件一文件两段：变量版段在前、字面量段在后——字面量源选择器可能更具体，
// 同 specificity 下后者胜，后置即压制
for (const kebab of [...new Set([...patches.keys(), ...literalPatches.keys()])].sort((a, b) => a.localeCompare(b))) {
  const name = COMPONENT_NAME.get(kebab) ?? kebab;
  const varBucket = patches.get(kebab);
  const litBucket = literalPatches.get(kebab);
  const lines = [
    ...LICENSE_LINES,
    '',
    `/* bkui ${name} 覆写 — 由 gen-overrides/color.mjs 生成，重跑会整体覆盖本文件 */`,
    '',
    '/* 值策略：能对上令牌的写 var(--bkms-*)；未收录的保留原色值。重跑按「令牌 + 行尾原值注释」重建，手改无效 */',
    '',
  ];
  let varRuleCount = 0;
  let varDeclCount = 0;
  for (const { selector, media, decls } of varBucket?.values() ?? []) {
    if (decls.size === 0) continue;
    const pad = media ? '  ' : '';
    if (media) lines.push(`${media} {`);
    lines.push(`${pad}${scopeSelector(selector, pad)} {`);
    let narrowed = false;
    let declIdx = 0;
    for (const [prop, r] of decls) {
      const narrow = narrowDecl(selector, prop, r);
      if (narrow && !narrowed) {
        if (declIdx > 0) lines.push('');
        lines.push(`${pad}  /* 收窄写法：只覆盖颜色，完整 border 简写会压制业务侧 border:none 的局部覆写 */`);
        narrowed = true;
      }
      declIdx++;
      lines.push(`${pad}  ${narrow?.prop ?? prop}: ${narrow?.value ?? r.value}; /* ${r.comment} */`);
      emittedDecls++;
      varDeclCount++;
      recordPending(r, selector);
    }
    lines.push(`${pad}}`);
    if (media) lines.push('}');
    lines.push('');
    varRuleCount++;
  }
  emittedRules += varRuleCount;

  // 字面量段：剔除变量版已覆盖的（media::selector::prop 同键取一，两源同规则无需重复覆写）
  const litLines = [];
  let litRuleCount = 0;
  let litDeclCount = 0;
  for (const { selector, media, decls } of litBucket?.values() ?? []) {
    const varEntry = varBucket?.get(`${media ?? ''}::${selector}`);
    const fresh = [...decls].filter(([prop]) => !varEntry?.decls.has(prop));
    if (fresh.length === 0) continue;
    const pad = media ? '  ' : '';
    if (media) litLines.push(`${media} {`);
    litLines.push(`${pad}${scopeSelector(selector, pad)} {`);
    let narrowed = false;
    let declIdx = 0;
    for (const [prop, r] of fresh) {
      const narrow = narrowDecl(selector, prop, r);
      if (narrow && !narrowed) {
        if (declIdx > 0) litLines.push('');
        litLines.push(`${pad}  /* 收窄写法：只覆盖颜色，完整 border 简写会压制业务侧 border:none 的局部覆写 */`);
        narrowed = true;
      }
      declIdx++;
      litLines.push(`${pad}  ${narrow?.prop ?? prop}: ${narrow?.value ?? r.value}; /* ${r.comment} */`);
      literalDecls++;
      litDeclCount++;
      recordPending(r, selector);
    }
    litLines.push(`${pad}}`);
    if (media) litLines.push('}');
    litLines.push('');
    litRuleCount++;
  }
  literalRules += litRuleCount;
  if (litRuleCount > 0) {
    lines.push(LITERAL_SECTION_MARKER, '');
    lines.push(...litLines);
  }

  if (varRuleCount + litRuleCount > 0) {
    fs.writeFileSync(path.join(PATCHES_DIR, `${kebab}.css`), `${lines.join('\n').trimEnd()}\n`);
    perComponent.push({
      kebab,
      name,
      varRules: varRuleCount,
      litRules: litRuleCount,
      varDecls: varDeclCount,
      litDecls: litDeclCount,
    });
  }
}

// 域内聚合入口：生成域一个 index.css，theme/index.css 只引各域这一个文件
function writeDomainIndex(dir, files, header) {
  fs.writeFileSync(path.join(dir, 'index.css'), [...header, ...files.map(f => `@import './${f}';`), ''].join('\n'));
}
writeDomainIndex(
  PATCHES_DIR,
  [...perComponent.map(p => `${p.kebab}.css`), 'radius.css'],
  [
    ...LICENSE_LINES,
    '',
    '/* bkui 覆写清单 — 由 gen-overrides/color.mjs 生成，重跑整体覆盖，禁止手改；radius.css 由 gen-overrides/radius.mjs 产出并随清单引入 */',
    '',
  ],
);

// ---------- 4. 生成摘要 + 台账 ----------
fs.mkdirSync(REPORTS, { recursive: true });

const summary = [
  '# gen-overrides 生成摘要',
  '',
  `- 生成时间：${new Date().toISOString()}`,
  `- dist 数据源：${DIST_FILE} + ${LITERAL_DIST_FILE}（字面量段）`,
  `- 扫描含 hex 声明：${scannedDecls}；归属组件：${perComponent.length} 个；生成覆写规则：${emittedRules} 条 / ${emittedDecls} 声明`,
  `- 字面量段（dist/style.css）：${literalRules} 条 / ${literalDecls} 声明（并入 generated/bkui/ 组件文件，${perComponent.filter(p => p.litRules > 0).length} 个组件含字面量段；未归属 ${literalUnassigned} 条不计入台账）`,
  `- 未归属规则（在用组件前缀未覆盖）：${unassigned.length} 条`,
  `- 未使用组件 / 非组件规则（不生成，不计入待办）：${unusedComponentRules} / ${nonComponentRules} 条`,
  `- 未收录 hex（对不上既有映射、也不在令牌值）：${unknownHexes.size} 种`,
  '',
  '## 按组件产出',
  '',
  '| 文件 | 组件 | 规则数（变量+字面量） | 声明数（变量+字面量） |',
  '| --- | --- | --- | --- |',
  ...perComponent.map(
    p => `| generated/bkui/${p.kebab}.css | ${p.name} | ${p.varRules}+${p.litRules} | ${p.varDecls}+${p.litDecls} |`,
  ),
  '',
];
if (unassigned.length > 0) {
  summary.push('## 未归属规则（需人工判定收编或加入白名单）', '');
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
  summary.push('## 未收录 hex（需先决定 token 后重跑）', '');
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
if (rulePending.size > 0) {
  summary.push(`## 覆写内按原值占位（待拍板，${rulePending.size} 种）`, '');
  summary.push('以下 hex 已归属组件、但对不上既有映射也不是令牌值，本轮按原值占位；');
  summary.push('拍板后改 tokens/ 或 bridge/，或把差异写进 manual/bkui.css，不要手改生成产物。', '');
  for (const [hex, sels] of [...rulePending.entries()].sort()) {
    summary.push(
      `- #${hex}：${[...sels]
        .slice(0, 3)
        .map(s => `\`${s}\``)
        .join('、')}${sels.size > 3 ? ` 等 ${sels.size} 处` : ''}`,
    );
  }
  summary.push('');
}
if (narrowMisses.length > 0) {
  summary.push(`## 收窄映射未生效（${narrowMisses.length} 条）`, '');
  summary.push(
    'NARROW_DECLS 命中了选择器与属性，但取值里没有唯一颜色（dist 写法变了或已改为多色），本轮按原声明输出；',
  );
  summary.push('确认后更新 color.mjs 的 NARROW_DECLS，否则完整 border 简写会压掉业务侧 border:none 的局部覆写。', '');
  for (const { selector, prop, value } of narrowMisses) {
    summary.push(`- \`${selector}\` → \`${prop}: ${value}\``);
  }
  summary.push('');
}
fs.writeFileSync(path.join(REPORTS, 'gen-summary.md'), summary.join('\n'));

console.log(
  `components: ${perComponent.length}, rules: ${emittedRules}+${literalRules}literal, decls: ${emittedDecls}+${literalDecls}literal`,
);
console.log(
  `unassigned rules: ${unassigned.length}, unused/non-component: ${unusedComponentRules}/${nonComponentRules}, ` +
    `unknown hexes: ${unknownHexes.size}, in-rule pending: ${rulePending.size}, narrow misses: ${narrowMisses.length}`,
);
