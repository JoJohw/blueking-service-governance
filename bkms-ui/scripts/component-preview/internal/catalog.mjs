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

/** 扫描 src/components，产出组件预览清单并写盘 */

import { parse } from '@vue/compiler-sfc';
import fs from 'node:fs';
import path from 'node:path';
import picomatch from 'picomatch';

import { CONFIG } from '../component-preview.config.mjs';
import { OUTPUT, ROOT, SCRIPT_NAME, SRC_DIR } from './paths.mjs';
import { analyzeProps } from './props.mjs';
import {
  extractFallbackSlots,
  extractGuardedSlots,
  extractSlots,
  findVisibilityProp,
  needsFormContext,
} from './slots.mjs';

const {
  componentGlobs,
  componentIdBase = 'src',
  // 默认与 CONFIG 的配置保持一致：id 不做任何省略，写名单时可直接照抄路径
  componentIdStripPrefixes = [],
  hideSlotStructure = new Set(),
  ignoreIds,
  minUsageToInclude,
  placeholders,
  plugins = [],
  usageExcept,
  warning,
} = CONFIG;
/** 组件 id 的基准目录与可省略前缀，规则见配置注释 */
const ID_BASE_DIR = path.resolve(ROOT, componentIdBase);
const componentMatchers = componentGlobs.map(pattern => {
  const normalized = pattern.replace(/^\/+/, '');
  return { pattern: normalized, match: picomatch(normalized) };
});
const families = new Map(
  plugins
    .filter(plugin => plugin.componentFamily)
    .map(plugin => [plugin.componentFamily.entry, plugin.componentFamily]),
);
const slotOverrides = new Map(plugins.flatMap(plugin => Object.entries(plugin.slotOverrides ?? {})));
/**
 * 插槽组合归一化：
 * - 数组形式（历史写法）：原样使用，label 由插件自己写；
 * - 对象形式 `{ base, extras }`：以 base 为基准，extras 里每个插槽单独叠加一次，
 *   自动展开成 `base` + `base + extra` 若干组。
 * 语义上「哪些插槽是核心、哪些是可选装饰」只有开发者知道，脚本没法从模板结构判断，
 * 所以仍要声明一次 base，但不用再逐条列举组合。
 *
 * 自动展开的 label 必须给值：结构视图多卡并排时靠 label 区分，留空会让几块几乎一样的
 * 占位卡无从分辨（preview-combo-label 是 v-if="combo.label"）。
 */
function normalizeSlotCombos(value) {
  if (Array.isArray(value)) return value;
  const base = value?.base ?? [];
  const extras = value?.extras ?? [];
  return [{ label: '基础', slots: base }, ...extras.map(extra => ({ label: `+${extra}`, slots: [...base, extra] }))];
}

const slotCombos = new Map(
  plugins.flatMap(plugin =>
    Object.entries(plugin.slotCombos ?? {}).map(([key, value]) => [key, normalizeSlotCombos(value)]),
  ),
);
const propOverrides = new Map(plugins.flatMap(plugin => Object.entries(plugin.propOverrides ?? {})));
/**
 * 真实态可切换的预览变体：同一组件在不同内容量 / props 下形态不同（如内容溢出与否决定 footer 位置），
 * 单一样例只能体现一种。插件按 id 声明若干变体，预览页在标题栏给一组切换按钮。
 */
const previewVariants = new Map(plugins.flatMap(plugin => Object.entries(plugin.previewVariants ?? {})));
const containerWidths = new Map(plugins.flatMap(plugin => Object.entries(plugin.containerWidth ?? {})));
const fillHeights = new Set(plugins.flatMap(plugin => plugin.fillHeight ?? []));
const fillWidths = new Set(plugins.flatMap(plugin => plugin.fillWidth ?? []));
const heightProps = new Map(plugins.flatMap(plugin => Object.entries(plugin.heightProp ?? {})));

