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
};

// 主题定义层：tokens / 生成覆写 / 补丁里的色值是定义与复刻产物，不适用
const themeDefinitionOverride = {
  files: ['src/styles/theme/**/*.css'],
  rules: {
    'color-no-hex': null,
    'function-disallowed-list': null,
  },
};

// 复刻 bkui/vxe 产物形态，形态类规则（BEM、伪元素冒号、属性顺序）在复刻件上不适用。
// 写成数组而不是 { overrides: [...] }，后续加第二条 patch 直接 push，不用改下面的展开方式。
const patchesOverrides = [
  {
    files: ['src/styles/theme/patches/bkui-theme/**/*.css', 'src/styles/theme/patches/bkms/**/*.css'],
    rules: {
      'no-descending-specificity': null,
      'selector-class-pattern': null,
      'selector-pseudo-element-colon-notation': null,
      'selector-attribute-quotes': null,
      'order/properties-order': null,
    },
  },
];

// 预设只导出对象形态（已确认非数组）。数组配置不支持顶层 files 键，那套"看起来兼容"的分支已删除；
// 上游若改导出形态，这里显式抛错，避免报出来的是难以理解的 unknown key "0"。
if (Array.isArray(stylelintConfig)) {
  throw new TypeError('[stylelint] 预设导出形态已变为数组：请先合并为对象配置再导出（数组配置不支持顶层 files）');
}

export default {
  ...stylelintConfig,
  rules: { ...stylelintConfig.rules, ...consumerRules },
  overrides: [...(stylelintConfig.overrides ?? []), themeDefinitionOverride, ...patchesOverrides],
};
