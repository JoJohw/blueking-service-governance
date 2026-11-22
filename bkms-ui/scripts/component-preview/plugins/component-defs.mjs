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
 * components-sideSlider 预览插件：通用样例只有一条占位组件定义，看不出「选择组件」列表。
 * 这里补多条组件定义与其空间实例，且保留部署类组件为可选（disabledFn 在 catalog 中返回 falsy）。
 */
const COMPONENT_DEFS_KEY = 'GET /component-defs';
const WORKSPACE_COMPONENTS_KEY = 'GET /workspaces/{workspaceID}/components';

const componentDefs = [
  {
    name: 'game-deployment',
    displayName: 'GameDeployment 部署',
    description: '通过 GameDeployment 管理应用工作负载与灰度发布',
    version: '1.0.0',
    isBuiltin: true,
    appCompInstanceCount: 0,
    workspaceCompInstanceCount: 1,
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00',
    creator: 'bkms',
    updater: 'bkms',
    managedByWorkspaceIDs: [],
    patchers: ['replicas', 'image'],
    specs: ['Deployment'],
    scopeType: 'workspace',
    scopeWorkspaceIDs: [],
    properties: [
      { name: 'replicas', description: '实例副本数', type: 'INT', defaultValue: 2, options: [] },
      { name: 'image', description: '容器镜像', type: 'STRING', defaultValue: 'game:latest', options: [] },
    ],
  },
  {
    name: 'deployment',
    displayName: 'Kubernetes Deployment',
    description: '标准 Kubernetes Deployment 资源配置',
    version: '1.2.0',
    isBuiltin: true,
    appCompInstanceCount: 1,
    workspaceCompInstanceCount: 0,
    createdAt: '2026-01-02 00:00:00',
    updatedAt: '2026-01-02 00:00:00',
    creator: 'bkms',
    updater: 'bkms',
    managedByWorkspaceIDs: [],
    patchers: ['replicas'],
    specs: ['Deployment'],
    scopeType: 'workspace',
    scopeWorkspaceIDs: [],
    properties: [
      { name: 'replicas', description: '实例副本数', type: 'INT', defaultValue: 1, options: [] },
      {
        name: 'publishMode',
        description: '发布方式',
        type: 'SELECT',
        defaultValue: 'rolling',
        options: [
          { label: '滚动更新', value: 'rolling' },
          { label: '蓝绿发布', value: 'blue-green' },
        ],
      },
    ],
  },
  {
    name: 'release-strategy',
    displayName: '发布策略',
    description: '按环境配置灰度与分批发布策略',
    version: '0.9.0',
    isBuiltin: false,
    appCompInstanceCount: 0,
    workspaceCompInstanceCount: 1,
    createdAt: '2026-01-03 00:00:00',
    updatedAt: '2026-01-03 00:00:00',
    creator: 'bkms',
    updater: 'bkms',
    managedByWorkspaceIDs: [],
    patchers: [],
    specs: [],
    scopeType: 'workspace',
    scopeWorkspaceIDs: [],
    properties: [
      { name: 'batchCount', description: '发布批次数', type: 'INT', defaultValue: 3, options: [] },
      { name: 'enableGray', description: '启用灰度', type: 'BOOL', defaultValue: true, options: [] },
    ],
  },
  {
    name: 'storage-claim',
    displayName: '存储声明',
    description: '为应用挂载持久化存储卷',
    version: '1.0.1',
    isBuiltin: false,
    appCompInstanceCount: 0,
    workspaceCompInstanceCount: 0,
    createdAt: '2026-01-04 00:00:00',
    updatedAt: '2026-01-04 00:00:00',
    creator: 'bkms',
    updater: 'bkms',
    managedByWorkspaceIDs: [],
    patchers: [],
    specs: ['PersistentVolumeClaim'],
    scopeType: 'workspace',
    scopeWorkspaceIDs: [],
    properties: [
      { name: 'size', description: '存储容量', type: 'STRING', defaultValue: '10Gi', options: [] },
      {
        name: 'accessMode',
        description: '访问模式',
        type: 'SELECT',
        defaultValue: 'ReadWriteOnce',
        options: [
          { label: '单节点读写', value: 'ReadWriteOnce' },
          { label: '多节点只读', value: 'ReadOnlyMany' },
        ],
      },
    ],
  },
];

const workspaceComponents = [
  {
    name: 'game-deploy-prod',
    type: 'game-deployment',
    properties: { replicas: 3, image: 'game:prod' },
    scopeType: 'global',
    scopeEnvNames: [],
    refAppIDs: [],
    createdAt: '2026-01-05 00:00:00',
    updatedAt: '2026-01-05 00:00:00',
    version: '1.0.0',
    workspaceID: 'preview-workspace',
  },
  {
    name: 'game-deploy-feature',
    type: 'game-deployment',
    properties: { replicas: 1, image: 'game:feature' },
    scopeType: 'environment',
    scopeEnvNames: ['占位文本 1', '占位文本 4'],
    refAppIDs: [],
    createdAt: '2026-01-06 00:00:00',
    updatedAt: '2026-01-06 00:00:00',
    version: '1.0.0',
    workspaceID: 'preview-workspace',
  },
  {
    name: 'gray-strategy',
    type: 'release-strategy',
    properties: { batchCount: 2, enableGray: true },
    scopeType: 'global',
    scopeEnvNames: [],
    refAppIDs: [],
    createdAt: '2026-01-07 00:00:00',
    updatedAt: '2026-01-07 00:00:00',
    version: '0.9.0',
    workspaceID: 'preview-workspace',
  },
];

export default {
  name: 'component-defs',

  propOverrides: {
    // 通用 fn 占位 () => '' 传给 boolean prop 会被 Vue 转成 true，导致所有「选择」按钮禁用。
    // 预览里只禁用第二个部署组件，保留一个可选部署组件，同时留一张禁用态展示提示文案。
    'components/modules/components-sideSlider': {
      disabledFn: item => item?.name === 'deployment',
    },
  },

  transformSamples(entries) {
    entries.set(COMPONENT_DEFS_KEY, {
      key: COMPONENT_DEFS_KEY,
      sample: componentDefs,
      source: 'plugins/component-defs.mjs',
    });
    entries.set(WORKSPACE_COMPONENTS_KEY, {
      key: WORKSPACE_COMPONENTS_KEY,
      sample: workspaceComponents,
      source: 'plugins/component-defs.mjs',
    });
  },
};
