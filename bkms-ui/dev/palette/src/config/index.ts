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

import { type PaletteView, paletteViews } from '../router';
import type { SearchBlock, SearchHit } from '../util/search';
import { type Group, type TokenLayer, allSemanticGroups, radiusGroups, rampGroups, vizGroups } from '../util/tokens';

import { componentNavItems } from './components';

export interface ViewTab {
  label: string;
  value: PaletteView;
}

export type SidebarItem = Pick<Group, 'id' | 'label'> & { usage?: number };

export interface SidebarSection {
  label: string;
  groups: SidebarItem[];
}

export interface ViewConfig {
  label: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  searchEmptyHint: string;
  groups: Group[];
  sections: SidebarSection[];
  buildSearchBlocks: (hits: SearchHit[]) => SearchBlock[];
}

interface LayerBlockDef {
  key: string;
  title: string;
  variant: SearchBlock['variant'];
  layer: TokenLayer;
}

function byLayer(defs: LayerBlockDef[]): (hits: SearchHit[]) => SearchBlock[] {
  return hits => defs
    .map(({ key, title, variant, layer }) => ({
      key,
      title,
      variant,
      hits: hits.filter(hit => hit.group.layer === layer),
    }))
    .filter(block => block.hits.length > 0);
}

function byGroup(hits: SearchHit[]): SearchBlock[] {
  const buckets = new Map<string, SearchBlock>();
  for (const hit of hits) {
    const block = buckets.get(hit.group.id) ?? {
      key: hit.group.id,
      title: hit.group.label,
      variant: 'semantic' as const,
      hits: [],
    };
    block.hits.push(hit);
    buckets.set(block.key, block);
  }
  return [...buckets.values()];
}

const radiusScaleGroups = radiusGroups.filter(group => group.layer === 'scale');
const radiusSemanticGroups = radiusGroups.filter(group => group.layer === 'semantic');

export const viewConfig: Record<PaletteView, ViewConfig> = {
  color: {
    label: '颜色',
    title: 'BKMS 主题色板',
    description: '源自 <code>color.css</code>。点色块复制色值，悬停可复制 <code>var()</code>。',
    searchPlaceholder: '搜索 token 名 / 用途 / 分组，或输入颜色值（hex / rgb / hsl）',
    searchEmptyHint: '换个关键字，或试试 hex / rgb() / hsl() 颜色值',
    groups: [...rampGroups, ...allSemanticGroups],
    sections: [
      { label: '色阶', groups: rampGroups },
      { label: '语义层', groups: allSemanticGroups },
    ],
    buildSearchBlocks: byLayer([
      { key: 'ramp', title: '色阶', variant: 'ramp', layer: 'scale' },
      { key: 'semantic', title: '语义层', variant: 'semantic', layer: 'semantic' },
    ]),
  },
  radius: {
    label: '圆角',
    title: 'BKMS 圆角令牌',
    description: '源自 <code>radius.css</code>。点卡片复制半径，悬停可复制 <code>var()</code>。',
    searchPlaceholder: '搜索档位 / 用途 / 分组，或输入半径值（如 6px）',
    searchEmptyHint: '换个关键字，或试试档位名 / 半径值（如 6px）',
    groups: radiusGroups,
    sections: [
      { label: '档位', groups: radiusScaleGroups },
      { label: '语义', groups: radiusSemanticGroups },
    ],
    buildSearchBlocks: byLayer([
      { key: 'rad-scale', title: '档位', variant: 'semantic', layer: 'scale' },
      { key: 'rad-semantic', title: '圆角语义', variant: 'semantic', layer: 'semantic' },
    ]),
  },
  viz: {
    label: '可视化',
    title: 'BKMS 可视化字典',
    description: '源自 <code>viz.css</code>。按语义看小样，点卡片复制色值，悬停可复制 <code>var()</code>。',
    searchPlaceholder: '搜索 token 名 / 用途 / 分组，或输入颜色值（hex / rgb / hsl）',
    searchEmptyHint: '换个关键字，或试试 hex / rgb() / hsl() 颜色值',
    groups: vizGroups,
    sections: [{ label: '语义场景', groups: vizGroups }],
    buildSearchBlocks: byGroup,
  },
  component: {
    label: '组件预览',
    title: 'BKMS 组件预览',
    description: '在独立上下文中预览业务组件，mock 不会污染主应用。',
    searchPlaceholder: '',
    searchEmptyHint: '',
    groups: [],
    sections: [{ label: '业务组件', groups: componentNavItems }],
    buildSearchBlocks: () => [],
  },
};

export const viewTabs: ViewTab[] = paletteViews.map(view => ({
  label: viewConfig[view].label,
  value: view,
}));
