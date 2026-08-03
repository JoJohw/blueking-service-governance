import { ref, shallowRef } from 'vue';

import { random } from 'bkui-vue/lib/shared';
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
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';
import { WorkspaceService } from '~/api/modules/v1/workspace';

import type {
  CreateWorkspaceRequest,
  DeleteWorkspaceRequest,
  ListWorkspacesRequest,
  UpdateWorkspaceInfoRequest,
  WorkspaceInfoOutputObj,
} from '~/@types/v1/workspace';

export const useSpaceStore = defineStore('space', () => {
  const list = ref<WorkspaceInfoOutputObj[]>([]);
  const currentSpace = ref<string>('');
  const routeViewKey = shallowRef(random(10));
  // 当前空间详情
  const workspaceDetail = ref<null | WorkspaceInfoOutputObj>(null);
  const isBoundExistedBKCIProject = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const { t } = useI18n();

  // 空间状态
  enum spaceState {
    Disabled = 'Disabled',
    Ready = 'Ready',
  }

  // 空间分类
  const statusTab = ref('');

  const repositoryTypeMap: Record<string, string> = {
    system: t('系统内置'),
  };

  function getRepositoryTypeName(type?: string) {
    if (type && repositoryTypeMap?.[type]) {
      return repositoryTypeMap[type];
    }
    if (type) {
      return type;
    }
    return '--';
  }

  // 获取空间列表
  async function handleGetWorkspaceList(params?: Partial<ListWorkspacesRequest>) {
    isLoading.value = true;
    list.value = await WorkspaceService.listWorkspaces(params).catch(() => []);
    validateSpace();
    isLoading.value = false;
    return list.value;
  }
  // 创建空间
  async function handleCreateWorkspace(params: CreateWorkspaceRequest) {
    return await WorkspaceService.createWorkspace(params)
      .then(() => true)
      .catch(() => false);
  }
  // 更新空间
  async function handleUpdateWorkspace(params: UpdateWorkspaceInfoRequest) {
    return await WorkspaceService.updateWorkspaceInfo(params)
      .then(() => true)
      .catch(() => false);
  }
  // 删除空间
  async function handleDeleteWorkspace(params: DeleteWorkspaceRequest) {
    return await WorkspaceService.deleteWorkspace(params)
      .then(() => true)
      .catch(() => false);
  }

  // 更新当前space缓存
  function updateCurrentSpace(space: string) {
    currentSpace.value = space;
    validateSpace();
    updateSpaceSource();
  }

  // 更新当前space source
  function updateSpaceSource() {
    const spaceData = list.value.find(space => space.id === currentSpace.value);
    if (spaceData) {
      workspaceDetail.value = spaceData;
      isBoundExistedBKCIProject.value = spaceData.bkSystems?.isBoundExistedBKCIProject ?? false;
    } else {
      workspaceDetail.value = null;
      isBoundExistedBKCIProject.value = false;
    }
  }

  // 校验space正确
  function validateSpace() {
    if (!currentSpace.value || !list.value?.length) return;
    const exist = list.value.find(item => item.id === currentSpace.value);
    if (!exist) {
      console.warn(`${currentSpace.value} is not in workspace list`);
      currentSpace.value = '';
    }
  }

  function handleChangeStatusTab(type: string) {
    statusTab.value = type;
  }

  function refreshRouteViewKey() {
    routeViewKey.value = random(10);
  }

  return {
    list,
    currentSpace,
    workspaceDetail,
    isBoundExistedBKCIProject,
    isLoading,
    statusTab,
    spaceState,
    routeViewKey,
    getRepositoryTypeName,
    validateSpace,
    updateCurrentSpace,
    handleGetWorkspaceList,
    handleCreateWorkspace,
    handleUpdateWorkspace,
    handleDeleteWorkspace,
    handleChangeStatusTab,
    refreshRouteViewKey,
  };
});
