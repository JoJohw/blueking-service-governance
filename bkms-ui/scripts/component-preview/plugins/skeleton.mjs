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
 * Skeleton 插件：这类组件是「容器 + 单元 + 组合预设」的族，
 * 单个 wrapper 没有视觉，子组件也不该作为独立清单条目。
 * 参照 Element Plus 的组织方式：一个 Skeleton 配可变骨架项，切换变体即切换 loading 槽内容。
 */
export default {
  name: 'skeleton',

  componentFamily: {
    entry: 'components/skeleton/skeleton',
    variants: [
      {
        label: '形状',
        nodes: [
          { id: 'components/skeleton/skeleton-shape', props: { type: 'rect', width: 160, height: 16 } },
          { id: 'components/skeleton/skeleton-shape', props: { type: 'circle', width: 48, height: 48 } },
        ],
      },
      { label: '段落', nodes: [{ id: 'components/skeleton/skeleton-paragraph' }] },
      { label: '表单项', nodes: [{ id: 'components/skeleton/skeleton-form-item' }] },
      { label: '标签页', nodes: [{ id: 'components/skeleton/skeleton-tab' }] },
      { label: '卡片', nodes: [{ id: 'components/skeleton/skeleton-card', props: { count: 3 } }] },
      { label: '表格', nodes: [{ id: 'components/skeleton/skeleton-table', props: { rows: 6 } }] },
    ],
  },
};
