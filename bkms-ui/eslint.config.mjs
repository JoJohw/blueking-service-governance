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

import bkuiLint from '@blueking/bkui-lint/eslint.mjs';
import css from '@eslint/css';

import themePlugin from './scripts/theme-lint/plugin.mjs';

// The bkui-lint preset enforces a license header belonging to another BlueKing project, so this
// project's own header is enforced instead. Keep the file globs aligned with the preset, since
// that is where the codecc plugin is registered.
const LICENSE_HEADER = `/*
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
`;

// ---------------------------------------------------------------------------
// .css 支持
// bkui-lint 的部分配置对象没有 files（全局生效），ESLint 会把 JS 规则应用到 CSS AST 上而崩溃
// （如 no-irregular-whitespace 调 sourceCode.getAllComments）。这里给这些对象补上作用域，
// 纯 ignores 的全局对象保持不变。
const SCRIPT_FILES = ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue}'];

// 纯 ignores 配置（可能带 name）不能补 files：补了之后全局忽略会退化成「只忽略脚本文件」。
// 用显式字段判断，避免预设给 ignores 对象加 name 字段就被误判成普通配置。
const isIgnoresOnly = config =>
  !config.files &&
  'ignores' in config &&
  !config.rules &&
  !config.plugins &&
  !config.languageOptions &&
  !config.linterOptions &&
  Object.keys(config).every(k => k === 'ignores' || k === 'name');

const scopedPreset = bkuiLint.map(config =>
  !config.files && !isIgnoresOnly(config) ? { ...config, files: SCRIPT_FILES } : config,
);

// 复用预设注册的 codecc 插件（预设里只随 codecc/license 那条注册，作用域只到 js/ts/tsx）。
// 预设若换实现不再注册它，plugins: { codecc: undefined } 只会在首条 .ts 上报 "could not find
// plugin"，看不出根因——这里显式抛错（与 stylelint.config.mjs 的预设形态守卫同风格）。
const codeccPlugin = bkuiLint.find(config => config.plugins?.codecc)?.plugins?.codecc;

if (!codeccPlugin) {
  throw new Error('[eslint] bkui-lint 预设未注册 codecc 插件：license 头规则无法启用，请检查预设实现是否变更');
}

export default [
  ...scopedPreset,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    plugins: { codecc: codeccPlugin },
    rules: {
      'codecc/license': [
        'error',
        {
          license: LICENSE_HEADER,
          pattern: '.*TencentBlueKing is pleased to support the open source community.+',
        },
      ],
    },
  },
  {
    files: SCRIPT_FILES,
    rules: {
      '@typescript-eslint/member-ordering': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    ignores: ['src/api/modules/**/*.ts'],
  },
  // 主题令牌漂移：template + script + <style> 块；.css 见下方 css language 块
  // 存量未清完前 no-hardcoded-color / no-foreign-var 用 warn 当软基线，清零后升 error；
  // no-default-palette / prefer-uno-class 当前零存量，直接 error。
  {
    files: ['**/*.{vue,ts,tsx,js,jsx}'],
    // 测试与 e2e 里的色值是断言/选择器数据，不是样式
    ignores: ['uno.config.ts', 'src/fonts/iconcool.js', 'test/**', 'e2e/**'],
    plugins: { theme: themePlugin },
    rules: {
      'theme/no-hardcoded-color': 'warn',
      'theme/no-foreign-var': 'warn',
      'theme/no-default-palette': 'error',
      'theme/prefer-uno-class': 'error',
    },
  },
  // 独立 .css：@eslint/css 提供 css language，让同一套 theme 规则覆盖样式文件
  {
    files: ['**/*.css'],
    language: 'css/css',
    plugins: { css, theme: themePlugin },
    rules: {
      'theme/no-hardcoded-color': 'warn',
      'theme/no-foreign-var': 'warn',
    },
  },
  // 令牌定义层是复刻产物 / 真源，不适用消费层规则；
  // 桥接层按设计引用 --primary-color 这类 bkui 变量，也不能当外来变量
  {
    files: ['src/styles/theme/**/*.css'],
    rules: {
      'theme/no-hardcoded-color': 'off',
      'theme/no-foreign-var': 'off',
    },
  },
];
