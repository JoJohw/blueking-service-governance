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
 * 环境选择域的预览样例插件。
 *
 * props.mjs / api-mock.mjs 只做通用推导并在约定阶段回调插件；
 * 这里补齐 TS 表达不出来的业务语义：环境树、状态分布、部署状态与环境行的关联。
 */
const STATUS_VALUES = ['Ready', 'NotReady'];
const ENVS_KEY = 'GET /apps/{appID}/envs';
const DEPLOY_STATUSES_KEY = 'GET /apps/{appID}/deploy-statuses';

/** 所有接口样例生成后调用，按同一下标把部署状态挂到对应环境行 */
function transformApiSamples(entries) {
  const envs = entries.get(ENVS_KEY)?.sample;
  const statuses = entries.get(DEPLOY_STATUSES_KEY)?.sample;
  if (!Array.isArray(envs) || !envs.length || !Array.isArray(statuses)) return;
  statuses.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const env = envs[index % envs.length];
    item.id = env.id;
    item.name = env.name;
  });
}

/** EnvOutput[] 展开完成后调用，此时 id/name 已带序号后缀 */
function transformEnvArray(items) {
  if (items.length < 2 || typeof items[0]?.id !== 'string') return items;
  const result = items.map((item, index) => ({ ...item, status: STATUS_VALUES[index % STATUS_VALUES.length] }));
  const last = result.length - 1;
  result[last] = { ...result[last], kind: 'feature', sourceEnvID: result[0].id };
  return result;
}

export default {
  name: 'env-selector',

  /** 通用机制消费的数据：宽泛 string 字段的业务已知枚举候选 */
  enumOverrides: {
    // 环境类别，见 src/@types/v1/env.d.ts 注释：standard 或 feature
    'EnvOutput.kind': ['standard', 'feature'],
    'EnvOutput.status': STATUS_VALUES,
    // 环境类型，注释未列取值，取自组件里的 envTypeOrder
    'EnvOutput.type': ['development', 'test', 'staging', 'production'],
    // 部署状态取自 src/common/enums/deploy.ts 的 APP_DEPLOY_STATUS
    'AppDeployedEnvOutputObj.deployStatus': ['deployed', 'deploying', 'failed', 'rolled-back'],
  },

  transformArrayItems(items, { typeName }) {
    return typeName === 'EnvOutput' ? transformEnvArray(items) : items;
  },

  transformSamples: transformApiSamples,
};
