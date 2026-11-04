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

import { bkmsColorTokens } from './uno.bkms-theme';

export default defineConfig({
  theme: {
    colors: {
      bkms: bkmsColorTokens,
    },
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
    // #E5FEFF 无规范映射（pending-design 建议 cyan-6，待设计拍板后改 !bg-bkms-cyan-6）
    ['env-tag-test', '!border-none !bg-[#E5FEFF] !text-bkms-cyan-2'],
    ['env-tag-staging', '!border-none !bg-bkms-warning-6 !text-bkms-warning-1'],
    ['env-tag-production', '!border-none !bg-bkms-success-6 !text-bkms-success-2'],
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
