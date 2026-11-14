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
 *   --bkms-text-{name}      → shortcut bkms-text-{name}
 *   --bkms-bg-{name}        → shortcut bkms-bg-{name}
 *   --bkms-line-{name}      → shortcut bkms-line-{name}（方向边框除外，用色阶类保留方向）
 *   --bkms-shadow-*         → 未注册（值不是数字结尾），class 内 var() 属例外，放行
 *   ring-offset-*           → 未注册（uno 无色环颜色类），只报不修，避免压平成 ring-*
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 不能用 import.meta.url 单独定位：uno 的配置加载器（unconfig）会把配置打包到临时目录再执行，
 * 此时 import.meta.url 指向临时位置。cwd 优先、本文件位置兜底，以 colors.css 存在为准。
 * 本文件在 scripts/theme-lint/ 下，兜底路径需要上溯两级到仓库子项目根，才能拼出 src/...。
 */
function resolveThemeDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), 'src/styles/theme/tokens'),
    path.resolve(here, '../../src/styles/theme/tokens'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'colors.css'))) return dir;
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

/** 色阶：colors.css → theme.colors，类名形如 text-bkms-brand-2 / bg-bkms-cyan-6 */
export function parseScaleColors() {
  const tokens = {};
  for (const m of readTokenFile('colors.css').matchAll(/--bkms-([a-z-]+)-(\d+)\s*:/g)) {
    const [, family, step] = m;
    tokens[`bkms-${family}-${step}`] = `var(--bkms-${family}-${step})`;
  }
  return tokens;
}

/**
 * 语义变量：semantic.css → shortcuts，line 映射为 border 工具类
 * @returns {[string, string][]} 元组而非 string[][]，uno 的 UserShortcuts 只接受元组形态
 */
export function parseSemanticShortcuts() {
  const prefixByGroup = { text: 'text', line: 'border', bg: 'bg' };
  const shortcuts = [];
  for (const m of readTokenFile('semantic.css').matchAll(/--bkms-(text|line|bg)-([a-z-]+)\s*:/g)) {
    const [, group, name] = m;
    shortcuts.push([`bkms-${group}-${name}`, `${prefixByGroup[group]}-[var(--bkms-${group}-${name})]`]);
  }
  return shortcuts;
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
for (const file of ['colors.css', 'semantic.css']) {
  for (const m of readTokenFile(file).matchAll(/(--bkms-[\w-]+)\s*:\s*([^;{}]+)/g)) {
    decls.set(m[1], m[2].trim());
  }
}

/** var() 引用链解析到 hex；遇到多值（color-mix 等）返回 null */
function resolveHex(name, seen = new Set()) {
  const value = decls.get(name);
  if (!value || seen.has(name)) return null;
  seen.add(name);
  const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (ref) return resolveHex(ref[1], seen);
  return normalizeHex(value);
}

/** 色阶令牌：[{ name, family, step, hex }] */
const SCALE = [];
for (const name of decls.keys()) {
  const m = name.match(/^--bkms-([a-z-]+)-(\d+)$/);
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

export const isThemeVar = name => typeof name === 'string' && name.startsWith('--bkms-');
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
