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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

/*
 * ## bkms 令牌注册
 *
 * 构建期从 `src/theme` 解析令牌，CSS 是单一真源，新增变量零注册。
 *
 * ### 消费方式（两种等价，编译产物相同，均不强制）
 *
 * | 场景 | 写法 | 示例 |
 * | --- | --- | --- |
 * | 模板（推荐） | 注册类 / 别名 | `class="text-bkms-brand-2 bg-card hover:bg-active-hover"` |
 * | style 块 / inline style / 动态值 | CSS 变量 | `color: var(--bkms-text-title); background: var(--bkms-bg-card);` |
 *
 * ### 规则
 *
 * 1. 唯一强制项：不写色值字面量（stylelint `color-no-hex` + codemod 管辖）。
 * 2. 模板内任意值 `text-[var(--bkms-neutral-2)]` 合法但不推荐：拼错变量名会静默生成死规则。
 * 3. 半透明：纯 var() token 不支持 `/50` alpha 修饰符，用 `color-mix(in srgb, var(--bkms-brand-2) 25%, transparent)`。
 */
const THEME_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/theme');

// 色阶：colors.css → theme.colors.bkms，类名形如 text-bkms-brand-2 / bg-bkms-cyan-6
function parseScaleColors() {
  const tokens: Record<string, string> = {};
  const SCALE_RE = /--bkms-([a-z-]+)-(\d+)\s*:/g;
  for (const m of fs.readFileSync(path.join(THEME_DIR, 'colors.css'), 'utf8').matchAll(SCALE_RE)) {
    const [, family, step] = m;
    tokens[`${family}-${step}`] = `var(--bkms-${family}-${step})`;
  }
  return { bkms: tokens };
}

// 语义变量：semantic.css → shortcuts 别名（text-title/bg-card 等），line 是边框色需映射为 border 前缀
function parseSemanticShortcuts() {
  const SEMANTIC_UTILITY_PREFIX: Record<string, string> = { text: 'text', line: 'border', bg: 'bg' };
  const SEMANTIC_RE = /--bkms-(text|line|bg)-([a-z-]+)\s*:/g;
  const shortcuts: Array<[string, string]> = [];
  for (const m of fs.readFileSync(path.join(THEME_DIR, 'semantic.css'), 'utf8').matchAll(SEMANTIC_RE)) {
    const [, group, name] = m;
    const utilityPrefix = SEMANTIC_UTILITY_PREFIX[group];
    shortcuts.push([`${utilityPrefix}-${name}`, `${utilityPrefix}-[var(--bkms-${group}-${name})]`]);
  }
  return shortcuts;
}

export default defineConfig({
  theme: {
    colors: parseScaleColors(),
  },
  shortcuts: [
    [
      'btn',
      'px-4 py-1 rounded inline-block bg-teal-700 text-white cursor-pointer !outline-none hover:bg-teal-800 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50',
    ],
    [
      'icon-btn',
      'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600',
    ],
    ['env-tag-development', '!border-none !bg-bkms-brand-6 !text-bkms-brand-2'],
    ['env-tag-test', '!border-none !bg-bkms-cyan-6 !text-bkms-cyan-2'],
    ['env-tag-staging', '!border-none !bg-bkms-warning-6 !text-bkms-warning-1'],
    ['env-tag-production', '!border-none !bg-bkms-success-6 !text-bkms-success-2'],
    // 语义层别名由 parseSemanticShortcuts 自动生成，不加也不影响 var() 消费
    ...parseSemanticShortcuts(),
  ],
  presets: [presetUno(), presetAttributify(), presetTypography()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    'prose',
    'prose-sm',
    'm-auto',
    'text-left',
    'env-tag-development',
    'env-tag-test',
    'env-tag-staging',
    'env-tag-production',
  ],
});
