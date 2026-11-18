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

const VIZ_PREFIX = '--bkms-viz-';

const cache = new Map<string, string>();

export function invalidateVizCache(): void {
  cache.clear();
}

export function readVizSeries(fallbacks: string[]): string[] {
  return fallbacks.map((fallback, index) => readVizVar(`--bkms-viz-series-${index + 1}`, fallback));
}

/** name 可为完整 CSS 变量名或字典短名；取值失败不缓存，避免兜底色粘住后续成功读取 */
const VAR_REF = /^var\(\s*(--[\w-]+)\s*\)$/;
const SOLID_COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i;

export function readVizVar(name: string, fallback: string): string {
  const varName = name.startsWith('--') ? name : `${VIZ_PREFIX}${name}`;
  const cached = cache.get(varName);
  if (cached !== undefined) return cached;
  if (typeof document === 'undefined' || typeof window === 'undefined') return fallback;

  const value = computedColor(varName, new Set());
  if (!SOLID_COLOR.test(value)) return fallback;
  cache.set(varName, value);
  return value;
}

function computedColor(varName: string, seen: Set<string>): string {
  if (seen.has(varName)) return '';
  seen.add(varName);
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const ref = raw.match(VAR_REF);
  return ref ? computedColor(ref[1], seen) : raw;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const channelsOf = (hex: string, allowAlpha = false): null | number[] => {
  const raw = hex.trim().replace(/^#/, '');
  const full = raw.length === 3 || raw.length === 4 ? [...raw].map(c => c + c).join('') : raw;
  if (!new RegExp(`^[0-9a-f]{6}${allowAlpha ? '([0-9a-f]{2})?' : ''}$`, 'i').test(full)) return null;
  return [0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16));
};

export interface VizGradientStop {
  color: string;
  offset: number;
}

export interface VizLinearGradient {
  colorStops: VizGradientStop[];
  type: 'linear';
  x: number;
  x2: number;
  y: number;
  y2: number;
}

export function hexToRgba(hex: string, alpha: number): string {
  const channels = channelsOf(hex, true);
  if (!channels) return hex;
  return `rgba(${channels.join(', ')}, ${clamp01(alpha)})`;
}

/** Monaco 主题色只接受 hex（含 alpha 通道），不认 rgba() 字符串 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const channels = channelsOf(hex);
  if (!channels) return hex;
  const value = Math.round(clamp01(alpha) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}${value}`;
}

/** 渐变端点用同色零透明度，避免 transparent 在部分渲染后端被解释成黑色 */
export function linearGradient(hex: string, fromAlpha = 0.25): VizLinearGradient {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: hexToRgba(hex, fromAlpha) },
      { offset: 1, color: hexToRgba(hex, 0) },
    ],
  };
}

export function mixHex(from: string, to: string, ratio: number): string {
  const left = channelsOf(from);
  const right = channelsOf(to);
  if (!left || !right) return from;
  const weight = clamp01(ratio);
  return `#${left
    .map((channel, index) =>
      Math.round(channel + (right[index] - channel) * weight)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** halo 是品牌色的 alpha 派生值，字典里不落值 */
export function vizHalo(alpha = 0.2): string {
  return hexToRgba(readVizVar('--bkms-brand-2', '#3B6EF5'), alpha);
}
