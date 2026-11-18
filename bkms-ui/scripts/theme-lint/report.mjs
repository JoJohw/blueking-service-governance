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
 * 用法：pnpm theme:report [--rule=<ruleId>] [--by=property]
 */
import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RULE_TITLE = {
  'theme/no-hardcoded-color': '写死色值（改用注册类 / var()）',
  'theme/prefer-uno-class': 'class 内 var() 任意值（改用注册类）',
  'theme/no-default-palette': 'uno 默认调色板类名',
  'theme/no-foreign-var': '非白名单 var() 引用',
  'theme/no-hardcoded-radius': '写死圆角（改用语义档）',
  'theme/prefer-radius-class': '圆角未走语义注册类',
};

const ruleFilter = process.argv.find(a => a.startsWith('--rule='))?.slice('--rule='.length);
const byDimension = process.argv.find(a => a.startsWith('--by='))?.slice('--by='.length);
if (byDimension && byDimension !== 'property') {
  console.warn(`[theme:report] 未识别的 --by=${byDimension}，当前仅支持 property`);
}
// 根目录由脚本自身位置推出，不取 process.cwd()：从仓库上层或子目录跑 `pnpm theme:report` 时
// cwd 不是 bkms-ui，eslint.config.mjs 与 src 都会解析失败 / 报出带 ../ 的路径
const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * viz 字典待补档清单：只认机器可读的 @viz-(pending|locked) 单行标记；
 * 字典实色是定义，不进 eslint issues，也不计入业务 hex 债务。
 */
const VIZ_MARKER_RE = /\/\*\s*@viz-(pending|locked)\s+([^*]*?)\s*\*\//g;
const PENDING_KEYS = ['target', 'deltaE00', 'usage'];

function collectVizMarkers() {
  const file = path.join(projectRoot, 'src/styles/theme/tokens/viz.css');
  if (!fs.existsSync(file)) return { pending: [], locked: [], defects: [] };
  const source = fs.readFileSync(file, 'utf8');
  const pending = [];
  const locked = [];
  const defects = [];
  for (const marker of source.matchAll(VIZ_MARKER_RE)) {
    const attrs = Object.fromEntries([...marker[2].matchAll(/(\w+)=([^\s]+)/g)].map(m => [m[1], m[2]]));
    const decl = source.slice(marker.index + marker[0].length).match(/(--bkms-viz-[\w-]+)\s*:\s*([^;]+);/);
    const name = decl?.[1] ?? '(未关联声明)';
    const value = decl?.[2].trim() ?? '';
    if (marker[1] === 'locked') {
      locked.push({ name, value, attrs });
      continue;
    }
    const missing = PENDING_KEYS.filter(key => !attrs[key]);
    if (missing.length) defects.push(`${name}：缺少 ${missing.join(' / ')}`);
    pending.push({ name, value, attrs });
  }
  return { pending, locked, defects };
}

const viz = collectVizMarkers();
console.log(`\n【viz 字典】待补档 ${viz.pending.length} 项，锁定 ${viz.locked.length} 项（不计入业务 hex 债务）`);
for (const item of viz.pending) {
  const { target = '-', deltaE00 = '-', usage = '-' } = item.attrs;
  console.log(
    `  ${item.name.padEnd(32)} ${item.value.padEnd(12)} target=${target} deltaE00=${deltaE00} usage=${usage}`,
  );
}
if (viz.defects.length) {
  console.error(`✗ @viz-pending 三键校验失败：\n  ${viz.defects.join('\n  ')}`);
}

const eslint = new ESLint({ cwd: projectRoot });
const results = await eslint.lintFiles([path.join(projectRoot, 'src')]);

const issues = results.flatMap(r =>
  r.messages
    .filter(m => m.ruleId?.startsWith('theme/') && (!ruleFilter || m.ruleId === ruleFilter))
    .map(m => ({
      file: path.relative(projectRoot, r.filePath),
      line: m.line,
      column: m.column,
      rule: m.ruleId,
      messageId: m.messageId,
      message: m.message,
      fixable: Boolean(m.fix),
      suggestions: m.suggestions?.length ?? 0,
    })),
);

