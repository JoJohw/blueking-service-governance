import { ref, watch } from 'vue';

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
import { useLocalStorage } from '@vueuse/core';
import { fromPairs, orderBy, toPairs } from 'lodash-es';
import { defineStore } from 'pinia';

import { useSpaceStore } from './space';

import type { EnvOutputObj } from '~/@types/env';

interface AppEnvSelection {
  mode: 'multi' | 'single';
  selectedEnvs: string[];
  updatedAt: number;
}

const APP_ENV_SELECTION_STORAGE_KEY = 'bkms_deploy_env_app_selections';
const APP_ENV_SELECTION_LIMIT = 30;

export const useDeployEnvStore = defineStore('deploy-env', () => {
  // 当前选中的环境（单选模式）
  const currentEnv = ref<string>('');
  // 多选环境列表
  const selectedEnvs = ref<string[]>([]);
  // 环境列表（供多环境模式使用）
  const envList = ref<EnvOutputObj[]>([]);
  const appEnvSelections = useLocalStorage<Record<string, AppEnvSelection>>(APP_ENV_SELECTION_STORAGE_KEY, {});
  // 获取空间 store
  const spaceStore = useSpaceStore();

  function updateCurrentEnv(env: string) {
    currentEnv.value = env;
  }

  // 更新多选环境列表
  function updateSelectedEnvs(envs: string[]) {
    selectedEnvs.value = envs;
  }

  // 更新环境列表
  function updateEnvList(list: EnvOutputObj[]) {
    envList.value = list;
  }

  function getAppEnvSelection(scopeKey: string) {
    return appEnvSelections.value[scopeKey];
  }

  function updateAppEnvSelection(scopeKey: string, payload: Partial<Pick<AppEnvSelection, 'mode' | 'selectedEnvs'>>) {
    if (!scopeKey) return;
    const current = appEnvSelections.value[scopeKey];
    const nextSelections = {
      ...appEnvSelections.value,
      [scopeKey]: {
        mode: payload.mode ?? current?.mode ?? 'single',
        selectedEnvs: payload.selectedEnvs ?? current?.selectedEnvs ?? [],
        updatedAt: Date.now(),
      },
    };
    const limitedSelections = orderBy(toPairs(nextSelections), ([, selection]) => selection.updatedAt, 'desc').slice(
      0,
      APP_ENV_SELECTION_LIMIT,
    );
    appEnvSelections.value = fromPairs(limitedSelections) as Record<string, AppEnvSelection>;
  }

  function clearCurrentEnv() {
    currentEnv.value = '';
    selectedEnvs.value = [];
  }

  // 当空间切换时清空环境缓存
  watch(
    () => spaceStore.currentSpace,
    (newSpace, oldSpace) => {
      if (newSpace !== oldSpace) {
        clearCurrentEnv();
        envList.value = [];
      }
    },
  );

  return {
    currentEnv,
    selectedEnvs,
    envList,
    appEnvSelections,
    updateCurrentEnv,
    updateSelectedEnvs,
    updateEnvList,
    getAppEnvSelection,
    updateAppEnvSelection,
    clearCurrentEnv,
  };
});
