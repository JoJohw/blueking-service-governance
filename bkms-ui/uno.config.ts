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

import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

// 令牌解析是唯一真源，eslint 主题规则（scripts/theme-lint/plugin.mjs）复用同一份，
// 保证「注册了哪些类」只有一处定义
import { parseScaleColors, parseSemanticShortcuts } from './scripts/theme-lint/map.mjs';

/*
 * ## bkms 令牌注册
 *
 * 构建期从 `src/styles/theme/tokens` 解析令牌，CSS 是单一真源，新增变量零注册。
 *
 * ### 消费方式（两种等价，编译产物相同，均不强制）
 *
 * | 场景 | 写法 | 示例 |
 * | --- | --- | --- |
 * | 模板（推荐） | 注册类 / 别名 | `class="text-bkms-brand-2 bkms-bg-card hover:bkms-bg-active-hover"` |
 * | style 块 / inline style / 动态值 | CSS 变量 | `color: var(--bkms-text-title); background: var(--bkms-bg-card);` |
 *
 * ### 规则
 *
 * 1. class 内只能用注册类，禁止 `text-[var(--bkms-*)]` 任意值（eslint `theme/prefer-uno-class`，例外见规则 5）。
 * 2. semantic.css 已定义的变量优先使用 `bkms-text-*` / `bkms-bg-*` / `bkms-line-*` shortcut；未定义的色阶使用 `text-bkms-*` / `bg-bkms-*` / `border-bkms-*`。
 * 3. 方向边框必须保留工具类方向：`border-t-[#...]` 只能转成 `border-t-bkms-*`，不能压平为 `bkms-line-*`；后者会生成通用 `border-color`。
 * 4. 半透明：纯 var() token 不支持 `/50` alpha 修饰符，用 `color-mix(in srgb, var(--bkms-brand-2) 25%, transparent)`。
 * 5. `--bkms-shadow-*` 未注册为 uno 类（值不以数字结尾），`shadow-[…var(--bkms-shadow-card)]` 是唯一合法例外。
 */
/*
 * 令牌解析（parseScaleColors / parseSemanticShortcuts）在 scripts/theme-lint/map.mjs：
 * eslint 主题规则需要同一份反查表，抽出共享避免两处 regex 漂移。
 *
 * 注册形态注意：色阶必须扁平注册（key = 'bkms-brand-6' 整体）——unocss 按 '-' 切段逐层查 theme，
 * 嵌套 { bkms: { 'brand-6' } } 会被拆成 bkms/brand/6 三段而查不到（实测验证）。
 */

export default defineConfig({
  theme: {
    colors: parseScaleColors(),
  },
  shortcuts: [
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
