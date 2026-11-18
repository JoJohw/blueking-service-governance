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
 * 值策略（单源：既往产物即映射真源）：
 *   - 现有 patches 里「令牌 var + 行尾原值注释」的成对记录 → 复用同一 token（自举，不再有 mapping.json 副本）
 *   - 命中 color.css 令牌值（本就不变）→ 原值生成
 *   - 未收录 → 组件库原色值占位，行尾 pending 标记，进 gen-summary 清单
 *   - 渐变/阴影函数内含任一未确认 hex → 整条声明占位（不做局部替换）
 *
 * 拍板路径：直接改 patches 里的值与原值注释，重跑即继承（生成器先读旧产物建索引，再整体覆盖）。
 *
 * 范围过滤：只处理 reports/usage.json 白名单组件（.bk-<kebab> 前缀族）的规则；
 * 未归属规则不静默丢弃，进 reports/gen-summary.md 供人工收编。
 *
 * 产出：
 *   - src/styles/theme/patches/bkui-theme/<kebab>.css（bkui 组件覆写，按组件族每组件一文件，含变量版段+字面量段；
 *     手写业务补丁在 src/styles/overrides.css，生成器不触碰）
 *   - reports/gen-summary.md（生成摘要 + 未归属规则 + 未收录 hex 待确认清单）
 *
 * 用法：node scripts/theme-codemod/scripts/gen-overrides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectBlocks, splitSelectorList } from './lib/css-blocks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DIST = path.join(ROOT, 'node_modules/bkui-vue/dist');
const PATCHES_DIR = path.join(ROOT, 'src/styles/theme/patches/bkui-theme');
const REPORTS = path.join(__dirname, '../reports');

const readJson = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

// 防御性检测：usage.json 是白名单基线（stats-usage.mjs 的产物），缺失时引导生成而非抛裸 ENOENT
const USAGE_PATH = path.join(__dirname, '../reports/usage.json');
if (!fs.existsSync(USAGE_PATH)) {
  console.error(
    '[gen-overrides] 缺少白名单基线 reports/usage.json，请先执行：node scripts/theme-codemod/scripts/stats-usage.mjs',
  );
  process.exit(1);
}
const usage = readJson('../reports/usage.json');

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

/**
 * 映射索引的唯一来源：现有产物。逐条解析 `属性: 含 var 的值 + 行尾原值注释`，
 * 值里的 var 与原值注释里的 hex 按出现顺序成对（多色渐变也能对上）。
 * 生成器整体覆盖写之前先读一遍旧文件，人工拍板的改动因此可继承。
 * 扫描目录覆盖 bkui-theme 与 vendor：vendor 产物同样整包重写，不给它喂回台账就永远改不动。
 */
