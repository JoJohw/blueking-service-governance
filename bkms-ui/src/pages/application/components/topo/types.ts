import type { ResourceCategory } from './constants';
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
import type { TopologyNode } from '~/@types/topology';

export interface CategoryGroup {
  id: ResourceCategory;
  kinds: KindGroup[];
  label: string;
}

export interface ContextMenuEvent {
  action: string;
  nodeData: TopoNodeData;
  nodeId: string;
}

export interface ContextMenuItem {
  disabled?: boolean;
  id: string;
  label: string;
  tip?: string;
}

export interface KindGroup {
  kind: string;
  nodes: TopologyNode[];
}

export type NodeStatus = 'all' | 'error' | 'healthy' | 'unknown' | 'warning';

/** 侧栏状态统计与筛选的固定顺序：正常 → 异常 → 告警 → 未知 */
export const TOPO_NODE_STATUS_ORDER: NodeStatus[] = ['all', 'healthy', 'error', 'warning', 'unknown'];

export type StatusCounts = Record<NodeStatus, number>;

export interface TopoNodeData extends TopologyNode {
  /** 节点是否处于折叠状态 */
  collapsed: boolean;
  /** 节点是否有子节点 */
  hasChildren?: boolean;
  /** 归一化后的节点状态 */
  nodeStatus: NodeStatus;
}
