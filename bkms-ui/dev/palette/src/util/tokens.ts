import colorsRaw from '../../../../src/styles/theme/tokens/colors.css?raw';
import semanticRaw from '../../../../src/styles/theme/tokens/semantic.css?raw';

export type TokenKind = 'color' | 'shadow';

export interface Token {
  group: string;
  kind: TokenKind;
  name: string;
  note: string;
  ref: string;
  value: string;
}

export interface Group {
  id: string;
  label: string;
  note: string;
  tokens: Token[];
}

interface ParsedCss {
  groups: Group[];
  tokens: Token[];
}

/** 解析 CSS：/* 分组 *\/ 建立分组，/** 用途 *\/ 作为下一条变量的说明，顺序完全取自源码 */
function parse(css: string, prefix: string): ParsedCss {
  const tokens: Token[] = [];
  const groups: Group[] = [];
  let group = '';
  let note = '';
  for (const line of css.split('\n')) {
    const trimmed = line.trim();
    const usage = /^\/\*\*\s*(.+?)\s*\*\/$/.exec(trimmed);
    if (usage) {
      note = usage[1];
      continue;
    }
    const section = /^\/\*\s*(.+?)\s*\*\/$/.exec(trimmed);
    if (section && !section[1].startsWith('*')) {
      group = section[1].split('（')[0].trim();
      groups.push({ id: `${prefix}-${groups.length + 1}`, label: group, note: '', tokens: [] });
      continue;
    }
    const decl = /^(--[\w-]+):\s*(.+);$/.exec(trimmed);
    if (decl) {
      const [, name, value] = decl;
      const ref = /^var\((--[\w-]+)\)$/.exec(value)?.[1] ?? '';
      const token: Token = {
        name,
        value,
        note,
        ref,
        group,
        kind: name.includes('shadow') ? 'shadow' : 'color',
      };
      tokens.push(token);
      const current = groups.find(item => item.label === group);
      if (current) {
        current.tokens.push(token);
        if (note && !current.note) current.note = note;
      }
      note = '';
    }
  }
  return { tokens, groups: groups.filter(group => group.tokens.length > 0) };
}

const colors = parse(colorsRaw, 'ramp');
const semantics = parse(semanticRaw, 'sem');

const colorMap = new Map(colors.tokens.map(token => [token.name, token.value]));

/** 解开 var() 链拿到色值；非纯 var()（如 color-mix）原样交给浏览器解析，用 seen 防循环引用 */
export function resolved(value: string, seen = new Set<string>()): string {
  const ref = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  if (!ref || seen.has(ref)) return value;
  seen.add(ref);
  const next = colorMap.get(ref);
  return next === undefined ? value : resolved(next, seen);
}

/** 色阶组：colors.css 里除阴影组外的分组，组内按数字正序（1 最深在前） */
export const rampGroups: Group[] = colors.groups
  .filter(group => group.tokens.every(token => token.kind === 'color'))
  .map(group => ({
    ...group,
    tokens: [...group.tokens].sort((a, b) => {
      const na = Number(a.name.match(/-(\d+)$/)?.[1] ?? 0);
      const nb = Number(b.name.match(/-(\d+)$/)?.[1] ?? 0);
      return na - nb;
    }),
  }));

/** 语义层：semantic.css 的分组 + colors.css 的阴影组，顺序取自源码 */
export const allSemanticGroups: Group[] = [
  ...semantics.groups,
  ...colors.groups.filter(group => group.tokens.every(token => token.kind === 'shadow')),
];
