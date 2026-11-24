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

import { computed } from 'vue';

import { deltaE, normalizeHex } from './color-diff';
import { allSemanticGroups, rampGroups, resolved } from './tokens';

export interface SuggestCandidate {
  distance: number;
  group: string;
  hex: string;
  kind: 'ramp' | 'semantic';
  label: string;
  name: string;
}

/** 设计台账口径：CIEDE2000 ΔE ≤ 6 视为贴近 */
export const DISTANCE_THRESHOLD = 6;

const HEX = /^#[\dA-F]{6}$/i;

const pool = computed<Omit<SuggestCandidate, 'distance'>[]>(() =>
  [
    ...rampGroups.flatMap(group =>
      group.tokens.map(token => ({
        name: token.name,
        label: token.name.replace(/^--bkms-/, ''),
        hex: normalizeHex(resolved(token.value)) ?? '',
        group: group.label,
        kind: 'ramp' as const,
      })),
    ),
    ...allSemanticGroups.flatMap(group =>
      group.tokens
        .filter(token => token.kind === 'color')
        .map(token => ({
          name: token.name,
          label: token.name.replace(/^--bkms-/, ''),
          hex: normalizeHex(resolved(token.value)) ?? '',
          group: group.label,
          kind: 'semantic' as const,
        })),
    ),
  ].filter(item => HEX.test(item.hex)),
);

/** 取色器默认色：直接取色板中的品牌色，避免写死色值 */
export const DEFAULT_COLOR = computed(
  () => pool.value.find(item => item.name === '--bkms-brand-2')?.hex ?? pool.value[0]?.hex ?? '',
);

/** 输入颜色 → 按 ΔE 升序返回色板候选；withinOnly 为 true 时只保留阈值内的 */
export function suggestColors(input: string, withinOnly = true): SuggestCandidate[] {
  const hex = normalizeHex(input);
  if (!hex) return [];
  return pool.value
    .map(item => ({ ...item, distance: deltaE(hex, item.hex) }))
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name))
    .filter(item => !withinOnly || item.distance <= DISTANCE_THRESHOLD);
}
