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
 * TableException 预览插件：用 family 变体切换 type，覆盖空数据/搜索空/异常三种状态。
 * type slot 走 Exception 自带插图，真实态不传。
 */
export default {
  name: 'components/table-exception',

  componentFamily: {
    entry: 'components/table-exception',
    variants: [
      { label: '空数据', nodes: [], props: { type: 'empty' } },
      { label: '搜索无结果', nodes: [], props: { type: 'search' } },
      { label: '加载异常', nodes: [], props: { type: 'error' } },
    ],
  },
};
