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
 * theme-lint/map —— 主题令牌 ↔ uno 注册类的唯一真源
 *
 * uno.config.ts 与 eslint 主题规则共用本模块：谁注册了哪些类，只在这里定义一次。
 * CSS 是令牌真源，新增令牌零注册（见 src/styles/theme/tokens）。
 *
 * 消费矩阵（class 内禁止 var()，只能用注册类）：
 *   --bkms-{family}-{step}  → text-/bg-/border-/fill-/stroke-/divide-/ring-/outline-/-{dir}- + bkms-{family}-{step}
 *   --bkms-keep-{hex6}      → 同上色阶形态，keep 族（名字即色值，如 bg-bkms-keep-ffb848）
 *   --bkms-text-{name}      → shortcut bkms-text-{name}
 *   --bkms-bg-{name}        → shortcut bkms-bg-{name}
 *   --bkms-line-{name}      → shortcut bkms-line-{name}（方向边框除外，用色阶类保留方向）
 *   --bkms-shadow-*         → 未注册（值不是数字结尾），class 内 var() 属例外，放行
 *   --bkms-radius-{语义}     → theme.borderRadius，类名 rounded-{语义}（档位 --bkms-radius-<px> 不注册）
 *   ring-offset-*           → 未注册（uno 无色环颜色类），只报不修，避免压平成 ring-*
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { THEME_VAR_PREFIXES } from './var-prefix.mjs';

/**
 * 不能用 import.meta.url 单独定位：uno 的配置加载器（unconfig）会把配置打包到临时目录再执行，
 * 此时 import.meta.url 指向临时位置。cwd 优先、本文件位置兜底，以 color.css 存在为准。
 * 本文件在 scripts/theme-lint/ 下，兜底路径需要上溯两级到仓库子项目根，才能拼出 src/...。
 */
function resolveThemeDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), 'src/styles/theme/tokens'),
    path.resolve(here, '../../src/styles/theme/tokens'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'color.css'))) return dir;
  }
  throw new Error(`[theme] 令牌目录未找到，已尝试：${candidates.join(' , ')}`);
}

export const THEME_TOKENS_DIR = resolveThemeDir();

const readTokenFile = file => fs.readFileSync(path.join(THEME_TOKENS_DIR, file), 'utf8');

// ── uno 注册（uno.config.ts 直接消费） ───────────────────────────────────

const clampByte = n => Math.max(0, Math.min(255, Math.round(n)));

/** 3/4 位简写先展开成 6/8 位；不透明（ff）折叠成 6 位，与 parseAlpha 的 alpha === 255 分支一致 */
export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  const m = s.match(/^#([0-9a-f]{3,8})$/);
  if (!m) return parseRgb(s);
  const h = m[1];
  const full = h.length === 3 || h.length === 4 ? [...h].map(c => c + c).join('') : h;
  if (full.length === 6) return `#${full}`;
  if (full.length === 8) return full.endsWith('ff') ? `#${full.slice(0, 6)}` : `#${full}`;
  return null;
}

// ── 圆角维度：@layer 分段是唯一切分口径，uno 注册与 lint 反查共用 ──────────

const RADIUS_SOURCE = readTokenFile('radius.css');

/** 只认 @layer 标记内的声明：语义档写在标记外时 uno 不会注册，lint 也就不能建议它 */
const radiusLayerBlocks = layer => RADIUS_SOURCE.match(new RegExp(`@layer ${layer}[\\s\\S]*?@endgroup`, 'g')) || [];

/** 档位：名字即像素值，只被语义层引用 */
const RADIUS_SCALE = radiusLayerBlocks('scale').flatMap(block =>
  [...block.matchAll(/--bkms-radius-(\d+)\s*:/g)].map(m => ({ name: `--bkms-radius-${m[1]}`, px: Number(m[1]) })),
);

/**
 * 语义档：px 来自它引用的档位（`--bkms-radius-control: var(--bkms-radius-6)`）。
 * 同值一对多是常态——6px 有 control/card/overlay/tab 四个，值相同不代表场景相同，
 * 所以 lint 只给候选、不替人挑语义。
 */
const RADIUS_SEMANTIC = radiusLayerBlocks('semantic')
  .flatMap(block =>
    [...block.matchAll(/--bkms-radius-([a-z][a-z0-9-]*)\s*:\s*var\(\s*(--bkms-radius-\d+)\s*\)/g)].map(
      ([, label, ref]) => ({
        label,
        name: `--bkms-radius-${label}`,
        px: RADIUS_SCALE.find(t => t.name === ref)?.px,
      }),
    ),
  )
  .filter(t => Number.isFinite(t.px));

