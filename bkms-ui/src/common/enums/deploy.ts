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

/** AppModel 类型应用部署状态 */
export const APP_DEPLOY_STATUS = {
  /** 未知状态 */
  UNKNOWN: 'unknown',
  /** 部署中 */
  DEPLOYING: 'deploying',
  /** 已部署 */
  DEPLOYED: 'deployed',
  /** 卸载中 */
  UNINSTALLING: 'uninstalling',
  /** 已卸载 */
  UNINSTALLED: 'uninstalled',
  /** 部署失败 */
  FAILED: 'failed',
  /** 取消部署（用户取消：部署中时重新部署，自动取消之前的部署） */
  CANCELED: 'canceled',
  /** 轮询超时 */
  POLLING_TIMEOUT: 'polling-timeout',
  /** 轮询中断 */
  POLLING_BROKEN: 'polling-broken',
} as const;

/** Helm 类型应用部署状态 */
export const HELM_DEPLOY_STATUS = {
  /** 未知状态 */
  UNKNOWN: 'unknown',
  /** 已部署 */
  DEPLOYED: 'deployed',
  /** 已卸载 */
  UNINSTALLED: 'uninstalled',
  /** 卸载中 */
  UNINSTALLING: 'uninstalling',
  /** 已被取代 */
  SUPERSEDED: 'superseded',
  /** 部署失败 */
  FAILED: 'failed',
  /** 安装中 */
  PENDING_INSTALL: 'pending-install',
  /** 升级中 */
  PENDING_UPGRADE: 'pending-upgrade',
  /** 回滚中 */
  PENDING_ROLLBACK: 'pending-rollback',
} as const;

/** 失败类状态（deploy.vue、artifact-expand.vue 等多处复用） */
export const DEPLOY_FAILED_STATUSES = [
  APP_DEPLOY_STATUS.FAILED,
  APP_DEPLOY_STATUS.POLLING_TIMEOUT,
  APP_DEPLOY_STATUS.POLLING_BROKEN,
] as const;
