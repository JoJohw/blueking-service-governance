/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

import stylelintConfig from '@blueking/bkui-lint/stylelint.mjs';

// 消费层禁止色值字面量，暂为 warning，存量清完后升 error。半透明用 color-mix（uno.config 规则 4）
const consumerRules = {
  'color-no-hex': [true, { severity: 'warning' }],
  'function-disallowed-list': [['rgb', 'rgba', 'hsl', 'hsla'], { severity: 'warning' }],
  // BEM 的 __element / --modifier 是存量组件的既有命名，放开这两段但保留普通类名 kebab 约束
  'selector-class-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*((__|--)[a-z0-9]+(-[a-z0-9]+)*)*$', {}],
  // 圆角多值简写（含多个 var() 令牌）无法表达语义归属、换档要逐角跟改：
  // 一律 border-radius 写整体语义 + border-start/end-*-radius 写单角覆盖
  'declaration-property-value-disallowed-list': [
    { '/^border-radius$/': [/\s/] },
    { message: '圆角多值简写请拆开：整体语义写 border-radius，单角覆盖写 border-start/end-*-radius' },
  ],
};

// 主题定义层：tokens / 生成覆写 / 补丁里的色值是定义与复刻产物，不适用
const themeDefinitionOverride = {
  files: ['src/styles/theme/**/*.css'],
  rules: {
    'color-no-hex': null,
    'function-disallowed-list': null,
  },
};

// palette 骨架层：shell.css 是工具自身 chrome 的固定色快照，同属定义层
const paletteShellOverride = {
  files: ['dev/palette/src/shell.css'],
  rules: {
    'color-no-hex': null,
  },
};

// 复刻 bkui/vxe 产物形态，形态类规则（BEM、伪元素冒号、属性顺序）在复刻件上不适用。
// 写成数组而不是 { overrides: [...] }，后续加第二条 patch 直接 push，不用改下面的展开方式。
const patchesOverrides = [
  {
    files: [
      'src/styles/theme/patches/bkui-theme/**/*.css',
      'src/styles/theme/patches/vendor/**/*.css',
      'src/styles/theme/patches/ua-fill/**/*.css',
    ],
    rules: {
      'no-descending-specificity': null,
      'no-duplicate-selectors': null,
      'selector-class-pattern': null,
      'selector-pseudo-element-colon-notation': null,
      'selector-attribute-quotes': null,
      'order/properties-order': null,
      'declaration-property-value-disallowed-list': null,
    },
  },
];

// 手写覆写层不是复刻产物：形态类规则同样不适用，但圆角写法纪律必须生效
const handwrittenOverride = {
  files: ['src/styles/overrides.css'],
  rules: {
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'selector-class-pattern': null,
    'selector-pseudo-element-colon-notation': null,
    'selector-attribute-quotes': null,
    'order/properties-order': null,
  },
};

// 预设只导出对象形态（已确认非数组）。数组配置不支持顶层 files 键，那套"看起来兼容"的分支已删除；
// 上游若改导出形态，这里显式抛错，避免报出来的是难以理解的 unknown key "0"。
if (Array.isArray(stylelintConfig)) {
  throw new TypeError('[stylelint] 预设导出形态已变为数组：请先合并为对象配置再导出（数组配置不支持顶层 files）');
}

export default {
  ...stylelintConfig,
  // 图标库是生成物，类名与声明顺序都由图标名决定，整体不参与业务样式规则
  ignoreFiles: ['src/fonts/**'],
  rules: { ...stylelintConfig.rules, ...consumerRules },
  overrides: [
    ...(stylelintConfig.overrides ?? []),
    themeDefinitionOverride,
    paletteShellOverride,
    handwrittenOverride,
    ...patchesOverrides,
  ],
};
