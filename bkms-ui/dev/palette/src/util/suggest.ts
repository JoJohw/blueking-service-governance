import { allSemanticGroups, rampGroups, resolved } from './tokens';
import { deltaE, normalizeHex } from './color-diff';

export interface SuggestCandidate {
  name: string;
  label: string;
  hex: string;
  group: string;
  kind: 'ramp' | 'semantic';
  distance: number;
}

/** 设计台账口径：CIEDE2000 ΔE ≤ 6 视为贴近 */
export const DISTANCE_THRESHOLD = 6;

const HEX = /^#[\dA-F]{6}$/i;

const pool: Omit<SuggestCandidate, 'distance'>[] = [
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
].filter(item => HEX.test(item.hex));

/** 取色器默认色：直接取色板中的品牌色，避免写死色值 */
export const DEFAULT_COLOR =
  pool.find(item => item.name === '--bkms-brand-2')?.hex ?? pool[0]?.hex ?? '';

/** 输入颜色 → 按 ΔE 升序返回色板候选；withinOnly 为 true 时只保留阈值内的 */
export function suggestColors(input: string, withinOnly = true): SuggestCandidate[] {
  const hex = normalizeHex(input);
  if (!hex) return [];
  return pool
    .map(item => ({ ...item, distance: deltaE(hex, item.hex) }))
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name))
    .filter(item => !withinOnly || item.distance <= DISTANCE_THRESHOLD);
}
