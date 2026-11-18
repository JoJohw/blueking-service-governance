#!/usr/bin/env node
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
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * theme:check-vendor —— 第三方覆写漂移校验（独立命令，不进 lint 主链路）
 *
 * 第三方包小版本升级可能换选择器或改变量名，覆写会静默失效。本脚本校验三类真源：
 *   1. vendor 里出现的 --vxe-ui-* 仍在 @blueking/table/vue3/vue3.css 中定义；
 *   2. vendor 引用的 --bkms-viz-* 仍在 tokens/viz.css 中定义；
 *   3. 每个覆写文件登记的关键选择器仍同时存在于覆写与所属库的 CSS 中。
 * 用法：pnpm theme:check-vendor
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const VENDOR_DIR = path.join(projectRoot, 'src/styles/theme/patches/vendor');
const VXE_CSS = 'node_modules/@blueking/table/vue3/vue3.css';
const VIZ_CSS = 'src/styles/theme/tokens/viz.css';

/** 覆写文件 → 所属库 CSS，新增覆写文件必须在这里登记 */
const LIB_CSS = {
  'date-picker.css': 'node_modules/@blueking/date-picker/vue3/vue3.css',
  'ediatable.css': 'node_modules/@blueking/ediatable/vue3/vue3.css',
  'highlight.css': 'node_modules/highlight.js/styles/github.css',
  'markdown.css': 'node_modules/github-markdown-css/github-markdown.css',
  'monitor.css': 'node_modules/@blueking/monitor-vue3-components/index.css',
  'notice.css': 'node_modules/@blueking/notice-component/dist/style.css',
  'task-log.css': 'node_modules/@blueking/task-log/vue3/vue3.css',
  'user-selector.css': 'node_modules/@blueking/bk-user-selector/vue3/vue3.css',
  'vxe.css': VXE_CSS,
};

/** 只盯各库最关键的可视面类名，避免把状态类改动误报成漂移 */
const KEY_SELECTORS = {
  'date-picker.css': ['.date-panel', '.date-grid-item'],
  'ediatable.css': ['.bk-ediatable', '.bk-ediatable-head-column'],
  'highlight.css': ['.hljs'],
  'markdown.css': ['.markdown-body'],
  'monitor.css': ['.common-legend', '.monitor-chart-tooltips', '.chart-menu'],
  'notice.css': ['.bk-notice-component-alert'],
  'task-log.css': ['.log-item', '.bk-popper'],
  'user-selector.css': ['.bk-user-selector', '.user-option'],
  'vxe.css': ['.vxe-table--render-default'],
};

const readMaybe = file => {
  const full = path.join(projectRoot, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
};

const isDeclared = (source, name) => new RegExp(`${name}\\s*:`).test(source);

const problems = [];

if (!fs.existsSync(VENDOR_DIR)) {
  console.error(`✗ theme:check-vendor：覆写目录不存在 ${VENDOR_DIR}`);
  process.exit(1);
}

const vxeSource = readMaybe(VXE_CSS);
const vizSource = readMaybe(VIZ_CSS);
if (!vxeSource) problems.push(`依赖缺失：${VXE_CSS}`);
if (!vizSource) problems.push(`字典缺失：${VIZ_CSS}`);

const files = fs.readdirSync(VENDOR_DIR).filter(file => file.endsWith('.css') && file !== 'index.css');

for (const file of files) {
  const source = fs.readFileSync(path.join(VENDOR_DIR, file), 'utf8');

  for (const name of new Set([...source.matchAll(/--vxe-ui-[\w-]+/g)].map(m => m[0]))) {
    if (vxeSource && !isDeclared(vxeSource, name)) problems.push(`${file}: ${name} 已不在 ${VXE_CSS}`);
  }

  for (const name of new Set([...source.matchAll(/var\(\s*(--bkms-viz-[\w-]+)\s*\)/g)].map(m => m[1]))) {
    if (vizSource && !isDeclared(vizSource, name)) problems.push(`${file}: ${name} 未在 ${VIZ_CSS} 定义`);
  }

  const libFile = LIB_CSS[file];
  if (!libFile) {
    problems.push(`${file}: 未在 LIB_CSS 登记所属库 CSS`);
    continue;
  }
  const lib = readMaybe(libFile);
  if (!lib) {
    problems.push(`${file}: 库 CSS 缺失 ${libFile}`);
    continue;
  }
  for (const selector of KEY_SELECTORS[file] ?? []) {
    if (!source.includes(selector)) problems.push(`${file}: 覆写里已无关键选择器 ${selector}`);
    if (!lib.includes(selector)) problems.push(`${libFile}: 升级后缺少关键选择器 ${selector}`);
  }
}

if (problems.length) {
  console.error(`✗ theme:check-vendor：${problems.length} 处漂移`);
  for (const item of problems) console.error(`  - ${item}`);
  console.error('\n第三方包升级后请重跑本命令；缺失的变量名/选择器需同步改 patches/vendor/*.css');
  process.exit(1);
}

console.log(`✓ theme:check-vendor：${files.length} 个覆写文件的变量与关键选择器在当前依赖版本中均存在`);
