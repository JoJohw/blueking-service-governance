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
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * theme:report —— 主题令牌漂移存量清单
 *
 * 只做报表，不做判定：规则本身在 eslint（scripts/theme-lint/plugin.mjs），
 * 这里把 theme/* 命中的问题按「规则 → 文件」聚合，用于推进存量替换进度。
 *
 * 用法：pnpm theme:report [--rule=<ruleId>]
 */
import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RULE_TITLE = {
  'theme/no-hardcoded-color': '写死色值（改用注册类 / var()）',
  'theme/prefer-uno-class': 'class 内 var() 任意值（改用注册类）',
  'theme/no-default-palette': 'uno 默认调色板类名',
  'theme/no-foreign-var': '非白名单 var() 引用',
};

const ruleFilter = process.argv.find(a => a.startsWith('--rule='))?.slice('--rule='.length);
// 根目录由脚本自身位置推出，不取 process.cwd()：从仓库上层或子目录跑 `pnpm theme:report` 时
// cwd 不是 bkms-ui，eslint.config.mjs 与 src 都会解析失败 / 报出带 ../ 的路径
const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const eslint = new ESLint({ cwd: projectRoot });
const results = await eslint.lintFiles([path.join(projectRoot, 'src')]);

const issues = results.flatMap(r =>
  r.messages
    .filter(m => m.ruleId?.startsWith('theme/') && (!ruleFilter || m.ruleId === ruleFilter))
    .map(m => ({
      file: path.relative(projectRoot, r.filePath),
      line: m.line,
      rule: m.ruleId,
      messageId: m.messageId,
      message: m.message,
      fixable: Boolean(m.fix),
      suggestions: m.suggestions?.length ?? 0,
    })),
);

if (!issues.length) {
  console.log('✓ theme:report：src 下无主题令牌漂移');
  process.exit(0);
}

const byRule = new Map();
for (const i of issues) {
  if (!byRule.has(i.rule)) byRule.set(i.rule, []);
  byRule.get(i.rule).push(i);
}

const fixableCount = issues.filter(i => i.fixable).length;
const suggestCount = issues.filter(i => !i.fixable && i.suggestions > 0).length;

console.log(`\n主题令牌漂移：${issues.length} 处，${new Set(issues.map(i => i.file)).size} 个文件`);
console.log(`可自动修复 ${fixableCount} 处（pnpm exec eslint src --fix）`);
console.log(`另有 ${suggestCount} 处提供相近候选（IDE 灯泡 → Quick Fix 点选）\n`);

for (const [rule, list] of byRule) {
  const fixable = list.filter(i => i.fixable).length;
  console.log(`【${rule}】${RULE_TITLE[rule] ?? ''}`);
  console.log(`  ${list.length} 处，${new Set(list.map(i => i.file)).size} 个文件，可修复 ${fixable} 处`);

  const byFile = new Map();
  for (const i of list) {
    if (!byFile.has(i.file)) byFile.set(i.file, []);
    byFile.get(i.file).push(i);
  }
  const files = [...byFile].sort((a, b) => b[1].length - a[1].length);
  for (const [file, items] of files.slice(0, 5)) {
    console.log(`    ${file}  ×${items.length}`);
  }
  if (files.length > 5) console.log(`    … 另有 ${files.length - 5} 个文件`);
  console.log('');
}

// 按 messageId 去重：message 里带着具体色值（写死色值 #f87171…），按整条去重几乎等于不去重。
// 这里要的是「有哪几种问题」，每种取一条原样文案当例子。
const top = [
  ...new Map(
    issues.filter(i => i.rule === 'theme/no-hardcoded-color').map(i => [i.messageId ?? i.message, i.message]),
  ).values(),
].slice(0, 3);
if (top.length) console.log(`提示：${top.join(' / ')}\n`);
