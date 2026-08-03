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
import { ref, shallowRef } from 'vue';

import { defineStore } from 'pinia';
import { type AppSpecResourcesOutput } from '~/@types/appspec_resources';
import { type EnvOutputObj } from '~/@types/env';
import { type DeployableImageTagOutputObj } from '~/@types/image';
import { ApiServerService } from '~/api/modules/bkmsserver';
import { useAppDetail } from '~/stores/app-detail';

export const useTrpcDeployStore = defineStore('trpcDeploy', () => {
  const curEnvItem = ref<EnvOutputObj>();
  const imageList = ref<DeployableImageTagOutputObj[]>([]);
  const appDetailStore = useAppDetail();
  const deploySpec = shallowRef<AppSpecResourcesOutput | null>();

  /**
   * 根据镜像 tag 获取完整的镜像信息
   */
  function getCurrentImage(currentImageTag: string) {
    return imageList.value.find(item => item.tag === currentImageTag);
  }

  function updateCurEnvItem(item?: EnvOutputObj) {
    curEnvItem.value = item;
  }

  /**
   * 获取部署规格数据
   */
  async function getDeploySpec() {
    deploySpec.value = await ApiServerService.GetAppDefaultAppSpecResources({
      appID: appDetailStore.appID,
    }).catch(() => null);
  }

  return {
    curEnvItem,
    imageList,
    deploySpec,
    getCurrentImage,
    updateCurEnvItem,
    getDeploySpec,
  };
});