/**
 * 圆角档位类：rounded-bkms-<px>，仅供迁移过渡期使用。
 * key 必须带 bkms- 前缀：裸数字会被 uno 内置 spacing 刻度抢走（rounded-6 = 1.5rem）。
 * 新代码禁用档位类——直接写档位会绕过语义，改语义档时管不到这些地方。
 */
export function parseRadiusScaleTokens() {
  const tokens = {};
  for (const t of RADIUS_SCALE) tokens[`bkms-${t.px}`] = `var(${t.name})`;
  return tokens;
}

/**
 * 圆角语义变量：radius.css 的语义区 → theme.borderRadius，类名形如 rounded-card / rounded-t-field。
 * 只取语义档：档位（--bkms-radius-6 这类名字即像素值的）不注册，注册会诱导 rounded-6 这种写法。
 */
export function parseRadiusTokens() {
  const tokens = {};
  for (const t of RADIUS_SEMANTIC) tokens[t.label] = `var(${t.name})`;
  return tokens;
}

/** 档位变量（--bkms-radius-6）：只该被语义层引用，业务与覆写层直连它会绕过语义 */
export const isRadiusScaleVar = name => RADIUS_SCALE.some(t => t.name === name);

/** 语义档变量（--bkms-radius-card）：未定义时不能当合法目标，否则会修出 uno 没注册的类名 */
export const isRadiusSemanticVar = name => RADIUS_SEMANTIC.some(t => t.name === name);

/** 档位里没有同值（2px / 10px 这类）时退到最接近的档位，候选数受 limit 约束 */
export function nearestRadiusSemantics(px, limit = 3) {
  return [...RADIUS_SEMANTIC].sort((a, b) => Math.abs(a.px - px) - Math.abs(b.px - px)).slice(0, limit);
}

/** 色阶 + keep 令牌：color.css → theme.colors，类名形如 text-bkms-brand-2 / bg-bkms-keep-ffb848。
 * step 兼容 6 位 hex（keep 族命名即色值），hex 替代排在 \d+ 之后防全数字 hex 走错分支。
 * 语义与阴影变量结尾不是数字/hex，不会被这条正则捕获 */
export function parseScaleColors() {
  const tokens = {};
  for (const m of readTokenFile('color.css').matchAll(/--bkms-([a-z-]+)-(\d+|[0-9a-f]{6})\s*:/g)) {
    const [, family, step] = m;
    tokens[`bkms-${family}-${step}`] = `var(--bkms-${family}-${step})`;
  }
  return tokens;
}

/**
 * 语义变量：color.css 的语义区 → shortcuts，line 映射为 border 工具类
 * @returns {[string, string][]} 元组而非 string[][]，uno 的 UserShortcuts 只接受元组形态
 */
export function parseSemanticShortcuts() {
  const prefixByGroup = { text: 'text', line: 'border', bg: 'bg' };
  const shortcuts = [];
  for (const m of readTokenFile('color.css').matchAll(/--bkms-(text|line|bg)-([a-z-]+)\s*:/g)) {
    const [, group, name] = m;
    shortcuts.push([`bkms-${group}-${name}`, `${prefixByGroup[group]}-[var(--bkms-${group}-${name})]`]);
  }
  return shortcuts;
}

/** 同值语义档候选；hint 只用于排序（命中场景词的那个排最前），不代替人判断 */
export function radiusSemantics(px, hint) {
  return RADIUS_SEMANTIC.filter(t => t.px === px).sort((a, b) => (b.label === hint) - (a.label === hint));
}

/** alpha：0~1 或百分比；整数 0~255 也兼容。缺省视为不透明 */
function parseAlpha(raw) {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  if (raw.endsWith('%')) return clampByte((n / 100) * 255);
  return clampByte(n <= 1 ? n * 255 : n);
}

/** 通道：0~255 或百分比（CSS 两种写法都合法） */
function parseChannel(raw) {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  return raw.endsWith('%') ? clampByte((n / 100) * 255) : clampByte(n);
}

// ── 反查表（eslint 规则消费） ────────────────────────────────────────────

/** rgb()/rgba() → hex（令牌层全是 hex，不归一就永远匹配不到同值令牌） */
function parseRgb(input) {
  const m = input.match(/^rgba?\(([^)]*)\)$/);
  if (!m) return null;
  const parts = m[1].split(/[,/\s]+/).filter(Boolean);
  if (parts.length !== 3 && parts.length !== 4) return null;
  const channels = parts.slice(0, 3).map(parseChannel);
  if (channels.some(c => c === null)) return null;
  const alpha = parts.length === 4 ? parseAlpha(parts[3]) : 255;
  if (alpha === null) return null;
  const hex = channels.map(c => c.toString(16).padStart(2, '0')).join('');
  return alpha === 255 ? `#${hex}` : `#${hex}${alpha.toString(16).padStart(2, '0')}`;
}

