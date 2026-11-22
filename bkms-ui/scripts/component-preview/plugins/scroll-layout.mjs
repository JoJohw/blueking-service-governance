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
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * ScrollLayout 预览插件：它的核心行为是「内容溢出才吸底，不溢出就跟随文档流」，
 * 单一内容量只能看到其中一种。这里声明两个变体，标题栏可切换，两种 footer 位置直接对比。
 * 画布内容区约 300px，单块占位（28px 块 + 8px 间距）高 36px：2 块远低于可用高，20 块必然溢出。
 */
export default {
  name: 'components/scroll-layout',

  slotOverrides: {
    'components/scroll-layout': {
      default: {
        sample: [{ text: '下面这些块用于撑高内容区，观察内容滚动与 footer 固定效果' }, { repeat: 12, text: '内容块' }],
      },
      footer: { sample: { text: '固定底部操作区 footer' } },
    },
  },

  previewVariants: {
    'components/scroll-layout': [
      {
        label: '内容不溢出',
        slotOverrides: {
          default: { sample: { repeat: 2, text: '内容块（不足一屏）' } },
        },
      },
      {
        label: '内容溢出',
        slotOverrides: {
          default: {
            sample: [
              { text: '下面这些块用于撑高内容区，观察内容滚动与 footer 固定效果' },
              { repeat: 20, text: '内容块' },
            ],
          },
        },
      },
    ],
  },
};
