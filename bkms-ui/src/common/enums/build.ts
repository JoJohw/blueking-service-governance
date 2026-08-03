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
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
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

/** 应用构建状态 */
export const APP_BUILD_STATUS = {
  /** 构建记录已创建，状态尚未明确 */
  UNKNOWN: 'unknown',
  /** 构建中 */
  RUNNING: 'running',
  /** 构建成功（将自动进入部署阶段） */
  SUCCESS: 'success',
  /** 构建失败 */
  FAILED: 'failed',
  /** 构建被取消 */
  CANCELED: 'canceled',
  /** 构建状态轮询超时 */
  POLLING_TIMEOUT: 'polling-timeout',
  /** 构建状态轮询异常中断 */
  POLLING_BROKEN: 'polling-broken',
} as const;

export const BUILD_INTERRUPT_STATUSES = [
  APP_BUILD_STATUS.UNKNOWN,
  APP_BUILD_STATUS.CANCELED,
  APP_BUILD_STATUS.POLLING_TIMEOUT,
  APP_BUILD_STATUS.POLLING_BROKEN,
] as const;
