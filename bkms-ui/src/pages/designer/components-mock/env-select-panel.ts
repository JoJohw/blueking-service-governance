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

import { markRaw } from 'vue';
import type { Component } from 'vue';

import { AppService } from '~/api/modules/v1/app';
import { EnvService } from '~/api/modules/v1/env';
import EnvSelectPanel from '~/components/env-select-panel/env-select-panel.vue';
import { useAppDetail } from '~/stores/app-detail';

import type { AppDeployedEnvOutputObj } from '~/@types/v1/app';
import type { EnvOutput } from '~/@types/v1/env';

export interface ComponentMock {
  component: Component;
  id: string;
  label: string;
  variants: Array<{ label: string; props: Record<string, unknown> }>;
  setup: () => () => void;
}

const MOCK_ENV_LIST: EnvOutput[] = [
  { id: 'env-dev', name: 'dev', displayName: '开发环境', type: 'development', kind: 'standard', status: 'Ready' },
  {
    id: 'env-dev-feature',
    name: 'dev-feature',
    displayName: '开发-特性环境',
    type: 'development',
    kind: 'feature',
    status: 'Ready',
    ownerAppID: 'preview-app',
    sourceEnvID: 'env-dev',
  },
  { id: 'env-test', name: 'test', displayName: '测试环境', type: 'test', kind: 'standard', status: 'Ready' },
  {
    id: 'env-staging',
    name: 'staging',
    displayName: '预发布环境',
    type: 'staging',
    kind: 'standard',
    status: 'NotReady',
  },
  { id: 'env-prod', name: 'prod', displayName: '生产环境', type: 'production', kind: 'standard', status: 'Ready' },
];

const MOCK_DEPLOY_STATUSES: AppDeployedEnvOutputObj[] = [
  { id: 'env-dev', name: 'dev', deployStatus: 'deployed' },
  { id: 'env-test', name: 'test', deployStatus: 'failed' },
  { id: 'env-prod', name: 'prod', deployStatus: 'deployed' },
];

const mock: ComponentMock = {
  id: 'env-select-panel',
  label: '环境选择器',
  component: markRaw(EnvSelectPanel),
  variants: [
    {
      label: '单选',
      props: { modelValue: 'dev', columns: 2, multiSelectable: false, showEnvPrefix: true },
    },
    {
      label: '多选',
      props: { modelValues: ['dev', 'test'], mode: 'multi', columns: 4, multiSelectable: true },
    },
  ],
  setup() {
    const appDetail = useAppDetail();
    const original = {
      listAppEnvs: EnvService.listAppEnvs,
      getAppDeployStatuses: AppService.getAppDeployStatuses,
      appID: appDetail.appID,
    };

    EnvService.listAppEnvs = (async () => MOCK_ENV_LIST) as typeof EnvService.listAppEnvs;
    AppService.getAppDeployStatuses = (async () => MOCK_DEPLOY_STATUSES) as typeof AppService.getAppDeployStatuses;
    appDetail.updateAppID('preview-app');

    return () => {
      EnvService.listAppEnvs = original.listAppEnvs;
      AppService.getAppDeployStatuses = original.getAppDeployStatuses;
      appDetail.updateAppID(original.appID);
    };
  },
};

export default mock;
