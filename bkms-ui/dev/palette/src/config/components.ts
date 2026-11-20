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
  id: string;
  label: string;
  usage: number;
}

export const componentNavItems: ComponentNavItem[] = componentCatalog.map(entry => ({
  id: entry.id,
  label: entry.id.split('/').pop() ?? entry.id,
  usage: entry.usage,
}));

export type ComponentSortMode = 'asc' | 'default' | 'desc';

export function sortByUsage<T extends { usage?: number }>(items: T[], mode: ComponentSortMode): T[] {
  if (mode === 'default') return items;
  const sorted = [...items];
  sorted.sort((a, b) => (mode === 'desc' ? (b.usage ?? 0) - (a.usage ?? 0) : (a.usage ?? 0) - (b.usage ?? 0)));
  return sorted;
}