const decls = new Map();
for (const file of ['color.css']) {
  for (const m of readTokenFile(file).matchAll(/(--bkms-[\w-]+)\s*:\s*([^;{}]+)/g)) {
    decls.set(m[1], m[2].trim());
  }
}

/**
 * viz 字典只参与 var() 链解析，不进 SCALE / SEMANTIC / 建议候选：
 * --bkms-viz-series-3 这类数字结尾的名字会被色阶正则当成 family=viz-series 收进建议池。
 */
const vizDecls = new Map();
const vizFile = path.join(THEME_TOKENS_DIR, 'viz.css');
if (fs.existsSync(vizFile)) {
  const source = fs.readFileSync(vizFile, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of source.matchAll(/(--bkms-[\w-]+)\s*:\s*([^;{}]+)/g)) {
    vizDecls.set(m[1], m[2].trim());
  }
}

/** var() 引用链解析到 hex；遇到多值（color-mix 等）返回 null */
function resolveHex(name, seen = new Set()) {
  const value = decls.get(name) ?? vizDecls.get(name);
  if (!value || seen.has(name)) return null;
  seen.add(name);
  const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (ref) return resolveHex(ref[1], seen);
  return normalizeHex(value);
}

/** 色阶令牌：[{ name, family, step, hex }]（step 兼容 keep 族的 6 位 hex 后缀） */
const SCALE = [];
for (const name of decls.keys()) {
  const m = name.match(/^--bkms-([a-z-]+)-(\d+|[0-9a-f]{6})$/);
  if (!m) continue;
  const hex = resolveHex(name);
  if (hex) SCALE.push({ name, family: m[1], step: m[2], hex });
}

/** 语义令牌：[{ name: '--bkms-bg-card', label: 'bg-card', group: 'bg', hex }] */
const SEMANTIC = [];
for (const name of decls.keys()) {
  const m = name.match(/^--bkms-(text|line|bg)-([a-z-]+)$/);
  if (!m) continue;
  const hex = resolveHex(name);
  if (hex) SEMANTIC.push({ name, label: `${m[1]}-${m[2]}`, group: m[1], hex });
}

/** 阴影令牌名（非数字结尾，未注册进 uno） */
const SHADOW_TOKENS = [...decls.keys()].filter(name => /^--bkms-shadow-[a-z-]+$/.test(name));

const SCALE_NAMES = new Set(SCALE.map(t => t.name));
const SEMANTIC_NAMES = new Set(SEMANTIC.map(t => t.name));

/** 注册类名 → 层：bg-bkms-neutral-1 / border-t-bkms-warning-3 是色阶，bkms-text-title 是语义 */
export function layerOfClass(className) {
  const idx = typeof className === 'string' ? className.indexOf('bkms-') : -1;
  return idx < 0 ? null : layerOfVar(`--${className.slice(idx)}`);
}

/**
 * 令牌属于哪一层：'scale' 色阶 / 'semantic' 语义 / null 未定义。
 * 层判定必须复用上面两份表：外部另写 family 正则会漏掉 `--bkms-nav-indicator-1`
 * 这类多段 family，把「不同层但同值」判成同层，自动修复就漏掉了要防的漂移。
 */
export function layerOfVar(name) {
  if (SCALE_NAMES.has(name)) return 'scale';
  if (SEMANTIC_NAMES.has(name)) return 'semantic';
  return null;
}

export const COLOR_KINDS = [
  'text',
  'bg',
  'border',
  'fill',
  'stroke',
  'ring',
  'divide',
  'outline',
  'from',
  'to',
  'via',
  'shadow',
];

/** 语义组与工具类的对应：border 方向存在时不可压平为 bkms-line-* */
const SEMANTIC_GROUP_BY_KIND = { text: 'text', bg: 'bg', border: 'line' };

export const isThemeVar = name =>
  typeof name === 'string' && THEME_VAR_PREFIXES.some(prefix => name.startsWith(prefix));
export const isShadowVar = name => SHADOW_TOKENS.includes(name);

export function hexOfVar(name) {
  return isThemeVar(name) ? resolveHex(name) : null;
}

