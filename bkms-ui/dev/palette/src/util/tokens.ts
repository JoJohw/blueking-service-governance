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

import { computed, reactive, ref } from 'vue';

import colorRaw from '@root/src/styles/theme/tokens/color.css?raw';
import radiusRaw from '@root/src/styles/theme/tokens/radius.css?raw';
import vizRaw from '@root/src/styles/theme/tokens/viz.css?raw';

export interface Group {
  id: string;
  /** 分组名（@group 的值，直接作为展示标题） */
  label: string;
  layer: TokenLayer;
  note: string;
  tokens: Token[];
}
export interface Token {
  group: string;
  kind: TokenKind;
  name: string;
  note: string;
  ref: string;
  value: string;
}

export type TokenKind = 'color' | 'radius' | 'shadow' | 'viz';

/** 令牌层：色阶原子 / 语义引用。由 token 文件里的 @layer 标记决定，不再靠文件名区分 */
export type TokenLayer = 'scale' | 'semantic';

interface Directive {
  name: string;
  value: string;
}

interface ParsedCss {
  groups: Group[];
  tokens: Token[];
}

export function parse(css: string, prefix: string, kindOverride: null | TokenKind = null): ParsedCss {
  const tokens: Token[] = [];
  const groups: Group[] = [];
  let group: Group | null = null;
  let note = '';
  let lastToken: null | Token = null;

  const addGroup = (name: string, groupNote: string, layer: TokenLayer): Group => {
    group = { id: `${prefix}-${groups.length + 1}`, label: name, note: groupNote, layer, tokens: [] };
    groups.push(group);
    note = '';
    lastToken = null;
    return group;
  };

  // 组外散落的声明没有 @layer 可读，归语义层展示
  const ensureGroup = (): Group => group ?? addGroup('未分组', '未在 @group 标记内，按源码顺序兜底归组', 'semantic');

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
      addGroup(name, tag('note') || tag('description'), toLayer(name, tag('layer').trim()));
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
      kind:
        kindOverride ?? (name.includes('shadow') ? 'shadow' : name.startsWith('--bkms-radius-') ? 'radius' : 'color'),
    };
    tokens.push(token);
    current.tokens.push(token);
    lastToken = token;
    note = '';
  }

  let block: null | string[] = null;
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
 *     @group brand            分组名，开组（同时也是展示标题）
 *     @layer scale            所属层：scale（色阶原子）| semantic（语义引用），必填
 *     @note 描述文字           分组描述，可多行续写（@description 同义）
 *   *\/
 * - 闭组标识：\/* @endgroup *\/
 * - 变量说明：\/** 用途 *\/ 作为下一条变量的 note（原有格式）
 * - 分组只认 @group：普通单行注释一律当备注，不会隐式建组
 * - 容错：组外声明归入「未分组」；声明同行尾注释挂到该 token 的 note；非 @tag 多行块注释兜底为组描述
 */
/** @layer 是色阶区/语义区的唯一依据：缺失或拼错会让该组无处归位，直接报错而不是静默丢组 */
function toLayer(label: string, raw: string): TokenLayer {
  if (raw === 'scale' || raw === 'semantic') return raw;
  throw new Error(`[palette] 分组「${label}」的 @layer 必须是 scale 或 semantic，当前为：${raw || '(缺失)'}`);
}

const colorFile = parse(colorRaw, 'ramp');
const radiusFile = parse(radiusRaw, 'rad');
const vizFile = parse(vizRaw, 'viz', 'viz');

export type PaletteThemeId = string;

export interface PaletteThemeOption {
  id: PaletteThemeId;
  label: string;
}

/** themes/*.css 按文件名自动注册：新增主题只需放一份覆盖文件，palette 侧零改动 */
const themeFiles = import.meta.glob<string>('@root/src/styles/theme/themes/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function overrideMap(raw: string): Map<string, string> {
  return new Map(parse(raw, 'override').tokens.map(token => [token.name, token.value]));
}

