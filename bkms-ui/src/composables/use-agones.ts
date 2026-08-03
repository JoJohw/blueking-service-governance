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
/**
 * Agones 应用类型判断 Hook
 *
 * Agones 复用 Helm 的 UI 和流程，差异仅在类型标识、构建配置（仅镜像）和展示文案。
 * 后续 Agones 差异化逻辑优先在此统一处理。
 */

import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import { computed, toRef } from 'vue';

import { useRoute } from 'vue-router';

import { type HelmLikeAppType, APP_TYPES } from './app-type';

import type { AppDetailOutputObj } from '~/@types/app';

export { APP_TYPES as APP_TYPE, type HelmLikeAppType } from './app-type';

/** 详情页用：通过 appData.type 判断 */
export function useAgonesFromAppDetail(appData: MaybeRefOrGetter<AppDetailOutputObj | null | undefined>) {
  const appDataRef = toRef(appData);
  return useAgonesFrom(computed(() => appDataRef.value?.type === APP_TYPES.AGONES));
}

/** 创建流程用：通过路由名判断 */
export function useAgonesFromRoute() {
  const route = useRoute();
  return useAgonesFrom(computed(() => route.name === 'createAgonesTemplateApp'));
}

function useAgonesFrom(isAgones: ComputedRef<boolean>) {
  const appType = computed<HelmLikeAppType>(() => (isAgones.value ? APP_TYPES.AGONES : APP_TYPES.HELM));
  /** Agones 仅支持镜像，不支持代码仓库 */
  const shouldForceDisableCodeRepo = computed(() => isAgones.value);
  return { isAgones, appType, shouldForceDisableCodeRepo };
}
