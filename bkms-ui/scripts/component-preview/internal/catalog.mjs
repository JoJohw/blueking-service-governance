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

import { CONFIG } from '../component-preview.config.mjs';
import { COMPONENTS_DIR, OUTPUT, SCRIPT_NAME, SRC_DIR } from './paths.mjs';
import { generatePlaceholder } from './props.mjs';
import { extractFallbackSlots, extractSlots, findVisibilityProp, needsFormContext } from './slots.mjs';

const { ignoreIds, minUsageToInclude, placeholders, usageExcept, warning } = CONFIG;

/**
 * 遍历 components 目录生成清单。单个组件解析失败只跳过它，不中断整批生成。
 * @param {{ file: string, text: string }[]} usageSources 全项目引用源，用于统计使用次数
 */
export function buildCatalog(usageSources) {
  const files = walk(COMPONENTS_DIR);
  const catalog = [];
  for (const file of files) {
    const rel = path
      .relative(COMPONENTS_DIR, file)
      .split(path.sep)
      .join('/')
      .replace(/\.vue$/, '');
    if (ignoreIds.has(rel)) continue;
    const usage = countUsages(rel, usageSources);
    if (!usageExcept.has(rel) && usage < minUsageToInclude) continue;
    const source = fs.readFileSync(file, 'utf8');
    try {
      const { descriptor } = parse(source);
      if (!descriptor.scriptSetup) continue;
      const props = generatePlaceholder(descriptor.scriptSetup.content, file);
      const visibilityProp = findVisibilityProp(descriptor);
      if (visibilityProp && typeof props[visibilityProp] === 'boolean') props[visibilityProp] = true;
      const slots = extractSlots(descriptor);
      const fallbackSlots = extractFallbackSlots(descriptor);
      const needsForm = needsFormContext(descriptor);
      const warnings = analyzeWarnings(source);
      catalog.push({ id: rel, props, slots, fallbackSlots, needsForm, warnings, usage });
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
  const body = `/* 自动生成，请勿手动修改；来源 ${SCRIPT_NAME} */\n\nexport const componentCatalog = ${serialize(catalog)};\n`;
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, body);
}

/** 静态预判组件展示风险；命中任一特征就统一打一条提示，不区分具体原因 */
function analyzeWarnings(source) {
  return warning.patterns.some(match => match(source)) ? [warning.text] : [];
}

/**
 * 统计引用该组件的"不同文件数"而非引用次数——更符合"用到几次"的直觉。
 * 命中路径 import 或模板标签（PascalCase/kebab）即计一，类型导入和组件自身不计。
 */
function countUsages(id, sources) {
  const base = id
    .split('/')
    .pop()
    .replace(/\.vue$/, '');
  const pascal = base
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const pathPattern = new RegExp(`components/${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.vue`);
  const tagPattern = new RegExp(`<(${pascal}|${base})\\b`);
  let count = 0;
  for (const { file, text } of sources) {
    if (file.startsWith(COMPONENTS_DIR) && path.basename(file, '.vue') === base) continue;
    const code = text.replace(/^\s*import\s+type\b.*?;\s*$/gm, '');
    if (pathPattern.test(code) || tagPattern.test(code)) count += 1;
  }
  return count;
}

function serialize(value, indent = 0) {
  if (value === placeholders.fn) return "() => ''";
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

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.vue')) out.push(full);
  }
  return out;
}
