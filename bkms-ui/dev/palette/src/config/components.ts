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

import { componentCatalog } from '../../../../src/pages/designer/component-catalog.generated';

export interface ComponentNavItem {
  /** 组件所在目录（多级 id 去掉最后一段），菜单据此区分 index 这类同名条目 */
  directory: string;
  id: string;
  label: string;
  usage: number;
}

/**
 * 菜单里需要展示的目录：`a/b/c` → `a/b`，无目录时为空串。
 * 目录末段与组件名相同时（如 `skeleton/skeleton`）视为冗余并去掉，
 * 否则菜单会出现两行完全相同的文字。
 */
export function displayDirectoryOf(id: string): string {
  const separator = id.lastIndexOf('/');
  if (separator === -1) return '';
  const segments = id.slice(0, separator).split('/');
  if (segments[segments.length - 1] === id.slice(separator + 1)) segments.pop();
  return segments.join('/');
}

export const componentNavItems: ComponentNavItem[] = componentCatalog.map(entry => ({
  directory: displayDirectoryOf(entry.id),
  id: entry.id,
  label: entry.id.split('/').pop() ?? entry.id,
  usage: entry.usage,
}));

export type ComponentSortMode = 'asc' | 'default' | 'desc';

/**
 * 按关键词过滤组件：展示名与完整 id 都参与匹配，忽略大小写与首尾空白。
 * 空查询返回空数组，避免「搜索态展示全部」被误认为结果。
 */
export function matchComponents(items: ComponentNavItem[], input: string): ComponentNavItem[] {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  return items.filter(item => item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query));
}

export function sortByUsage<T extends { usage?: number }>(items: T[], mode: ComponentSortMode): T[] {
  if (mode === 'default') return items;
  const sorted = [...items];
  sorted.sort((a, b) => (mode === 'desc' ? (b.usage ?? 0) - (a.usage ?? 0) : (a.usage ?? 0) - (b.usage ?? 0)));
  return sorted;
}
