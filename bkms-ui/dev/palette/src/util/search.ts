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

import { deltaE, normalizeHex } from './color-diff';
import { type Group, type Token, resolved } from './tokens';

export interface SearchHit {
  group: Group;
  token: Token;
}

/** 结果分块的呈现描述，由调用方按视图组装，搜索层与展示组件都只消费 */
export interface SearchBlock {
  key: string;
  title: string;
  variant: 'ramp' | 'semantic';
  hits: SearchHit[];
}

/**
 * 在给定分组里搜 token：作用域由调用方传入（当前视图的分组），本模块不认识视图概念。
 * 颜色格式转 hex 后按 CIEDE2000 匹配解析色值（精确优先、ΔE≤3 兜底），否则按名称/说明/引用/分组匹配。
 * 长度令牌（圆角）转不出 hex，色差为 NaN 自然落选，文本路径仍能命中 value。
 */
export function searchTokens(groups: Group[], input: string): SearchHit[] {
  const query = input.trim();
  if (!query) return [];
  const hex = normalizeHex(query);
  const unwrapped = /^var\(\s*(--[\w-]+)\s*\)$/i.exec(query)?.[1] ?? query;
  const lower = unwrapped.toLowerCase();
  const colored: Array<SearchHit & { distance: number }> = [];
  const hits: SearchHit[] = [];
  for (const group of groups) {
    for (const token of group.tokens) {
      const hit: SearchHit = { group, token };
      if (hex !== null) {
        const distance = deltaE(hex, resolved(token.value));
        if (distance <= 3) colored.push({ ...hit, distance });
      } else if (
        token.name.toLowerCase().includes(lower) ||
        token.note.toLowerCase().includes(lower) ||
        token.value.toLowerCase().includes(lower) ||
        token.ref.toLowerCase().includes(lower) ||
        group.label.toLowerCase().includes(lower) ||
        Boolean(group.note?.toLowerCase().includes(lower))
      ) {
        hits.push(hit);
      }
    }
  }
  if (hex !== null) {
    if (!colored.length) return [];
    const exact = colored.filter(item => item.distance === 0);
    const chosen = exact.length ? exact : colored.sort((a, b) => a.distance - b.distance);
    return chosen.map(({ group, token }) => ({ group, token }));
  }
  return hits;
}
