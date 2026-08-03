import { ref } from 'vue';

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
import { ApiServerService } from '~/api/modules/bkmsserver';

import type { AppDetailOutputObj } from '~/@types/app';
import type { IAppType } from '~/composables/app-type';

// 保留 re-export，兼容已有引用
export type { AppType, IAppType } from '~/composables/app-type';

export const useAppDetail = defineStore('appDetail', () => {
  const app = ref('');
  const appType = ref<IAppType>('');
  const appID = ref('');
  // 应用详情
  const appDetail = ref<AppDetailOutputObj | null>(null);
  const loading = ref(false);
  // 缓存请求 Promise,key 为 appID
  const fetchPromiseCache = new Map<string, Promise<AppDetailOutputObj | null>>();
  // 瞬态导航标记:用于跨路由跳转时,传递「去配置」的来源(source)
  const pendingBuilderSource = ref<null | string>(null);

  // 更新当前app缓存
  function updateAppName(appName: string) {
    app.value = appName;
  }

  // 更新当前app类型
  function updateAppType(type: IAppType) {
    appType.value = type;
  }

  // 更新当前 appID
  function updateAppID(id: string) {
    appID.value = id;
  }

  // 获取并保存应用详情
  async function fetchAppDetail(appId?: string) {
    const targetAppId = appId || appID.value;

    if (!targetAppId) return null;

    // 如果正在请求同一应用,复用 Promise 避免重复请求
    const cachedPromise = fetchPromiseCache.get(targetAppId);
    if (cachedPromise) {
      return cachedPromise;
    }

    // 创建新请求
    const fetchPromise = (async () => {
      try {
        loading.value = true;
        const res = await ApiServerService.GetApp({
          appID: targetAppId,
        });

        if (res) {
          appDetail.value = res;
          updateAppName(res.name || '');
          updateAppID(res.id || '');
          updateAppType((res.type || '') as IAppType);
          return res;
        }
        return null;
      } catch {
        appDetail.value = null;
        return null;
      } finally {
        loading.value = false;
        // 请求完成后立即清除缓存
        fetchPromiseCache.delete(targetAppId);
      }
    })();

    // 缓存当前请求, 仅防止同时发起的重复请求
    fetchPromiseCache.set(targetAppId, fetchPromise);
    return fetchPromise;
  }

  // 设置瞬态导航标记
  function setPendingBuilderSource(source: null | string) {
    pendingBuilderSource.value = source;
  }

  // 消费瞬态导航标记:返回当前标记并立即清空,保证「读后即清」只生效一次
  function consumePendingBuilderSource(): null | string {
    const source = pendingBuilderSource.value;
    pendingBuilderSource.value = null;
    return source;
  }

  // 重置所有应用相关状态
  function reset() {
    app.value = '';
    appType.value = '';
    appID.value = '';
    appDetail.value = null;
    // 重置时一并清空瞬态导航标记
    pendingBuilderSource.value = null;
  }

  return {
    appID,
    app,
    appType,
    appDetail,
    loading,
    pendingBuilderSource,
    updateAppID,
    updateAppName,
    updateAppType,
    fetchAppDetail,
    setPendingBuilderSource,
    consumePendingBuilderSource,
    reset,
  };
});
