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
 * OverflowCtrl 预览插件：通用占位块不会横向溢出，箭头恒隐藏。
 * 用一排固定宽度的块撑出横向滚动，让箭头显隐与点击滚动都能看到。
 *
 * 箭头显隐完全由内容宽度决定，单一样例只能看到一种状态，因此拆成溢出 / 不溢出两组变体在标题栏切换；
 * 结构视图把 slot 换成占位块后宽度信息丢失、箭头恒隐藏，已在 config 的 hideSlotStructure 里隐藏。
 * 单块宽 120px、间距 8px：2 块远小于画布可用宽，12 块必然超出。
 */
export default {
  name: 'components/overflow-ctrl',

  slotOverrides: {
    'components/overflow-ctrl': {
      default: {
        sample: [
          { text: '下面这排块用于触发横向溢出，出现箭头后可点击左右滚动' },
          { row: true, repeat: 12, text: '环境', width: 120 },
        ],
      },
    },
  },

  previewVariants: {
    'components/overflow-ctrl': [
      {
        label: '内容不溢出',
        slotOverrides: {
          default: { sample: [{ row: true, repeat: 2, text: '环境', width: 120 }] },
        },
      },
      {
        label: '内容溢出',
        slotOverrides: {
          default: {
            sample: [
              { text: '下面这排块用于触发横向溢出，出现箭头后可点击左右滚动' },
              { row: true, repeat: 12, text: '环境', width: 120 },
            ],
          },
        },
      },
    ],
  },
};
