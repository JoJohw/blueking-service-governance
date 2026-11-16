import { deltaE, normalizeHex } from './color-diff';
import { type Token, resolved } from './tokens';

export interface SearchHit {
  groupId: string;
  groupLabel: string;
  kind: 'ramp' | 'semantic';
  token: Token;
}

interface SearchableGroup {
  id: string;
  kind: 'ramp' | 'semantic';
  label: string;
  tokens: Token[];
}

const groups: SearchableGroup[] = [];

/** 注册可搜索的分组（色阶 + 语义层），调用一次即可 */
export function registerSearchGroups(list: SearchableGroup[]): void {
  groups.splice(0, groups.length, ...list);
}

/** 按关键字搜索 token：颜色格式转 hex 后匹配解析色值（精确优先、ΔE≤3 兜底），否则按名称/说明/引用/分组匹配 */
export function searchTokens(input: string): SearchHit[] {
  const query = input.trim();
  if (!query) return [];
  const hex = normalizeHex(query);
  const unwrapped = /^var\(\s*(--[\w-]+)\s*\)$/i.exec(query)?.[1] ?? query;
  const lower = unwrapped.toLowerCase();
  const colored: Array<SearchHit & { distance: number }> = [];
  const hits: SearchHit[] = [];
  for (const group of groups) {
    for (const token of group.tokens) {
      const hit: SearchHit = { groupId: group.id, groupLabel: group.label, kind: group.kind, token };
      if (hex !== null) {
        const distance = deltaE(hex, resolved(token.value));
        if (distance <= 3) colored.push({ ...hit, distance });
      } else if (
        token.name.toLowerCase().includes(lower) ||
        token.note.toLowerCase().includes(lower) ||
        token.value.toLowerCase().includes(lower) ||
        token.ref.toLowerCase().includes(lower) ||
        group.label.toLowerCase().includes(lower)
      ) {
        hits.push(hit);
      }
    }
  }
  if (hex !== null) {
    if (colored.length) {
      const exact = colored.filter(item => item.distance === 0);
      const chosen = exact.length ? exact : colored.sort((a, b) => a.distance - b.distance);
      return chosen.map(item => ({
        groupId: item.groupId,
        groupLabel: item.groupLabel,
        kind: item.kind,
        token: item.token,
      }));
    }
    return [];
  }
  return hits;
}
