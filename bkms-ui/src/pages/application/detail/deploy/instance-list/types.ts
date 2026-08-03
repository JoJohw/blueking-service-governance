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

import { type AppInstanceOutputObj } from '~/@types/v1/instance';

/** 实例操作上下文（各 Action 组件共享） */
export interface InstanceActionContext {
  timer?: { start: () => void; stop: () => void };
  clearSelections: () => void;
  getEnvName: (context?: { instance?: AppInstanceOutputObj }) => string;
  getSelectedInstances: () => AppInstanceOutputObj[];
  refreshData: () => Promise<void> | void;
}

/** 环境数据加载完成载荷 */
export interface InstanceDataLoadedPayload {
  envName: string;
  instances: AppInstanceOutputObj[];
  total: number;
}

/** 行操作类型 */
export type InstanceRowAction = 'gray' | 'log' | 'login' | 'monitor' | 'weight';

/** 行操作事件载荷 */
export interface InstanceRowActionPayload {
  action: InstanceRowAction;
  envName: string;
  instance: AppInstanceOutputObj;
}

/** 环境选中变化载荷 */
export interface InstanceSelectionChangePayload {
  envName: string;
  selections: AppInstanceOutputObj[];
}

/** 实例表格暴露方法 */
export interface InstanceTableExpose {
  isAllSelected?: boolean;
  isCollapsed?: boolean;
  isCrossPageSelection?: boolean;
  selectedCount?: number;
  clearSelections: () => void;
  getSelections: () => AppInstanceOutputObj[];
  getTotal: () => number;
  loadInstances: () => Promise<void>;
  resetPage: (current?: number) => void;
}

/** 实例表格模式 */
export type InstanceTableMode = 'multiEnv' | 'single';
