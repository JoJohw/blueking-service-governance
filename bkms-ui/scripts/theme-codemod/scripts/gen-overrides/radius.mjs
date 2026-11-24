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
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * bkui 圆角覆写生成器：按 config/radius-components.json 的组件族白名单，从 dist/style.css
 * 逐条复刻 border-radius 规则并改指向 radius 语义令牌，产出 generated/bkui/radius.css。
 *
 * 分派：组件族给默认 token，`rules[].match`（选择器正则）可对特定后代换档——
 * 形状件（椭圆角标、1px 细条）与语义不同的后代（标签、浮层）靠它，不必拆组件族。
 * 分角：组件族开 `cornerRules` 后会额外识别只写 border-*-radius 四条分角声明（无 border-radius 简写）的
 * 拼接控件规则——库用它给分段控件的组首/组尾留圆角，漏读就等于这些角永远停在库原生小值。
 * 产物带「字面量版源」段标记，check-overrides.mjs 会用字面量索引校验选择器漂移；
 * 索引键依赖选择器逐字复刻，故不合并规则、不改写形状值。本脚本只写自身产物与台账。
 * 用法：node scripts/theme-codemod/scripts/gen-overrides/radius.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectBlocks, splitSelectorList } from '../lib/css-blocks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONFIG = path.join(__dirname, '../config/radius-components.json');
