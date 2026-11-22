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
 * 满宽布局壳预览插件：这些组件在业务里宽度来自父容器（页面整列 / 卡片流），
 * 自己是 w-full、块级卡片或纵向列表，内容宽度代表不了真实形态。
 * 预览默认按内容宽度居中，会把它们压成窄条（w-full 也无处可撑），
 * 标记 fillWidth 后不再居中，直接铺满画布。
 */
export default {
  name: 'fill-width-shells',

  fillWidth: [
    'components/bkms-content',
    'components/card-radio',
    'components/collapse-card',
    // 列表里的可选卡片：业务中整列铺满（Sideslider 内容宽），自身是块级 div
    'components/modules/component-item',
    'components/modules/space-component-item',
    // 代码高亮块：根是 w-full h-full，宽高都来自父容器
    'components/monaco-editor/ms-highlightjs',
  ],
};
