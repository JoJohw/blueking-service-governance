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
 * KeyValue 预览插件：行内容全部来自 v-model 数据，modelValue 为空时一行都不渲染，
 * 只剩一个「添加」按钮（middle 插槽在行模板内，也就没机会出现）。
 * 给几条样例键值对，真实态才能看到「key = value + 删除」这组行结构。
 */
export default {
  name: 'components/key-value',

  propOverrides: {
    'components/key-value': {
      modelValue: [
        { key: 'DB_HOST', value: 'mysql.service.consul' },
        { key: 'DB_PORT', value: '3306' },
        { key: 'DB_NAME', value: 'bkms' },
      ],
      minRows: 1,
    },
  },
};
