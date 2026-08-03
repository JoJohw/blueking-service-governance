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

import { type HelmDeployRecordOutputObj } from '~/@types/v1/deploy';
import { type TrafficLaneOutput } from '~/@types/v1/env';
import { type ChartVersionOutputObj } from '~/@types/v1/helm-charts';
import { DeployService, EnvService, HelmChartsService } from '~/api/modules/v1';
import { useDeployStatusMap } from '~/composables/use-deploy-status';
import { useAppDetail } from '~/stores/app-detail';
import { useSpaceStore } from '~/stores/space';

interface IPrams {
  envName: string;
  keyword?: string;
  page: number;
  pageSize: number;
  trafficLaneName?: string;
}

export const deployHistoryList = ref<HelmDeployRecordOutputObj[]>([]);
export const count = ref<number>(0);
// 最新部署状态
export const latestDeployStatus = ref<string>('');

export const chartList = ref<ChartVersionOutputObj[]>([]);

export const useHelmDeploy = () => {
  const spaceStore = useSpaceStore();
  const { currentSpace } = spaceStore;
  const { helmStatusTextMap: statusTextMap, helmStatusColorMap: statusColorMap } = useDeployStatusMap();
  // 获取部署历史
  async function handleListDeployHistories(params: IPrams) {
    if (!params?.envName || !currentSpace) return;
    const res = await DeployService.listHelmDeployRecords({
      ...params,
      appID: appDetailStore.appID,
      keyword: params.keyword || '',
    }).catch(() => ({ count: '0', results: [] }));
    deployHistoryList.value = res?.results || [];
    count.value = Number(res.count);
    if (params.page === 1 && res.results && res.results.length > 0) {
      updateLatestDeployStatusFromList(res.results);
    }
  }

  // 从列表中更新最新部署状态
  function updateLatestDeployStatusFromList(list: HelmDeployRecordOutputObj[]) {
    if (!list.length) {
      latestDeployStatus.value = '';
      return;
    }
    const latestDeploy = list.reduce((prev, current) =>
      new Date(prev.updatedAt!) > new Date(current.updatedAt!) ? prev : current,
    );
    latestDeployStatus.value = latestDeploy.status!;
  }

  // 泳道列表
  const laneList = ref<TrafficLaneOutput[]>([]);
  // 获取当前环境下的泳道列表
  async function handleGetLanesList(env?: string) {
    if (!env) return;
    const res = await EnvService.listEnvTrafficLanes({
      workspaceID: currentSpace,
      envName: env,
    }).catch(() => []);
    laneList.value = res;
  }

  const appDetailStore = useAppDetail();
  // Chart 版本
  async function handleGetChartList(appID?: string) {
    chartList.value = await HelmChartsService.listChartVersions({
      appID: appID || appDetailStore.appID,
    }).catch(() => []);
  }

  return {
    chartList,
    laneList,
    deployHistoryList,
    count,
    latestDeployStatus,
    statusColorMap,
    statusTextMap,
    handleListDeployHistories,
    handleGetChartList,
    handleGetLanesList,
  };
};
