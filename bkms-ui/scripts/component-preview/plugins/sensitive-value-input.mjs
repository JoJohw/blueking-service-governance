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
 * SensitiveValueInput 预览插件：通用推导把 mode 联合类型取第一个值 create，
 * 那只是普通输入框；固定为 edit 才能看到「密文圆点占位 → 聚焦选中 → 输入 → 恢复」状态链。
 */
export default {
  name: 'sensitive-value-input',

  propOverrides: {
    'components/editable-variable-table/sensitive-value-input': {
      mode: 'edit',
    },
  },
};