/**
 * hex → 注册类名。语义优先（bkms-text-* / bkms-bg-* / bkms-line-*），色阶兜底。
 * 方向边框（border-t-* 等）只能落在色阶类上，否则会退化成通用 border-color。
 */
export function suggestClass(value, kind, { dir } = {}) {
  const hex = normalizeHex(value);
  if (!hex || kind === 'shadow' || !COLOR_KINDS.includes(kind)) return null;

  const group = SEMANTIC_GROUP_BY_KIND[kind];
  if (group) {
    const hit = SEMANTIC.find(t => t.group === group && t.hex === hex);
    if (hit) {
      if (kind === 'border' && dir) return scaleClassOf(hex, kind, dir);
      return `bkms-${hit.label}`;
    }
  }
  return scaleClassOf(hex, kind, dir);
}

/** hex → 阴影令牌 var()；class 内属例外（uno 未注册阴影类） */
export function suggestShadowVar(value) {
  const hex = normalizeHex(value);
  if (!hex) return null;
  const hit = SHADOW_TOKENS.find(name => resolveHex(name) === hex);
  return hit ? `var(${hit})` : null;
}

/**
 * hex → var()（style 块 / script / inline style 场景）。
 * group 提示优先（color → text / background → bg / borderColor → line）；
 * 无提示时给色阶 token，比猜语义更中性。
 */
export function suggestVar(value, { group } = {}) {
  const hex = normalizeHex(value);
  if (!hex) return null;
  if (group) {
    const hit = SEMANTIC.find(t => t.group === group && t.hex === hex);
    if (hit) return `var(${hit.name})`;
  }
  const scale = SCALE.find(t => t.hex === hex);
  if (scale) return `var(${scale.name})`;
  const any = SEMANTIC.find(t => t.hex === hex);
  return any ? `var(${any.name})` : null;
}

/** 加权 RGB 距离（近似人眼感知，够用且零依赖） */
function colorDistance(a, b) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return Number.POSITIVE_INFINITY;
  const dr = ra[0] - rb[0];
  const dg = ra[1] - rb[1];
  const db = ra[2] - rb[2];
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db) / 3;
}

// ── 相近候选（eslint suggest 用，无同值 token 时给人工挑） ──────────────

function hexToRgb(hex) {
  const h = hex.slice(1);
  if (h.length !== 6 && h.length !== 8) return null;
  return [0, 2, 4].map(i => Number.parseInt(h.slice(i, i + 2), 16));
}

function scaleClassOf(hex, kind, dir) {
  const hit = SCALE.find(t => t.hex === hex);
  if (!hit) return null;
  const suffix = `bkms-${hit.family}-${hit.step}`;
  return dir ? `${kind}-${dir}-${suffix}` : `${kind}-${suffix}`;
}

/** 距离上限：太远的候选不展示，避免误导 */
const MAX_DISTANCE = 60;

/**
 * hex → 相近的注册类候选（按色差升序）。
 * 语义类优先：同一语义类色差更近时排前面。
 */
export function nearestClasses(value, kind, { dir } = {}, limit = 3) {
  const hex = normalizeHex(value);
  if (!hex || kind === 'shadow' || !COLOR_KINDS.includes(kind)) return [];

  const group = SEMANTIC_GROUP_BY_KIND[kind];
  const candidates = [];
  if (group) {
    for (const t of SEMANTIC.filter(t => t.group === group)) {
      // 方向边框不能压平成通用 border-color
      if (kind === 'border' && dir) continue;
      candidates.push({ label: `bkms-${t.label}`, hex: t.hex });
    }
  }
  for (const t of SCALE) {
    const suffix = `bkms-${t.family}-${t.step}`;
    candidates.push({ label: dir ? `${kind}-${dir}-${suffix}` : `${kind}-${suffix}`, hex: t.hex });
  }

  return candidates
    .map(c => ({ ...c, distance: colorDistance(hex, c.hex) }))
    .filter(c => c.distance <= MAX_DISTANCE)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(c => c.label);
}

/** hex → 相近的 var() 候选（style / script 场景） */
export function nearestVars(value, { group } = {}, limit = 3) {
  const hex = normalizeHex(value);
  if (!hex) return [];
  const pool = [
    ...SEMANTIC.filter(t => !group || t.group === group).map(t => ({ label: t.name, hex: t.hex })),
    ...SCALE.map(t => ({ label: t.name, hex: t.hex })),
  ];
  return pool
    .map(c => ({ ...c, distance: colorDistance(hex, c.hex) }))
    .filter(c => c.distance <= MAX_DISTANCE)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(c => `var(${c.label})`);
}