const OUTPUT = path.join(ROOT, 'src/styles/theme/generated/bkui/radius.css');
const REPORTS = path.join(__dirname, '../../reports');
const SUMMARY = path.join(REPORTS, 'radius-summary.md');

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
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */`.split('\n');

const SECTION_MARKER =
  '/* 字面量版源：dist/style.css —— 圆角选择器逐字复刻，供 check-overrides.mjs 用字面量索引校验 */';
const SKIP_SELECTOR_RE = /::-webkit-scrollbar/;

const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const SCOPE = `${cfg.scope} `;
const SHAPE_MIN = cfg.shapeMinPx ?? 20;
const distText = fs.readFileSync(path.join(ROOT, cfg.source), 'utf8');

const owners = new Map();
for (const comp of cfg.components) {
  for (const prefix of comp.prefixes) {
    owners.set(prefix, { comp, re: new RegExp(`\\.bk-${prefix}(?![a-z0-9])`) });
  }
}

/** 类名边界 + 最长前缀优先：tag-input 不能被 tag 抢走，table 不能被 tab 抢走 */
function findOwner(selector) {
  let best = null;
  for (const [prefix, entry] of owners) {
    if (!entry.re.test(selector)) continue;
    if (!best || prefix.length > best.prefix.length) best = { prefix, comp: entry.comp };
  }
  return best?.comp ?? null;
}

function radiusDecl(body) {
  let value = null;
  for (const piece of body.split(';')) {
    const idx = piece.indexOf(':');
    if (idx === -1) continue;
    if (piece.slice(0, idx).trim() !== 'border-radius') continue;
    value = piece.slice(idx + 1).trim();
  }
  return value;
}

/** 组件族默认 token 之上的选择器级分派：首个命中的规则生效 */
function resolveToken(comp, selector) {
  for (const rule of comp.rules ?? []) {
    if (new RegExp(rule.match).test(selector)) return rule.token;
  }
  return comp.token;
}

/** 单值 0 规则不覆写；多值简写里的直角边换 none 令牌，其余形状值（百分比 / 20px+ / 非 px）保持原样 */
function rewriteRadius(raw, varName) {
  const parts = raw.trim().split(/\s+/);
  let changed = false;
  const out = parts.map(part => {
    if (/^0(?:\.0+)?(?:px)?$/.test(part)) {
      if (parts.length === 1) return part;
      changed = true;
      return 'var(--bkms-radius-none)';
    }
    const m = /^(\d+(?:\.\d+)?)px$/.exec(part);
    if (!m || Number(m[1]) >= SHAPE_MIN) return part;
    changed = true;
    return varName;
  });
  return changed ? out.join(' ') : null;
}

/** 物理分角属性 → 逻辑分角名（LTR：top-left 即 start-start） */
const CORNER_PROPS = {
  'border-top-left-radius': 'start-start',
  'border-top-right-radius': 'start-end',
  'border-bottom-right-radius': 'end-end',
  'border-bottom-left-radius': 'end-start',
};

/** 分角声明逐条换令牌：0 与形状值（百分比 / ≥ SHAPE_MIN）原样保留，不生成覆写 */
function cornerRadiusDecls(body, varName) {
  const out = [];
  for (const piece of body.split(';')) {
    const idx = piece.indexOf(':');
    if (idx === -1) continue;
    const logical = CORNER_PROPS[piece.slice(0, idx).trim()];
    if (!logical) continue;
    const value = piece.slice(idx + 1).trim();
    const m = /^(\d+(?:\.\d+)?)px$/.exec(value);
    if (!m || Number(m[1]) === 0 || Number(m[1]) >= SHAPE_MIN) continue;
    out.push({ logical, raw: value, decl: `border-${logical}-radius: ${varName};` });
  }
  return out;
}

const LOGICAL_CORNERS = [
  'border-start-start-radius',
  'border-start-end-radius',
  'border-end-end-radius',
  'border-end-start-radius',
];

/** CSS 1~4 值简写按 TL / TR / BR / BL 展开 */
function expandCorners(parts) {
  const [tl, tr = tl, br = tl, bl = tr] = parts;
  return [tl, tr, br, bl];
}

function scopeSelector(selector, indent) {
  return splitSelectorList(selector)
    .map(s => `${SCOPE}${s.trim()}`)
    .join(`,\n${indent}`);
}

/**
 * 多值简写改成「整体语义 + 逻辑角 none」：语义只写一次，拼接侧的直角用逻辑属性清零。
 * 四个令牌并列的简写既重复又难读，且换语义档要逐角跟改。
 */
function toDeclarations(value) {
  // !important 是修饰符不是角值：先摘掉再判角数，否则会被当成第五个角而回落成简写
  const important = /\s*!important\s*$/i.test(value) ? ' !important' : '';
  const body = value.replace(/\s*!important\s*$/i, '').trim();
  const parts = body.split(/\s+(?![^(]*\))/).filter(Boolean);
  if (parts.length === 1) return { decls: [`border-radius: ${parts[0]}${important};`], fallback: false };
  const corners = expandCorners(parts);
  const rounded = [...new Set(corners.filter(t => t !== 'var(--bkms-radius-none)'))];
  // 四角语义不一致时只能保留原值；patches 豁免 stylelint 多值规则，必须自己喊出来
  if (rounded.length !== 1) return { decls: [`border-radius: ${body}${important};`], fallback: true };
  const clears = corners
    .map((t, i) => (t === 'var(--bkms-radius-none)' ? `${LOGICAL_CORNERS[i]}: var(--bkms-radius-none);` : null))
    .filter(Boolean);
  return { decls: [`border-radius: ${rounded[0]}${important};`, ...clears], fallback: false };
}

const buckets = new Map();
const counts = new Map();
/** 整条未覆写的规则数：值只有 0 / 百分比 / ≥ SHAPE_MIN 的形状值，改了反而失真 */
let skipped = 0;
for (const comp of cfg.components) {
  buckets.set(comp.kebab, new Map());
  counts.set(comp.kebab, 0);
}

const rawRules = [];
collectBlocks(distText, null, rawRules);
for (const rule of rawRules) {
  if (SKIP_SELECTOR_RE.test(rule.selector)) continue;
  const comp = findOwner(rule.selector);
  if (!comp) continue;
  const token = resolveToken(comp, rule.selector);
  const varName = `var(--bkms-radius-${token})`;
  const raw = radiusDecl(rule.body);
  const corners = comp.cornerRules ? cornerRadiusDecls(rule.body, varName) : [];
  if (!raw && corners.length === 0) continue;
  const value = raw ? rewriteRadius(raw, varName) : null;
  if (!value && corners.length === 0) {
    skipped += 1;
    continue;
  }
  const origin = raw ?? corners.map(corner => corner.raw).join(' ');
  const key = `${rule.media ?? ''}::${rule.selector}`;
  buckets.get(comp.kebab).set(key, { selector: rule.selector, media: rule.media, value, corners, raw: origin, token });
}

for (const comp of cfg.components) {
  for (const entry of comp.selectors ?? []) {
    // 字符串用组件默认 token；对象形式可为单条补白指定别的档（如 simplicity 走 none）
    const selector = typeof entry === 'string' ? entry : entry.selector;
    const token = typeof entry === 'string' ? comp.token : (entry.token ?? comp.token);
    const key = `::${selector}`;
    buckets.get(comp.kebab).set(key, {
      selector,
      media: null,
      value: `var(--bkms-radius-${token})`,
      corners: [],
      raw: null,
      token,
    });
  }
}

const lines = [
  ...LICENSE_LINES,
  '',
  '/* bkui 圆角覆写 — 由 gen-overrides/radius.mjs 生成，重跑整体覆盖；圆角令牌真源在 tokens/radius.css */',
  '',
  SECTION_MARKER,
];

const fallbackRules = [];
for (const comp of cfg.components) {
  const rules = [...buckets.get(comp.kebab).values()];
  counts.set(comp.kebab, rules.length);
  if (rules.length === 0) continue;
  // 段内可能有选择器级分派，段头只报默认 token，分派明细看台账
  const extraTokens = [...new Set(rules.map(rule => rule.token))].filter(token => token !== comp.token);
  lines.push(
    '',
    `/* ── ${comp.kebab} → ${comp.token}${extraTokens.length ? `（另含 ${extraTokens.join(' / ')} 分派，逐条见台账）` : ''} ── */`,
  );
  for (const [idx, rule] of rules.entries()) {
    if (idx > 0) lines.push('');
    const pad = rule.media ? '  ' : '';
    if (rule.media) lines.push(`${rule.media} {`);
    lines.push(`${pad}${scopeSelector(rule.selector, pad)} {`);
    const { decls, fallback } = rule.value ? toDeclarations(rule.value) : { decls: [], fallback: false };
    if (fallback) fallbackRules.push(rule.selector);
    for (const corner of rule.corners) decls.push(corner.decl);
    for (const decl of decls) lines.push(`${pad}  ${decl}`);
    lines.push(`${pad}}`);
    if (rule.media) lines.push('}');
  }
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${lines.join('\n').trimEnd()}\n`);

