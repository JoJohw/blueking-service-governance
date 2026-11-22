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
 * Tab 预览插件：通用推导只给 1 个 tab 且 icon 为占位文本，看不出切换与状态差异。
 * 给多个 tab 覆盖激活/普通/禁用/带图标状态，active 指向其中一个 name。
 */
export default {
  name: 'components/tab',

  propOverrides: {
    // key 必须是清单 id（相对 src 的完整路径），写成裸组件名会静默不生效
    'components/tab': {
      active: 'basic',
      tabs: [
        { name: 'basic', label: '基本信息' },
        { name: 'config', label: '配置' },
        { name: 'resource', label: '资源' },
        { name: 'disabled', label: '禁用项', disabled: true },
        { name: 'icon', label: '带图标', icon: 'bkms-icon bkms-icon-setting-line' },
      ],
    },
  },
};
