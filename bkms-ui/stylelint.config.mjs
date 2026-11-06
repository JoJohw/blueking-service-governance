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

// 主题覆写层：bkui-theme/ 由生成器产出（选择器/属性形态逐字复刻 bkui 产物），
// patches/ 为手写业务补丁（同样复刻 vxe/bkui 等外部产物的选择器形态）。
// （bkui 自身不符合本项目规约：BEM -- 修饰类名、单冒号伪元素、属性顺序等），
// 这些"形态类"规则在复刻件上不适用——选择器一旦按本项目规约改写就不再匹配产物，破坏覆写
const patchesOverride = {
  overrides: [
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
  ],
};

export default Array.isArray(stylelintConfig)
  ? [...stylelintConfig, patchesOverride]
  : { ...stylelintConfig, overrides: [...(stylelintConfig.overrides ?? []), patchesOverride.overrides[0]] };