// 台账：原值 → token 的完整清单，设计 review 与大表核对都看它，不必逐条回查 dist
const defaults = new Map(cfg.components.map(c => [c.kebab, c.token]));
const rows = cfg.components.flatMap(comp =>
  [...buckets.get(comp.kebab).values()].map(rule => ({ kebab: comp.kebab, ...rule })),
);
const dispatched = rows.filter(r => r.token !== defaults.get(r.kebab)).length;
const keptLiteral = rows.filter(r => /\d+(?:\.\d+)?(?:px|%)/.test(r.value)).length;
const cell = value => String(value ?? '').replace(/\|/g, '\\|');

const summary = [
  '# 圆角覆写台账',
  '',
  '由 `gen-overrides/radius.mjs` 生成，重跑整体覆盖。组件族与选择器分派在 `config/radius-components.json`，令牌真源在 `tokens/radius.css`。',
  '',
  `- 组件族：${cfg.components.length}`,
  `- 覆写规则：${rows.length}（按选择器分派 ${dispatched} 条）`,
  `- 跳过规则：${skipped} 条（整条只有 0 / 百分比 / ≥ ${SHAPE_MIN}px 的形状值，未覆写）`,
  `- 含未令牌化字面量：${keptLiteral} 条（多值里混了形状值，需人工确认）`,
  '',
  '| 组件 | token | 选择器 | 原值 |',
  '| --- | --- | --- | --- |',
  ...rows.map(
    r => `| ${r.kebab} | ${r.token} | \`${cell(r.selector)}\` | ${cell(r.raw ?? '（dist 无圆角，配置补白）')} |`,
  ),
  '',
].join('\n');
fs.mkdirSync(REPORTS, { recursive: true });
fs.writeFileSync(SUMMARY, summary);

const zero = cfg.components.filter(c => counts.get(c.kebab) === 0).map(c => c.kebab);
const unusedRules = cfg.components.flatMap(comp =>
  (comp.rules ?? [])
    .filter(rule => ![...buckets.get(comp.kebab).values()].some(r => new RegExp(rule.match).test(r.selector)))
    .map(rule => `${comp.kebab}:${rule.match}`),
);
const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(`radius overrides: ${total} rules / ${cfg.components.length} components → ${path.relative(ROOT, OUTPUT)}`);
console.log(
  `radius ledger: ${rows.length} rows（分派 ${dispatched}，跳过 ${skipped}，未令牌化 ${keptLiteral}）→ ${path.relative(ROOT, SUMMARY)}`,
);
if (zero.length) console.error(`radius overrides: 零命中组件（库升级后需复核白名单）: ${zero.join(', ')}`);
if (unusedRules.length)
  console.error(`radius overrides: 未命中的分派规则（选择器已变，需复核）: ${unusedRules.join(', ')}`);
if (fallbackRules.length)
  console.error(
    `radius overrides: 四角语义不一致、回落为简写（patches 不走 stylelint，需人工确认）: ${fallbackRules.join(', ')}`,
  );
