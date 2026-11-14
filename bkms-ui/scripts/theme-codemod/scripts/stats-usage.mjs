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
 * 统计 bkui-vue 组件在项目中的使用情况（双形态：具名 import + 模板 bk- 标签）。
 * 产出：
 *   - reports/usage-report.md  使用统计报告（人工查阅）
 *   - reports/usage.json       在用组件清单（gen-overrides.mjs 的过滤白名单）
 *
 * 用法：node scripts/theme-codemod/scripts/stats-usage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'src');
const BKUI_DIST = path.join(ROOT, 'node_modules/bkui-vue/dist');

function pascalToKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** 命名与类名不一致的组件：导出名 -> dist css 类前缀 */
const CLASS_ALIAS = {
  InfoBox: 'infobox', // .bk-infobox（非 .bk-info-box）
  bkTooltips: 'tooltip', // 指令 v-bk-tooltips 的浮层类 .bk-tooltip-*
};

function rel(p) {
  return path.relative(ROOT, p).replaceAll('\\', '/');
}

// ---------- 1. 收集使用 ----------
const srcFiles = walk(SRC, new Set(['.vue', '.ts', '.tsx', '.js']));
const importUse = new Map(); // PascalCase 组件名 -> Set(文件)
const tagUse = new Map(); // bk-xxx 标签 -> Set(文件)

const IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*['"]bkui-vue['"]/g;
const TAG_RE = /<(bk-[a-z0-9-]+)/g;

for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(IMPORT_RE)) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim();
      if (name) {
        if (!importUse.has(name)) importUse.set(name, new Set());
        importUse.get(name).add(file);
      }
    }
  }
  if (path.extname(file) === '.vue') {
    for (const m of text.matchAll(TAG_RE)) {
      if (!tagUse.has(m[1])) tagUse.set(m[1], new Set());
      tagUse.get(m[1]).add(file);
    }
  }
}

// ---------- 2. 组件名 -> dist css 类前缀存在性 ----------
const distCssText = fs
  .readdirSync(BKUI_DIST)
  .filter(f => f.endsWith('.css'))
  .map(f => fs.readFileSync(path.join(BKUI_DIST, f), 'utf8'))
  .join('\n');

/**
 * 类前缀存在性（family 感知）：`.bk-loading` 自身或 `.bk-loading-wrapper` 等族类均算命中。
 * 仅排除后随字母数字的情况（如 `bk-timepicker` 不会命中 `bk-time-picker` 的查询）。
 */
function hasClassPrefix(prefix) {
  const re = new RegExp(`\\.bk-${prefix}(?![a-z0-9])`);
  return re.test(distCssText);
}

// ---------- 3. 分类 ----------
const allNames = new Set(importUse.keys());
for (const tag of tagUse.keys()) {
  const pascal = tag
    .slice(3)
    .split('-')
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join('');
  allNames.add(pascal);
}

const components = [];
for (const name of [...allNames].sort()) {
  const kebab = CLASS_ALIAS[name] ?? pascalToKebab(name);
  const files = new Set([...(importUse.get(name) ?? []), ...(tagUse.get(`bk-${pascalToKebab(name)}`) ?? [])]);
  const cssFound = hasClassPrefix(kebab);
  components.push({
    name,
    kebab,
    cssPrefix: `.bk-${kebab}`,
    cssFound,
    importCount: importUse.get(name)?.size ?? 0,
    tagCount: tagUse.get(`bk-${kebab}`)?.size ?? 0,
    fileCount: files.size,
    files: [...files].map(rel),
  });
}

const inScope = components.filter(c => c.cssFound);
const noCss = components.filter(c => !c.cssFound);

// ---------- 4. 输出 ----------
fs.mkdirSync(path.join(__dirname, '../reports'), { recursive: true });

const scopeJson = {
  generatedAt: new Date().toISOString(),
  distSource: 'node_modules/bkui-vue/dist/*.css',
  totalComponents: components.length,
  inScopeCount: inScope.length,
  components: inScope.map(c => ({ name: c.name, kebab: c.kebab, fileCount: c.fileCount })),
};
fs.writeFileSync(path.join(__dirname, '../reports/usage.json'), `${JSON.stringify(scopeJson, null, 2)}\n`);

const lines = [
  '# bkui-vue 组件使用情况报告',
  '',
  `- 生成时间：${new Date().toISOString()}`,
  `- 数据源：src/**/*.{vue,ts,tsx,js} 的 \`import { X } from 'bkui-vue'\` 与 .vue 模板 \`<bk-*>\` 标签`,
  `- 组件种类：${components.length}；其中 dist css 存在对应类前缀（覆写范围内）：**${inScope.length}**；无对应类前缀（icon 等，覆写范围外）：${noCss.length}`,
  '',
  '## 覆写范围内组件（按使用文件数排序）',
  '',
  '| 组件 | 类前缀 | import 文件数 | 模板标签数 | 使用文件数 |',
  '| --- | --- | --- | --- | --- |',
  ...[...inScope]
    .sort((a, b) => b.fileCount - a.fileCount)
    .map(c => `| ${c.name} | \`${c.cssPrefix}\` | ${c.importCount} | ${c.tagCount} | ${c.fileCount} |`),
  '',
  '## 范围外（dist css 无对应类前缀，多为 icon）',
  '',
  ...noCss.map(c => `- ${c.name}（\`bk-${c.kebab}\`，使用文件 ${c.fileCount}）`),
  '',
  '## 模板 bk- 标签明细（全项目仅存少量）',
  '',
  ...(tagUse.size
    ? [...tagUse.entries()]
        .sort((a, b) => b[1].size - a[1].size)
        .map(([tag, files]) => `- \`${tag}\` x${files.size}：${[...files].map(rel).join(', ')}`)
    : ['- 无']),
  '',
];

fs.writeFileSync(path.join(__dirname, '../reports/usage-report.md'), lines.join('\n'));

console.log(`components: ${components.length}, in-scope: ${inScope.length}, no-css: ${noCss.length}`);
console.log('report: scripts/theme-codemod/reports/usage-report.md');
console.log('whitelist: scripts/theme-codemod/reports/usage.json');
