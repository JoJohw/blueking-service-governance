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
 * TabHeader 预览插件：title-extra 插槽在标题行内、与 title 同行，
 * 默认填充块是占满宽度的块级容器，会把标题挤成分行，所以声明 inline 保留填充块但内联显示。
 */
export default {
  name: 'components/tab-header',

  slotOverrides: {
    'components/tab-header': {
      'title-extra': { inline: true },
    },
  },
};
