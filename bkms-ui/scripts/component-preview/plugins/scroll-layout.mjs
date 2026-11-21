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
 * ScrollLayout 预览插件：通用占位块太小，撑不出内容区滚动。
 * 给默认 slot 一段撑高内容、给 footer 一个说明块，让「内容滚动 + footer 固定」在预览里可见。
 */
export default {
  name: 'scroll-layout',

  slotSamples: {
    'scroll-layout': {
      default: [{ text: '下面这些块用于撑高内容区，观察内容滚动与 footer 固定效果' }, { repeat: 12, text: '内容块' }],
      footer: { text: '固定底部操作区 footer' },
    },
  },
};
