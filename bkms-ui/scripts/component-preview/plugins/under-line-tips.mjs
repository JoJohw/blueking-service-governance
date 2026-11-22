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
 * UnderLineTips 预览插件：default 是带下划线的提示文本，无 fallback。
 * 真实态给文字样例，结构视图显示占位块，切换才有区别。
 */
export default {
  name: 'components/under-line-tips',

  propOverrides: {
    'components/under-line-tips': {
      description: '鼠标悬停可查看补充说明',
    },
  },

  slotOverrides: {
    'components/under-line-tips': {
      default: { sample: { text: '带下划线的提示文字' } },
    },
  },
};
