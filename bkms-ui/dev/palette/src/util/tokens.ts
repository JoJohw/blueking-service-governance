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
  /** 分组名（@group 的值，直接作为展示标题） */
  label: string;
  note: string;
  tokens: Token[];
}

interface ParsedCss {
  groups: Group[];
  tokens: Token[];
}

interface Directive {
  name: string;
  value: string;
}

/** 块注释拆成 @tag 指令与普通文本：非 @tag 行续写到上一条指令的值（支持多行 @note） */
function splitDirectives(raw: string): { tags: Directive[]; text: string } {
  const tags: Directive[] = [];
  let text = '';
  let current: Directive | null = null;
  for (const line of raw.split('\n')) {
    const content = line.replace(/^\s*\*+\s?/, '').trim();
    if (!content) continue;
    const tag = /^@([a-z-]+)(?:\s+([\s\S]*))?$/i.exec(content);
    if (tag) {
      current = { name: tag[1].toLowerCase(), value: (tag[2] ?? '').trim() };
      tags.push(current);
      continue;
    }
    if (current) current.value = `${current.value} ${content}`.trim();
    else text = `${text} ${content}`.trim();
  }
  return { tags, text };
}

/**
 * 解析 CSS，注释约定（CSS 不识别 @tag，本工具自行解析）：
 * - 组标记块：\/**
 *     @group keep             分组名，开组（同时也是展示标题）
 *     @note 描述文字           分组描述，可多行续写（@description 同义）
 *   *\/
 * - 闭组标识：\/* @endgroup *\/
 * - 变量说明：\/** 用途 *\/ 作为下一条变量的 note（原有格式）
 * - 分组只认 @group：普通单行注释一律当备注，不会隐式建组
 * - 容错：组外声明归入「未分组」；声明同行尾注释挂到该 token 的 note；非 @tag 多行块注释兜底为组描述
 */
function parse(css: string, prefix: string): ParsedCss {
  const tokens: Token[] = [];
  const groups: Group[] = [];
  let group: Group | null = null;
  let note = '';
  let lastToken: Token | null = null;

  const addGroup = (name: string, groupNote: string): Group => {
    group = { id: `${prefix}-${groups.length + 1}`, label: name, note: groupNote, tokens: [] };
    groups.push(group);
    note = '';
    lastToken = null;
    return group;
  };

  const ensureGroup = (): Group => group ?? addGroup('未分组', '未在 @group 标记内，按源码顺序兜底归组');

  function handleComment(raw: string, jsdoc: boolean, trailing: boolean): void {
    const { tags, text } = splitDirectives(raw);
    if (tags.length === 0) {
      if (trailing && lastToken) {
        if (!lastToken.note && text) lastToken.note = text;
        return;
      }
      if (!text) return;
      if (jsdoc) {
        note = text;
        return;
      }
      if (raw.includes('\n')) {
        if (group && !group.note) group.note = text;
        return;
      }
      // 单行普通注释只作为下一条 token 的说明；分组一律由 @group 显式开启，避免隐式建组
      note = text;
      return;
    }
    const tag = (name: string): string => tags.find(item => item.name === name)?.value ?? '';
    if (tags.some(item => item.name === 'endgroup')) {
      group = null;
      note = '';
      return;
    }
    const name = tag('group').trim();
    if (name) {
      addGroup(name, tag('note') || tag('description'));
      return;
    }
    if (!group) return;
    const groupNote = tag('note') || tag('description');
    if (groupNote) group.note = groupNote;
  }

  function handleDecl(text: string): void {
    const decl = /^(--[\w-]+):\s*(.+);$/.exec(text);
    if (!decl) return;
    const current = ensureGroup();
    const [, name, value] = decl;
    const token: Token = {
      name,
      value,
      note,
      ref: /^var\((--[\w-]+)\)$/.exec(value)?.[1] ?? '',
      group: current.label,
      kind: name.includes('shadow') ? 'shadow' : 'color',
    };
    tokens.push(token);
    current.tokens.push(token);
    lastToken = token;
    note = '';
  }

  let block: string[] | null = null;
  let blockJsdoc = false;
  for (const line of css.split('\n')) {
    if (block) {
      const end = line.indexOf('*/');
      block.push(end === -1 ? line : line.slice(0, end));
      if (end !== -1) {
        handleComment(block.join('\n'), blockJsdoc, false);
        block = null;
        const rest = line.slice(end + 2).trim();
        if (rest) handleDecl(rest);
      }
      continue;
    }
    const start = line.indexOf('/*');
    if (start === -1) {
      handleDecl(line.trim());
      continue;
    }
    const before = line.slice(0, start).trim();
    if (before) handleDecl(before);
    const from = line.slice(start);
    blockJsdoc = from.startsWith('/**');
    const end = from.indexOf('*/');
    if (end === -1) {
      block = [from.slice(blockJsdoc ? 3 : 2)];
      continue;
    }
    handleComment(from.slice(blockJsdoc ? 3 : 2, end), blockJsdoc, Boolean(before));
    const rest = from.slice(end + 2).trim();
    if (rest) handleDecl(rest);
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

/** keep 族名字以 6 位色值结尾（含纯数字），不能按结尾数字排，否则 144628 会被当成 step */
const sortTokens = (tokens: Token[]): Token[] => {
  if (tokens.every(token => /^--bkms-keep-/.test(token.name))) {
    return [...tokens].sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...tokens].sort((a, b) => {
    const na = Number(a.name.match(/-(\d+)$/)?.[1] ?? 0);
    const nb = Number(b.name.match(/-(\d+)$/)?.[1] ?? 0);
    return na - nb;
  });
};

/** 色阶组：colors.css 的分组，组内按数字正序（1 最深在前） */
export const rampGroups: Group[] = colors.groups
  .filter(group => group.tokens.every(token => token.kind === 'color'))
  .map(group => ({ ...group, tokens: sortTokens(group.tokens) }));

/** 语义层：semantic.css —— 语义 token 引用色阶，主题换色时自动联动；阴影组按场景命名，值即完整效果 */
export const allSemanticGroups: Group[] = semantics.groups;
