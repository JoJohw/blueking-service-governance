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
 * 满高布局壳预览插件：这些组件在业务里靠父容器的确定高度工作，
 * 根节点是 h-full / height:100%，内部再按 100% 分栏或计算 calc(100% - 40px)。
 * 预览卡的承载层只有宽度没有高度，这里的 100% 就没有参照，组件会塌成一行工具栏的高度。
 * 标记 fillHeight 让预览给一层铺满画布内容区的定高容器，组件按业务里的样子铺开。
 */
export default {
  name: 'full-height-shells',

  fillHeight: [
    'components/custom-navigation',
    'components/monaco-editor/ms-editor',
    'components/monaco-editor/ms-editor-plus',
    'components/monaco-editor/ms-highlightjs',
    'components/scroll-layout',
    // 日志面板：模板里写死 h-full / height 100%，高度完全靠父容器给
    'pages/application/detail/deploy/instance-list/components/instance-log',
  ],

  /**
   * 高度由像素 prop 决定、自身不认 100% 的组件：只标 fillHeight 的话，
   * 外层给了高度参照，组件仍按自己的默认像素高（如 300px）渲染，既不铺开也会溢出画布。
   * 这里声明 prop 名，预览把画布实测可用高回填进去。
   */
  heightProp: {
    'components/monaco-editor/ms-editor-plus': 'containerHeight',
  },
};
