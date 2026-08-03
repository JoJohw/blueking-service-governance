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
 * 应用类型统一定义
 *
 * 新增应用类型只需修改此文件，其他地方自动同步。
 */

/** 应用类型常量 */
export const APP_TYPES = {
  HELM: 'helm',
  AGONES: 'agones',
  TRPC: 'trpc',
  TAF: 'taf',
} as const;

/** 应用模型类型（trpc / taf） */
export type AppModelAppType = typeof APP_TYPES.TAF | typeof APP_TYPES.TRPC;

/** 应用类型（不含空字符串，用于导航、图标等场景） */
export type AppType = Exclude<IAppType, ''>;

/** Helm-like 应用类型（agones 复用 helm 流程） */
export type HelmLikeAppType = typeof APP_TYPES.AGONES | typeof APP_TYPES.HELM;

/** 应用类型（含空字符串，用于 store 等初始状态场景） */
export type IAppType = '' | (typeof APP_TYPES)[keyof typeof APP_TYPES];

/** 应用模型类型集合（trpc / taf） */
export const APP_MODEL_APP_TYPES: readonly AppModelAppType[] = [APP_TYPES.TRPC, APP_TYPES.TAF] as const;

/** Helm-like 应用类型集合（agones 复用 helm 流程） */
export const HELM_LIKE_APP_TYPES: readonly HelmLikeAppType[] = [APP_TYPES.HELM, APP_TYPES.AGONES] as const;

/** 判断是否为应用模型类型（trpc / taf） */
export function isAppModelAppType(type: null | string | undefined): type is AppModelAppType {
  return !!type && APP_MODEL_APP_TYPES.includes(type as AppModelAppType);
}

/** 判断是否为 Helm-like 应用类型（helm / agones） */
export function isHelmLikeAppType(type: null | string | undefined): type is HelmLikeAppType {
  return !!type && HELM_LIKE_APP_TYPES.includes(type as HelmLikeAppType);
}