if (!issues.length) {
  console.log('✓ theme:report：src 下无主题令牌漂移');
  process.exit(viz.defects.length ? 1 : 0);
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

/**
 * 按 CSS 属性维度聚合（--by=property，仅 no-hardcoded-color）。
 * 规则 message 不带属性名：这里按问题所在行推断——声明行取属性名，class 行按工具类前缀反推。
 * 只做归类展示，不影响 eslint 判定；推断不出时归「其他」。
 */
if (byDimension === 'property') {
  const lineCache = new Map();
  const lineOf = issue => {
    if (!lineCache.has(issue.file)) {
      lineCache.set(issue.file, fs.readFileSync(path.join(projectRoot, issue.file), 'utf8').split('\n'));
    }
    return lineCache.get(issue.file)[issue.line - 1] ?? '';
  };
  /** 工具类前缀 → 等效 CSS 属性 */
  const PROPERTY_BY_PREFIX = {
    bg: 'background',
    text: 'color',
    border: 'border',
    divide: 'border',
    fill: 'fill',
    stroke: 'stroke',
    outline: 'outline',
    shadow: 'box-shadow',
    ring: 'ring',
    from: 'gradient',
    via: 'gradient',
    to: 'gradient',
  };
  /** camelCase 样式键的前缀线索，顺序即优先级 */
  const PROPERTY_HINT = [
    [/background|bgcolor/i, 'background'],
    [/border/i, 'border'],
    [/shadow/i, 'box-shadow'],
    [/colou?r/i, 'color'],
  ];
  /** 任意值工具类整段（含内部 `_`），用于按 token 区间归属命中 */
  const ARBITRARY_TOKEN_RE = /([\w-]+)-\[[^\]]*\]/g;
  /** 声明名：`box-shadow:` / `color="` / `style="background: …"`（容器名在后，取最后一个即为真属性） */
  const DECL_NAME_RE = /([a-zA-Z-]+)\s*(?::\s|=["'])/g;
  const UNKNOWN = '其他（属性 / 脚本）';

  const labelOfPrefix = prefix => {
    if (prefix.startsWith('drop-shadow')) return 'filter: drop-shadow';
    if (prefix.startsWith('ring-offset')) return 'ring-offset';
    return PROPERTY_BY_PREFIX[prefix.split('-')[0]] ?? UNKNOWN;
  };
  /** 业务样式键（iconBgColor / boxShadow）归一成 CSS 属性；已是 kebab CSS 属性（background-color）时原样保留 */
  const asProperty = name => {
    if (!name) return UNKNOWN;
    return PROPERTY_HINT.find(([re]) => re.test(name))?.[1] ?? name;
  };

  const propertyOf = issue => {
    const line = lineOf(issue);
    const cut = Math.max(0, issue.column - 1);
    // class 行：规则按任意值 token 的起点报列号，归属命中所在 token 的前缀。
    // 不能取「色值前最后一个 xxx-[」——rounded-[6px] / px-[4px] / h-[32px] 会抢在真正的颜色类之前命中
    const hit = [...line.matchAll(ARBITRARY_TOKEN_RE)].find(t => cut >= t.index && cut < t.index + t[0].length);
    if (hit) return labelOfPrefix(hit[1]);
    // 声明 / 属性 / 内联 style：取色值之前最后一个声明名
    return asProperty([...line.slice(0, cut).matchAll(DECL_NAME_RE)].at(-1)?.[1]);
  };

  const byProp = new Map();
  for (const issue of issues.filter(i => i.rule === 'theme/no-hardcoded-color')) {
    const prop = propertyOf(issue);
    if (!byProp.has(prop)) byProp.set(prop, []);
    byProp.get(prop).push(issue);
  }
  console.log('【按属性（--by=property，仅 no-hardcoded-color）】');
  for (const [prop, list] of [...byProp].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${prop.padEnd(18)} ${list.length} 处，${new Set(list.map(i => i.file)).size} 个文件`);
  }
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

if (viz.defects.length) process.exitCode = 1;
