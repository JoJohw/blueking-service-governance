/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { ref } from 'vue';

import { ApiServerService } from '~/api/modules/bkmsserver';
import { EnvService } from '~/api/modules/v1/env';
import { i18n } from '~/modules/i18n';
import { useSpaceStore } from '~/stores/space';

import type { EnvDetailOutput, EnvOutput, FeatureEnvSourceOutput } from '~/@types/v1/env';

/** listAppEnvs 可能携带来源环境对象，用于兼容不同空间的特性环境返回结构。 */
export type EnvWithSource = EnvOutput & {
  sourceEnv?: FeatureEnvSourceOutput;
};

export interface StandardEnvMap {
  byDisplayName: Map<string, EnvOutput>;
  byID: Map<string, EnvOutput>;
  byName: Map<string, EnvOutput>;
}

interface EnvTypeConfig {
  name: string;
  theme: TagTheme;
}

type TagTheme = 'danger' | 'info' | 'success' | 'warning';

export const envTypeMap: Record<string, EnvTypeConfig> = {
  development: { name: i18n.global.t('开发'), theme: 'info' },
  test: { name: i18n.global.t('测试'), theme: 'warning' },
  production: { name: i18n.global.t('生产'), theme: 'success' },
};

/** 建立标准环境索引，避免 id/name/displayName 的 key 空间互相冲突。 */
export function buildStandardEnvMap(standardEnvs: EnvOutput[]) {
  const standardEnvMap: StandardEnvMap = {
    byDisplayName: new Map(),
    byID: new Map(),
    byName: new Map(),
  };
  standardEnvs.forEach(env => {
    addStandardEnvMapItem(standardEnvMap.byID, env.id, env);
    addStandardEnvMapItem(standardEnvMap.byName, env.name, env);
    addStandardEnvMapItem(standardEnvMap.byDisplayName, env.displayName, env);
  });
  return standardEnvMap;
}

/** 获取特性环境的来源标准环境，优先 sourceEnvID，兼容 sourceEnv 对象。 */
export function getFeatureSourceEnv(env: EnvOutput, standardEnvMap: StandardEnvMap) {
  const featureEnv = env as EnvWithSource;
  if (featureEnv.sourceEnvID) {
    const sourceEnv = standardEnvMap.byID.get(featureEnv.sourceEnvID);
    if (sourceEnv) return sourceEnv;
  }
  if (featureEnv.sourceEnv?.id) {
    const sourceEnv = standardEnvMap.byID.get(featureEnv.sourceEnv.id);
    if (sourceEnv) return sourceEnv;
  }
  if (featureEnv.sourceEnv?.name) {
    const sourceEnv = standardEnvMap.byName.get(featureEnv.sourceEnv.name);
    if (sourceEnv) return sourceEnv;
  }
  if (featureEnv.sourceEnv?.displayName) {
    return standardEnvMap.byDisplayName.get(featureEnv.sourceEnv.displayName);
  }
}

export default function useEnvManager() {
  const spaceStore = useSpaceStore();

  const envDetail = ref<EnvDetailOutput>();
  const loading = ref<boolean>(false);
  const envList = ref<EnvOutput[]>([]);
  const envComponents = ref<Record<string, unknown>>({});
  const envNameMapping = ref<Record<string, string>>({});

  /**
   * 获取环境详情
   * @param env 环境 ID
   */
  async function handleGetEnvDetail(env: string) {
    if (!env) return;
    loading.value = true;
    const data = await ApiServerService.GetEnv({
      envID: env,
    }).catch(() => {});
    loading.value = false;
    if (!data) return;

    envDetail.value = data;
    return envDetail.value;
  }

  /**
   * 获取环境列表
   */
  async function handleGetEnvList() {
    loading.value = true;
    const data = await ApiServerService.ListEnvs({
      workspaceID: spaceStore.currentSpace,
    }).catch(() => []);
    loading.value = false;
    envList.value = data;
    return envList.value;
  }

  /** 获取当前应用可用的环境列表，包含标准环境及应用专用的特性环境。 */
  async function getAppEnvList(appID: string) {
    if (!appID) {
      envList.value = [];
      return envList.value;
    }

    loading.value = true;
    const data = await EnvService.listAppEnvs({ appID }).catch(() => []);
    loading.value = false;
    envList.value = data;
    return envList.value;
  }

  /**
   * 获取环境组件列表
   * @param env 环境 ID
   */
  async function handleGetEnvComponents(env: string) {
    if (!env) return;
    loading.value = true;
    const listEnvComps = (
      ApiServerService as {
        ListEnvComps?: (params: { envID: string }) => Promise<Record<string, unknown>>;
      }
    ).ListEnvComps;
    const data = listEnvComps ? await listEnvComps({ envID: env }).catch(() => ({})) : {};
    loading.value = false;
    envComponents.value = data;
    return envComponents.value;
  }

  /** 生成环境名称 - 环境展示名称的映射 */
  async function generateEnvNameMapping() {
    const mapping: Record<string, string> = {};
    envList.value.forEach((env: EnvOutput) => {
      if (env.name) {
        mapping[env.name] = env.displayName || env.name;
      }
    });
    envNameMapping.value = mapping;
    return mapping;
  }

  return {
    envDetail,
    loading,
    envList,
    envComponents,
    envNameMapping,
    handleGetEnvDetail,
    handleGetEnvList,
    getAppEnvList,
    handleGetEnvComponents,
    generateEnvNameMapping,
  };
}

function addStandardEnvMapItem(map: Map<string, EnvOutput>, key: string | undefined, env: EnvOutput) {
  if (key && !map.has(key)) {
    map.set(key, env);
  }
}
