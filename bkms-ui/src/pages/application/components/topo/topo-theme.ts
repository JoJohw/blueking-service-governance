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
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

import { invalidateVizCache, readVizVar } from '~/common/theme/viz-theme';

import type { NodeStatus } from './types';

const STATUS_VARS: Record<NodeStatus, string> = {
  // minimap 只画实色状态块，all 沿用 unknown 的底色，勿指向 bg-card（与底板同色会消失）
  all: '--bkms-viz-status-unknown',
  error: '--bkms-viz-status-error',
  healthy: '--bkms-viz-status-healthy',
  unknown: '--bkms-viz-status-unknown',
  warning: '--bkms-viz-status-warning',
};

/** viz 变量取不到实色时的兜底，与 viz.css 未落值前的字面色一致 */
const STATUS_FALLBACK: Record<NodeStatus, string> = {
  all: '#99B1E0',
  error: '#FEDDDD',
  healthy: '#DAF6E5',
  unknown: '#99B1E0',
  warning: '#FDEED8',
};

export interface TopoViz {
  edgeStroke: string;
  minimapBackground: string;
  minimapMask: string;
  nodePlate: string;
  selection: string;
  statusColors: Record<NodeStatus, string>;
}

const statusColor = (status: NodeStatus): string => readVizVar(STATUS_VARS[status], STATUS_FALLBACK[status]);

export function getTopoViz(): TopoViz {
  const statusColors: Record<NodeStatus, string> = {
    all: statusColor('all'),
    error: statusColor('error'),
    healthy: statusColor('healthy'),
    unknown: statusColor('unknown'),
    warning: statusColor('warning'),
  };
  return {
    edgeStroke: readVizVar('--bkms-viz-line', '#ABB5CC'),
    minimapBackground: readVizVar('--bkms-viz-surface-canvas', '#242A35'),
    minimapMask: readVizVar('--bkms-viz-mask', '#0000002d'),
    nodePlate: readVizVar('--bkms-viz-bg-card', '#FFFFFF'),
    selection: readVizVar('--bkms-viz-selection', '#F59500'),
    statusColors,
  };
}

/** 换肤器按「清缓存 → 各 refresh → 各库重绘」调用；重绘由消费方在拿到新值后触发 */
export function refreshTopoViz(): TopoViz {
  invalidateVizCache();
  return getTopoViz();
}