const themeOverrides = Object.fromEntries(
  Object.entries(themeFiles)
    .filter(([path]) => !path.endsWith('/index.css'))
    .map(([path, raw]) => [
      path
        .split('/')
        .pop()!
        .replace(/\.css$/, ''),
      overrideMap(raw),
    ]),
);

/** 词典主题：默认档是 tokens/ 三份正式文件，其余来自 themes/*.css；只切展示色值，不碰主应用 */
export const paletteThemes: PaletteThemeOption[] = [
  { id: 'light', label: 'default' },
  ...Object.keys(themeOverrides)
    .sort()
    .map(id => ({ id, label: id })),
];

const overrides: Record<PaletteThemeId, Map<string, string>> = {
  light: new Map(),
  ...themeOverrides,
};

const baseValueMap = new Map(
  [...colorFile.tokens, ...radiusFile.tokens, ...vizFile.tokens].map(token => [token.name, token.value]),
);

const sortTokens = (tokens: Token[]): Token[] =>
  [...tokens].sort((a, b) => {
    const na = Number(a.name.match(/-(\d+)$/)?.[1] ?? 0);
    const nb = Number(b.name.match(/-(\d+)$/)?.[1] ?? 0);
    return na - nb;
  });

/** 色阶组：@layer scale 的分组，组内按数字正序（1 最深在前） */
export const rampGroups = reactive<Group[]>(
  colorFile.groups
    .filter(group => group.layer === 'scale')
    .map(group => ({ ...group, tokens: sortTokens(group.tokens) })),
);

/** 语义层：@layer semantic 的分组——语义 token 引用色阶，主题换色时自动联动；阴影组按场景命名，值即完整效果 */
export const allSemanticGroups = reactive<Group[]>(colorFile.groups.filter(group => group.layer === 'semantic'));

/** 圆角维度：两个分组（档位 / 圆角语义），语义档只 var() 引用档位，resolved() 按长度值解开 */
export const radiusGroups = reactive<Group[]>(radiusFile.groups);

/** 可视化字典：viz.css 的分组独立成第三视图，不并入颜色视图的色阶 / 语义二分；值是实色，resolved() 直接展示 */
export const vizGroups = reactive<Group[]>(vizFile.groups);

/** 切主题时按 token 名回填原值，避免反复切换后把 light 快照写成上一次的主题值 */
const baseTokenValues = new Map(
  [...rampGroups, ...allSemanticGroups, ...radiusGroups, ...vizGroups]
    .flatMap(group => group.tokens)
    .map(token => [token.name, token.value]),
);

const activeValueMap = ref(baseValueMap);
export const activeTheme = ref<PaletteThemeId>('light');

/** 解开 var() 链拿到最终值（色值 / 圆角长度）；非纯 var()（如 color-mix）原样交给浏览器解析，用 seen 防循环引用 */
export function resolved(value: string, seen = new Set<string>()): string {
  const refName = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
  if (!refName || seen.has(refName)) return value;
  seen.add(refName);
  const next = activeValueMap.value.get(refName);
  return next === undefined ? value : resolved(next, seen);
}

export function setActiveTheme(id: PaletteThemeId): void {
  if (!paletteThemes.some(theme => theme.id === id)) return;
  activeTheme.value = id;
  activeValueMap.value = new Map([...baseValueMap, ...overrides[id]]);
  for (const group of [...rampGroups, ...allSemanticGroups, ...radiusGroups, ...vizGroups]) {
    for (const token of group.tokens) {
      token.value = overrides[id].get(token.name) ?? baseTokenValues.get(token.name) ?? token.value;
      token.ref = /^var\((--[\w-]+)\)$/.exec(token.value)?.[1] ?? '';
    }
  }
}

/** 预览组件用 CSS var() 取色，把当前主题的变量挂在 palette 根节点，避免影响主应用 */
export const themeVars = computed<Record<string, string>>(() =>
  Object.fromEntries([...activeValueMap.value] as [string, string][]),
);