/**
 * 遍历配置 glob 命中的组件生成清单。单个组件解析失败只跳过它，不中断整批生成。
 * @param {{ file: string, text: string }[]} usageSources 全项目引用源，用于统计使用次数
 */
export function buildCatalog(usageSources) {
  const files = collectComponentFiles();
  const catalog = [];
  const seenIds = new Set();
  for (const file of files) {
    const rel = componentIdOf(file);
    if (seenIds.has(rel)) {
      console.warn(`[component-preview] 组件 id 重复，已跳过: ${rel} (${file})`);
      continue;
    }
    seenIds.add(rel);
    if (ignoreIds.has(rel)) continue;
    const usage = countUsages(file, usageSources);
    if (!usageExcept.has(rel) && usage < minUsageToInclude) continue;
    const source = fs.readFileSync(file, 'utf8');
    try {
      const { descriptor } = parse(source);
      if (!descriptor.scriptSetup) continue;
      // 普通 <script> 里的接口/别名也可能被 defineProps 引用（如 sort-dropdown 的 SortOrder），
      // 和 setup 一起解析；generic 属性里的类型参数名交给 props 推导成可读占位。
      const propScripts = [descriptor.script?.content, descriptor.scriptSetup.content].filter(Boolean).join('\n');
      const { props: analyzedProps } = analyzeProps(
        propScripts,
        file,
        String(descriptor.scriptSetup.attrs.generic ?? ''),
      );
      const props = { ...analyzedProps, ...(propOverrides.get(rel) ?? {}) };
      // 弹层类组件（Dialog/Sideslider）默认收起，由预览页给一个按钮按需打开，
      // 这里只记录控制显隐的 prop 名；不再把它的值强行改成 true，否则一关就再也打不开。
      const visibilityProp = findVisibilityProp(descriptor);
      const overlayProp = visibilityProp && typeof props[visibilityProp] === 'boolean' ? visibilityProp : null;
      const slots = extractSlots(descriptor);
      const fallbackSlots = extractFallbackSlots(descriptor);
      const guardedSlots = extractGuardedSlots(descriptor);
      const needsForm = needsFormContext(descriptor);
      const warnings = analyzeWarnings(source);
      catalog.push({
        id: rel,
        // 覆盖前推导 props：基线签名按它取（D5 口径），避免被 propOverrides 合并后的 props 污染；不写盘
        analyzedProps,
        props,
        visibilityProp: overlayProp,
        slots,
        fallbackSlots,
        guardedSlots,
        needsForm,
        warnings,
        usage,
        ...(families.has(rel) ? { family: families.get(rel) } : {}),
        ...(slotOverrides.has(rel) ? { slotOverrides: slotOverrides.get(rel) } : {}),
        ...(slotCombos.has(rel) ? { slotCombos: slotCombos.get(rel) } : {}),
        ...(previewVariants.has(rel) ? { variants: previewVariants.get(rel) } : {}),
        ...(containerWidths.has(rel) ? { containerWidth: containerWidths.get(rel) } : {}),
        ...(fillHeights.has(rel) ? { fillHeight: true } : {}),
        ...(fillWidths.has(rel) ? { fillWidth: true } : {}),
        ...(heightProps.has(rel) ? { heightProp: heightProps.get(rel) } : {}),
        ...(hideSlotStructure.has(rel) ? { hideSlotStructure: true } : {}),
      });
    } catch (error) {
      console.warn(`[component-preview] 跳过 ${rel}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return catalog;
}

/**
 * 扫描全项目源码作为使用次数统计的引用源。
 * 排除 components.d.ts（自动注册声明，列了全部组件名）和 catalog 产物，
 * 否则每个组件都会被算作"被引用"，统计失真。
 */
export function collectUsageSources() {
  const sources = [];
  const excluded = new Set([path.join(SRC_DIR, 'components.d.ts'), OUTPUT]);
  const scan = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        scan(full);
      } else if (/\.(vue|ts|tsx|js)$/.test(entry.name) && !excluded.has(full)) {
        sources.push({ file: full, text: fs.readFileSync(full, 'utf8') });
      }
    }
  };
  scan(SRC_DIR);
  return sources;
}

export function writeCatalog(catalog) {
  const body = `/* 自动生成，请勿手动修改；来源 ${SCRIPT_NAME} */\n\nexport const componentCatalog = ${serialize(catalog.map(stripInternal))};\n`;
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, body);
}

/** 静态预判组件展示风险；命中任一特征就统一打一条提示，不区分具体原因 */
function analyzeWarnings(source) {
  return warning.patterns.some(match => match(source)) ? [warning.text] : [];
}

/** 按配置的 glob 收集 .vue；同一文件被多个模式命中时只保留一份 */
function collectComponentFiles() {
  const files = new Set();
  for (const { pattern, match } of componentMatchers) {
    const base = globBase(pattern);
    if (!fs.existsSync(base)) {
      console.warn(`[component-preview] 扫描路径不存在，已跳过: ${pattern}`);
      continue;
    }
    for (const file of walk(base)) {
      if (!file.endsWith('.vue')) continue;
      if (match(toPosix(path.relative(ROOT, file)))) files.add(file);
    }
  }
  return [...files];
}

/** 组件 id 保持兼容：src/components 下的文件去掉 components/ 前缀，其他目录保留根相对路径 */
function componentIdOf(file) {
  let rel = toPosix(path.relative(ID_BASE_DIR, file));
  if (rel.startsWith('../')) {
    rel = toPosix(path.relative(ROOT, file));
  } else {
    const prefix = componentIdStripPrefixes.find(item => rel.startsWith(`${item}/`));
    if (prefix) rel = rel.slice(prefix.length + 1);
  }
  return rel.replace(/\.vue$/, '');
}

/**
 * 统计引用该组件的"不同文件数"而非引用次数——更符合"用到几次"的直觉。
 * 命中路径 import 或模板标签（PascalCase/kebab）即计一，类型导入和组件自身不计。
 */
function countUsages(file, sources) {
  const base = path.basename(file, '.vue');
  const pascal = base
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  let rel = toPosix(path.relative(SRC_DIR, file));
  if (rel.startsWith('../')) rel = toPosix(path.relative(ROOT, file));
  const escaped = rel.replace(/\.vue$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pathPattern = new RegExp(`${escaped}\\.vue`);
  const tagPattern = new RegExp(`<(${pascal}|${base})\\b`);
  let count = 0;
  for (const source of sources) {
    if (source.file === file) continue;
    const code = source.text.replace(/^\s*import\s+type\b.*?;\s*$/gm, '');
    if (pathPattern.test(code) || tagPattern.test(code)) count += 1;
  }
  return count;
}

/** 取 glob 里第一个通配符之前的字面量目录，作为 walk 起点 */
function globBase(pattern) {
  const segments = [];
  for (const segment of pattern.split('/')) {
    if (/[*?[\]{}()!]/.test(segment)) break;
    segments.push(segment);
  }
  return path.resolve(ROOT, segments.join('/') || '.');
}

function serialize(value, indent = 0) {
  if (value === placeholders.fn) return "() => ''";
  if (typeof value === 'function') return value.toString();
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value);
  if (Array.isArray(value)) return `[${value.map(item => serialize(item, indent + 2)).join(', ')}]`;
  if (typeof value === 'object') {
    const pad = ' '.repeat(indent + 2);
    const closePad = ' '.repeat(indent);
    const entries = Object.entries(value).map(
      ([key, item]) => `${pad}${JSON.stringify(key)}: ${serialize(item, indent + 2)}`,
    );
    return entries.length ? `{\n${entries.join(',\n')}\n${closePad}}` : '{}';
  }
  return 'undefined';
}

/** 去掉仅用于基线签名的内部字段（analyzedProps），避免污染产物与消费端类型 */
function stripInternal(entry) {
  const { analyzedProps, ...output } = entry;
  return output;
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.vue')) out.push(full);
  }
  return out;
}
