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
import { deltaE, normalizeHex } from '@root/dev/palette/src/util/color-diff';

import colorRaw from '~/styles/theme/tokens/color.css?raw';
import radiusRaw from '~/styles/theme/tokens/radius.css?raw';

export type LayerIcon = 'frame' | 'group' | 'image' | 'rect' | 'text';

export interface LayerNode {
  children: LayerNode[];
  depth: number;
  el: HTMLElement;
  icon: LayerIcon;
  id: number;
  name: string;
  parent: null | number;
  tag: string;
}

export interface PropRow {
  label: string;
  near?: boolean;
  swatch?: string;
  token?: string;
  value: string;
  warn?: boolean;
}

function parseVars(raw: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const match of raw.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(match[1], match[2].trim());
  }
  return vars;
}

function resolve(value: string, vars: Map<string, string>, seen = new Set<string>()): string {
  const ref = /^var\((--[\w-]+)\)$/.exec(value.trim())?.[1];
  if (!ref || seen.has(ref)) return value.trim();
  seen.add(ref);
  const next = vars.get(ref);
  return next === undefined ? value.trim() : resolve(next, vars, seen);
}

const colorVars = parseVars(colorRaw);
const radiusVars = parseVars(radiusRaw);

interface ColorToken {
  hex: string;
  name: string;
}

const colorPool: ColorToken[] = [...colorVars.entries()]
  .map(([name, value]) => ({
    name,
    hex: normalizeHex(resolve(value, colorVars)),
    semantic: value.startsWith('var('),
  }))
  .filter((item): item is ColorToken & { hex: string; semantic: boolean } => Boolean(item.hex))
  .sort((a, b) => Number(b.semantic) - Number(a.semantic));

interface RadiusToken {
  name: string;
  semantic: boolean;
  value: string;
}

const radiusPool: RadiusToken[] = [...radiusVars.entries()]
  .map(([name, value]) => ({ name, value: resolve(value, radiusVars), semantic: value.startsWith('var(') }))
  .filter(item => /^(\d+px|0)$/.test(item.value))
  .sort((a, b) => Number(b.semantic) - Number(a.semantic));

const ids = new WeakMap<Element, number>();
let seq = 0;

export function buildTree(root: HTMLElement): LayerNode[] {
  const nodes: LayerNode[] = [];
  const walk = (el: HTMLElement, depth: number, parent: null | number): LayerNode => {
    const node: LayerNode = {
      children: [],
      depth,
      el,
      icon: iconOf(el),
      id: idOf(el),
      name: nameOf(el),
      parent,
      tag: el.tagName.toLowerCase(),
    };
    nodes.push(node);
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) || child.hasAttribute('data-element-inspector')) continue;
      node.children.push(walk(child, depth + 1, node.id));
    }
    return node;
  };
  walk(root, 0, null);
  return nodes;
}

export function describe(el: HTMLElement): PropRow[] {
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const radius = cs.borderRadius.trim();
  const radiusHits = radiusPool.filter(item => item.value === radius);

  const rows: PropRow[] = [
    { label: '尺寸', value: `${Math.round(rect.width)} × ${Math.round(rect.height)}` },
    colorRow('填充', cs.backgroundColor),
    colorRow('文字色', cs.color),
  ];
  if (radius && radius !== '0px') {
    rows.push({ label: '圆角', token: radiusHits[0]?.name, value: radius, warn: radiusHits.length === 0 });
  }
  rows.push({ label: '内边距', value: cs.padding });
  if (cs.gap && cs.gap !== 'normal') rows.push({ label: '间距', value: cs.gap });
  rows.push({ label: '字体', value: `${cs.fontSize} / ${cs.fontWeight}` });
  return rows;
}

function colorRow(label: string, raw: string): PropRow {
  const hex = normalizeHex(raw);
  const hit = matchColor(raw);
  if (!hex || !hit) return { label, value: isTransparent(raw) ? '透明' : raw };
  const token =
    hit.delta <= 0.5
      ? hit.name
      : hit.delta <= 6
        ? `≈ ${hit.name} · ΔE ${hit.delta.toFixed(1)}`
        : `最近 ${hit.name} · ΔE ${hit.delta.toFixed(1)}`;
  return { label, swatch: hex, token, value: hex, near: hit.delta > 0.5, warn: hit.delta > 6 };
}

function iconOf(el: HTMLElement): LayerIcon {
  const forced = el.dataset.layerIcon as LayerIcon | undefined;
  if (forced) return forced;
  if (['IMG', 'PICTURE', 'SVG'].includes(el.tagName)) return 'image';
  if (['BUTTON', 'INPUT', 'SELECT'].includes(el.tagName)) return 'rect';
  if (el.children.length === 0 && el.textContent?.trim()) return 'text';
  return el.dataset.layerType === 'frame' ? 'frame' : 'group';
}

function idOf(el: Element): number {
  let id = ids.get(el);
  if (id === undefined) {
    id = seq += 1;
    ids.set(el, id);
  }
  return id;
}

function isTransparent(raw: string): boolean {
  return raw === 'transparent' || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(raw);
}

function matchColor(raw: string): null | { delta: number; name: string } {
  if (isTransparent(raw)) return null;
  const target = normalizeHex(raw);
  if (!target) return null;
  let hit: null | { delta: number; name: string } = null;
  for (const token of colorPool) {
    const delta = deltaE(target, token.hex);
    if (!Number.isFinite(delta) || (hit && delta >= hit.delta)) continue;
    hit = { delta, name: token.name };
  }
  return hit;
}

function nameOf(el: HTMLElement): string {
  if (el.dataset.layer) return el.dataset.layer;
  const cls = Array.from(el.classList).find(name => !name.startsWith('is-'));
  return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
}