const PATCH_LEDGER = new Map();
function collectPatchCssFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectPatchCssFiles(full, out);
    else if (entry.name.endsWith('.css') && entry.name !== 'index.css' && entry.name !== 'variables.css')
      out.push(full);
  }
  return out;
}
for (const file of collectPatchCssFiles(path.join(ROOT, 'src/styles/theme/patches'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([-\w]+)\s*:\s*([^;]+);\s*\/\*\s*(.+?)\s*\*\/\s*$/);
    if (!m) continue;
    const prop = m[1];
    const vars = [...m[2].matchAll(/var\((--bkms-[\w-]+)\)/g)].map(x => x[1]);
    const hexes = [...m[3].matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(x => normalizeHex(x[0]));
    if (!vars.length || vars.length !== hexes.length) continue;
    hexes.forEach((h, i) => {
      const token = vars[i];
      // 字色彩的语义选择由 INK_SEMANTIC_BY_HEX 决定，不回灌台账（否则 background 的 #fff 会被带偏）
      if (INK_PROPS.has(prop) && token.startsWith('--bkms-text-')) return;
      PATCH_LEDGER.set(h, token); // 8 位精确命中
      // 基色回归只对"颜色令牌"成立；阴影令牌自身带 alpha，回填基色会让实色（如 #ccc）被错配成带 alpha 的值
      if (TOKEN_HEX.get(token)?.length !== 9) PATCH_LEDGER.set(h.slice(0, 6), token);
    });
  }
}
/**
 * 旧产物的声明级索引：media::selector -> prop -> 该声明的原值 hex 串。
 * 继承人工对 border 简写的收窄——dist 只给 `border: 1px solid #x`，而完整简写以更高优先级
 * 压掉业务侧 `border: none` 的局部覆写，故此处人工改成了单边 `border-*-color`，重跑须沿用。
 */
const OLD_DECL_HEX = new Map();
if (fs.existsSync(PATCHES_DIR)) {
  for (const name of fs.readdirSync(PATCHES_DIR)) {
    if (!name.endsWith('.css') || name === 'variables.css' || name === 'index.css') continue;
    const text = fs.readFileSync(path.join(PATCHES_DIR, name), 'utf8');
    const blocks = [];
    collectBlocks(text, null, blocks);
    for (const b of blocks) {
      const selector = unscopeSelector(
        b.selector
          .replace(/\/\*[\s\S]*?\*\//g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      );
      const key = `${b.media ?? ''}::${selector}`;
      if (!OLD_DECL_HEX.has(key)) OLD_DECL_HEX.set(key, new Map());
      const bucket = OLD_DECL_HEX.get(key);
      for (const line of b.body.split('\n')) {
        const m = line.match(/^\s*([-\w]+)\s*:\s*[^;]+;\s*\/\*\s*(.+?)\s*\*\/\s*$/);
        if (!m) continue;
        const hexes = [...m[2].matchAll(/#[0-9a-fA-F]{3,8}\b/g)]
          .map(x => normalizeHex(x[0]))
          .sort()
          .join(',');
        if (hexes) bucket.set(m[1], hexes);
      }
    }
  }
}

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

/** 台账收编：真实渲染但不在 usage 白名单的类前缀。
 * 依据：Popover 浮层基础类 .bk-popper（styles/mixins/popper.css）、Input textarea 形态（lib/input/index.js）；
 * monitor-vue3-components 渲染 .bk-collapse/.bk-slider；@blueking/bk-user-selector 等第三方包渲染 .scroll-bar-style；
 * @blueking/table 的 :pagination 内部渲染 .bk-pagination（项目无直接 <bk-pagination>，stats-usage 判为未使用）。
 * prefixes 对 .bk-<prefix> 族（含 - 后代类）；rawPrefixes 对无 bk- 前缀的独立工具类。 */
const EXTRA_OWNERS = [
  { kebab: 'popper', name: 'Popper（Popover 浮层）', prefixes: ['popper'] },
  { kebab: 'collapse', name: 'Collapse（monitor 渲染）', prefixes: ['collapse'] },
  { kebab: 'slider', name: 'Slider（monitor 渲染）', prefixes: ['slider'] },
  { kebab: 'textarea', name: 'Textarea（Input textarea 形态）', prefixes: ['textarea'] },
  {
    kebab: 'scroll-util',
    name: 'ScrollUtil（第三方滚动条）',
    prefixes: ['scroll-y', 'scroll-x', 'f-scroll-x'],
    rawPrefixes: ['scroll-bar-style'],
  },
  { kebab: 'pagination', name: 'Pagination（@blueking/table 渲染）', prefixes: ['pagination'] },
];
const COMPONENT_NAME = new Map([
  ...usage.components.map(c => [c.kebab, c.name]),
  ...EXTRA_OWNERS.map(e => [e.kebab, e.name]),
]);

/** 组件 -> 类前缀别名：部分组件的 DOM 类前缀与导出名 kebab 不一致 */
const PREFIX_ALIAS = {
  dialog: ['dialog', 'modal'], // Dialog 渲染 .bk-modal-wrapper 等类
  'date-picker': ['date-picker', 'picker-panel', 'picker-confirm'], // 面板类 .bk-picker-panel-*
};

/** 两个产物源：变量版 = 项目引入的 style.variable.css；字面量版 = dist/style.css（lib/*.less 的编译合体，
 * dev 下组件入口 lib/<comp>/index.js 按需加载 .less，选择器与变量版不完全一致（如 .bk-button.bk-button-primary），
 * 同 specificity 下后加载的字面量版会赢——单独生成字面量段压制（排在变量版段之后） */
const DIST_FILE = 'style.variable.css';
const LITERAL_DIST_FILE = 'style.css';

const HEX_TOKEN_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

/** 单个 hex token 的归类：token | unchanged | pending（含 unknown） */
function classifyHex(hex8) {
  const base6 = hex8.slice(0, 6);
  // 8 位精确命中排在前：基色可能已另有归属（如 #cccccc4d 的基色 cccccc 是 navy-5），
  // 但完整值已有专属令牌（--bkms-shadow-inset），应按精确值收编
  if (hex8.length === 8 && TOKEN_BY_HEX8.has(`#${hex8}`)) {
    return { kind: 'token', base6, token: TOKEN_BY_HEX8.get(`#${hex8}`) };
  }
  const token = PATCH_LEDGER.get(hex8) ?? PATCH_LEDGER.get(base6);
  if (token) return { kind: 'token', base6, token };
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
  const kinds = tokens.map(classifyHex);
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

// ---------- 1+2. 扫描 dist（双源）+ 归属 + 声明重写 ----------
// patches[kebab] = Map(key => { selector, media, decls: Map(prop -> {value, comment}) })
const patches = new Map(); // 变量版源
const literalPatches = new Map(); // 字面量版源
const unassigned = [];
const unknownHexes = new Map(); // 未归属规则中的 hex -> selectors
const rulePending = new Map(); // 覆写规则内按原值占位的 hex -> selectors（不在任何清单）
let scannedDecls = 0;
let literalUnassigned = 0;

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
      scannedDecls += effective.length;
      unassigned.push(rule);
      for (const d of effective) {
        for (const m of d.value.matchAll(HEX_TOKEN_RE)) {
          const h = normalizeHex(m[0]);
          const base = h.slice(0, 6);
          if (!PATCH_LEDGER.has(base) && !TOKEN_VALUE_SET.has(base)) {
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

// ---------- 3. 输出 patches + index.css ----------
// 生成目录清理：只删生成器自有的 <kebab>.css，保留手工 variables.css（桥接文件，由 bkui.ts 加载）
const GENERATED_BUILTINS = new Set(['variables.css']);
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

/** scopeSelector 的逆运算：逐项剥前缀，还原 dist 里的选择器作为索引键 */
function unscopeSelector(selector) {
  return splitSelectorList(selector)
    .map(s => s.replace(/^\.bkms-themed\s+/, '').trim())
    .join(',');
}

const NARROW_BORDER = new Map([
  ['border', 'border-color'],
  ['border-bottom', 'border-bottom-color'],
  ['border-left', 'border-left-color'],
  ['border-right', 'border-right-color'],
  ['border-top', 'border-top-color'],
]);

/** 旧产物把 border 简写收窄成单边色时沿用旧写法；原值 hex 必须与旧声明一致才算同一条来源 */
function inheritNarrowBorder(prop, r, oldBucket) {
  const narrow = NARROW_BORDER.get(prop);
  if (!narrow || !oldBucket?.has(narrow)) return null;
  const hexes = [...r.comment.matchAll(/#[0-9a-fA-F]{3,8}\b/g)]
    .map(x => normalizeHex(x[0]))
    .sort()
    .join(',');
  if (!hexes || oldBucket.get(narrow) !== hexes) return null;
  const colors = [...r.value.matchAll(/var\(--bkms-[\w-]+\)|#[0-9a-fA-F]{3,8}/g)].map(x => x[0]);
  if (colors.length !== 1) return null;
  return { prop: narrow, value: colors[0] };
}

/** rgba(r,g,b,a) → #rrggbbaa：让颜色函数也能命中 8 位令牌（阴影组）与既有 hex 映射 */
function rgbaToHex8(value) {
  return value.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (_, r, g, b, a) => {
    const hex = n => Number(n).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}${hex(Math.round(Number(a) * 255))}`;
  });
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
    `/* bkui ${name} 覆写 — 由 gen-overrides.mjs 生成，重跑会整体覆盖本文件 */`,
    '',
    '/* 值策略：能对上令牌的写 var(--bkms-*)；未收录的保留原色值并标 pending。要改值就改这里与原值注释，重跑即继承 */',
    '',
  ];
  let varRuleCount = 0;
  let varDeclCount = 0;
  for (const { selector, media, decls } of varBucket?.values() ?? []) {
    if (decls.size === 0) continue;
    const pad = media ? '  ' : '';
    if (media) lines.push(`${media} {`);
    lines.push(`${pad}${scopeSelector(selector, pad)} {`);
    const oldBucket = OLD_DECL_HEX.get(`${media ?? ''}::${selector}`);
    let narrowed = false;
    let declIdx = 0;
    for (const [prop, r] of decls) {
      const narrow = inheritNarrowBorder(prop, r, oldBucket);
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
    const oldBucket = OLD_DECL_HEX.get(`${media ?? ''}::${selector}`);
    let narrowed = false;
    let declIdx = 0;
    for (const [prop, r] of fresh) {
      const narrow = inheritNarrowBorder(prop, r, oldBucket);
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

// ---------- 3b. vendor 包整包覆写 ----------
/**
 * 第三方包整包生成：这类库的选择器没有 .bk- 前缀族可供分组件，整包归属一个文件；
 * 与 bkui-theme 共用同一套 hex→令牌映射与级联保护，避免手写几十条规则后静默失效。
 * 目录约定：@blueking/* 的包输出到 patches/vendor/@blueking/，其余第三方库与 vendor/index.css 平级。
 * 清理：本域与手写覆写（bk-table / vxe / monitor / notice / task-log / user-selector / highlight / markdown）混放，
 * 不能像 bkui-theme 那样整目录清理；从 VENDOR_SOURCES 摘掉一个库后，须手工删除对应产物文件及 index.css 里的 import。
 */
const VENDOR_DIR = path.join(ROOT, 'src/styles/theme/patches/vendor');
const VENDOR_SOURCES = [
  {
    file: 'node_modules/@blueking/date-picker/vue3/vue3.css',
    out: '@blueking/date-picker.css',
    name: 'DatePicker（@blueking/date-picker）',
  },
  {
    file: 'node_modules/@blueking/ediatable/vue3/vue3.css',
    out: '@blueking/ediatable.css',
    name: 'Ediatable（@blueking/ediatable）',
  },
];

/** vendor 专属豁免：ediatable 打包了 tippy 提示层（.tippy-*），那是第三方 tooltip 的全局主题，
 * 非组件设计面；在本作用域里覆写会波及全站 tooltip，故跳过 */
const VENDOR_SKIP_SELECTOR_RE = /\btippy-/;
const vendorStats = [];

for (const source of VENDOR_SOURCES) {
  const rawRules = [];
  // 库内注释（如 stylelint-disable 指令）混在选择器与声明之间会污染产物，先整体剥掉
  const sourceCss = fs.readFileSync(path.join(ROOT, source.file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  collectBlocks(sourceCss, null, rawRules);
  const bucket = new Map();
  let pendingHexes = 0;
  for (const rule of rawRules) {
    if (SKIP_SELECTOR_RE.test(rule.selector) || VENDOR_SKIP_SELECTOR_RE.test(rule.selector)) continue;
    const decls = [];
    let hasHexDecl = false;
    for (const piece of rule.body.split(';')) {
      const idx = piece.indexOf(':');
      if (idx === -1) continue;
      const prop = piece.slice(0, idx).trim();
      const value = rgbaToHex8(piece.slice(idx + 1).trim());
      if (!prop || prop.startsWith('--')) continue;
      const hasHex = value.includes('#') && /#[0-9a-fA-F]{3,8}\b/.test(value);
      if (hasHex) hasHexDecl = true;
      decls.push({ prop, value, hasHex, raw: !hasHex && COLOR_PROPS.has(prop) });
    }
    if (!hasHexDecl) continue;
    const key = `${rule.media ?? ''}::${rule.selector}`;
    if (!bucket.has(key)) bucket.set(key, { selector: rule.selector, media: rule.media, decls: new Map() });
    const entry = bucket.get(key);
    for (const d of decls.filter(x => x.hasHex || x.raw)) {
      const r = d.raw
        ? { value: d.value.replace(/currentColor/g, 'currentcolor'), comment: '原值保留', pendingHexes: [] }
        : rewriteValue(d.value, d.prop);
      if (!r) continue;
      entry.decls.set(d.prop, r); // 后出现的同名 prop 覆盖（与级联一致）
      pendingHexes += r.pendingHexes.length;
    }
  }

  const lines = [
    ...LICENSE_LINES,
    '',
    `/* ${source.name} 覆写 — 由 gen-overrides.mjs 生成（VENDOR_SOURCES），重跑会整体覆盖本文件 */`,
    '',
    '/* 值策略：能对上令牌的写 var(--bkms-*)；未收录的保留原色值并标 pending。要改值就改这里与原值注释，重跑即继承 */',
    '',
  ];
  let rules = 0;
  for (const { selector, media, decls } of bucket.values()) {
    if (decls.size === 0) continue;
    const pad = media ? '  ' : '';
    if (media) lines.push(`${media} {`);
    lines.push(`${pad}${scopeSelector(selector, pad)} {`);
    for (const [prop, r] of decls) lines.push(`${pad}  ${prop}: ${r.value}; /* ${r.comment} */`);
    lines.push(`${pad}}`);
    if (media) lines.push('}');
    lines.push('');
    rules++;
  }

  const outPath = path.join(VENDOR_DIR, source.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join('\n').trimEnd()}\n`);
  vendorStats.push({ file: source.out, rules, pendingHexes });
}

// 域内聚合入口：每个 patches 子目录一个 index.css，theme/index.css 只引各域这一个文件
function writeDomainIndex(dir, files, header) {
  fs.writeFileSync(path.join(dir, 'index.css'), [...header, ...files.map(f => `@import './${f}';`), ''].join('\n'));
}
writeDomainIndex(
  PATCHES_DIR,
  perComponent.map(p => `${p.kebab}.css`),
  [
    ...LICENSE_LINES,
    '',
    '/* bkui 覆写清单 — 由 gen-overrides.mjs 生成，重跑整体覆盖；variables.css 为手工桥接，不在此列 */',
    '',
  ],
);
// 手写覆写在 src/styles/overrides.css，不参与生成器重跑

// ---------- 4. 生成摘要 + 台账 ----------
fs.mkdirSync(REPORTS, { recursive: true });

const summary = [
  '# gen-overrides 生成摘要',
  '',
  `- 生成时间：${new Date().toISOString()}`,
  `- dist 数据源：${DIST_FILE} + ${LITERAL_DIST_FILE}（字面量段）`,
  `- 扫描含 hex 声明：${scannedDecls}；归属组件：${perComponent.length} 个；生成覆写规则：${emittedRules} 条 / ${emittedDecls} 声明`,
  `- 字面量段（dist/style.css）：${literalRules} 条 / ${literalDecls} 声明（并入 bkui-theme/ 组件文件，${perComponent.filter(p => p.litRules > 0).length} 个组件含字面量段；未归属 ${literalUnassigned} 条不计入台账）`,
  `- 未归属规则（选择器无白名单组件前缀）：${unassigned.length} 条`,
  `- 未收录 hex（既对不上既有映射、也不在令牌值）：${unknownHexes.size} 种`,
  `- vendor 整包覆写：${vendorStats.length} 个包 / ${vendorStats.reduce((n, v) => n + v.rules, 0)} 条规则（待拍板 hex ${vendorStats.reduce((n, v) => n + v.pendingHexes, 0)} 处）`,
  '',
  '## vendor 整包产出（VENDOR_SOURCES）',
  '',
  '| 文件 | 规则数 | 待拍板 hex |',
  '| --- | --- | --- |',
  ...vendorStats.map(v => `| patches/vendor/${v.file} | ${v.rules} | ${v.pendingHexes} |`),
  '',
  '## 按组件产出',
  '',
  '| 文件 | 组件 | 规则数（变量+字面量） | 声明数（变量+字面量） |',
  '| --- | --- | --- | --- |',
  ...perComponent.map(
    p =>
      `| patches/bkui-theme/${p.kebab}.css | ${p.name} | ${p.varRules}+${p.litRules} | ${p.varDecls}+${p.litDecls} |`,
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
  summary.push('拍板时直接改对应 patches 文件的值与原值注释，重跑即继承。', '');
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
fs.writeFileSync(path.join(REPORTS, 'gen-summary.md'), summary.join('\n'));

console.log(
  `components: ${perComponent.length}, rules: ${emittedRules}+${literalRules}literal, decls: ${emittedDecls}+${literalDecls}literal`,
);
console.log(
  `unassigned rules: ${unassigned.length}, unknown hexes: ${unknownHexes.size}, in-rule pending: ${rulePending.size}`,
);
