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
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * theme-lint/plugin —— 主题令牌漂移检查
 *
 * 覆盖：template / script / <style> 块 / 独立 .css（@eslint/css 提供 css language）。
 * 映射真源见 scripts/theme-lint/map.mjs（与 uno.config.ts 同源）。
 *
 * 规则：
 *   no-hardcoded-color  写死色值（hex / rgb / hsl）               存量清零前 warn
 *   no-default-palette  uno 默认调色板类名（text-red-500）          error
 *   prefer-uno-class    class 内用 var() 而非 uno 注册类            error
 *   no-foreign-var      var() 引用不在 --bkms-* 白名单且非同文件局部变量 存量清零前 warn
 *
 * 注意：<template> 不在 ESLint 默认遍历的 AST 里，必须走 parserServices.defineTemplateBodyVisitor，
 * 直接写 VLiteral 选择器不会触发；<style> 只能从 getDocumentFragment 取文本后按声明切。
 */
import {
  COLOR_KINDS,
  hexOfVar,
  isThemeVar,
  layerOfClass,
  layerOfVar,
  nearestClasses,
  nearestVars,
  suggestClass,
  suggestShadowVar,
  suggestVar,
} from './map.mjs';

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const URL_HASH_RE = /url\(\s*#[\w-]+\s*\)/g;
const VAR_RE = /var\(\s*(--[\w-]+)/g;
/** 单次提取用非全局版：带 g 的 String.match 不返回捕获组 */
const VAR_ONE_RE = /var\(\s*(--[\w-]+)/;
/** 任意值工具类：text-[...] / border-t-[...] / shadow-[...] */
const ARBITRARY_RE = /([\w-]+)-\[([^\]]*)\]/g;
/** 单个任意值里的色值（用于 class 场景的类名建议）。只认 hex / rgb / hsl，命名色（text-[red]）不查 */
const ANY_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/;
/** 同一份源的全局版：数任意值里有几个色值、把色值剥掉看剩余形态。不能复用带 g 的 lastIndex */
const ANY_COLOR_G_RE = new RegExp(ANY_COLOR_RE.source, 'g');
/** 任意值后的透明度修饰符：bg-[#fff]/50、bg-[#fff]/[0.5] */
const ALPHA_SUFFIX_RE = /^\/(\[[^\]]+\]|\d+(?:\.\d+)?)/;
/** 3 位 hex 歧义大（'#101' 可能是编号），只在颜色语境（属性名已知 / class 任意值）才认定 */
const SHORT_HEX_RE = /^#[0-9a-fA-F]{3}$/;
/**
 * CSS 声明：必须以 ; 或 } 收尾，避免把选择器 / @media 前奏误判成声明。
 * 文末（$）也算收尾：`.vue` 里最后一条声明没写分号、后面紧跟 `</style>` 时块文本就此结束。
 */
const STYLE_DECL_RE = /([\w-]+)\s*:\s*([^;{}]+)(?=[;}]|$)/g;

const UNO_PALETTE = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
const COLOR_UTILITY_KINDS = COLOR_KINDS.filter(k => k !== 'shadow');
/** 边框 / 分隔线在 kind 与调色板之间还有一层方向词：border-t-red-500、divide-x-red-500 */
const DIRECTIONAL_KINDS = { border: '(?:-[trblxyse])?', divide: '(?:-[xy])?' };
const PLAIN_KINDS = COLOR_UTILITY_KINDS.filter(k => !(k in DIRECTIONAL_KINDS));
/** shadow / ring-offset 无注册类，不能进 COLOR_UTILITY_KINDS，只在调色板判定里单列 */
const KIND_PREFIX = `(?:${PLAIN_KINDS.join('|')}|border${DIRECTIONAL_KINDS.border}|divide${DIRECTIONAL_KINDS.divide}|shadow|ring-offset)`;
const UNO_PALETTE_RE = new RegExp(`${KIND_PREFIX}-(?:${UNO_PALETTE.join('|')})-(?:50|[1-9]\\d{2})(?![\\w-])`, 'g');

/** style 属性名 → 语义组，用于给更准的 var() 建议 */
const GROUP_BY_PROPERTY = {
  color: 'text',
  fill: 'text',
  background: 'bg',
  backgroundColor: 'bg',
  borderColor: 'line',
  borderTopColor: 'line',
  borderBottomColor: 'line',
  borderLeftColor: 'line',
  borderRightColor: 'line',
};

/** 透明度修饰符 → 百分比字符串（/50 → 50%，/[0.5] → 50%）；无法解析或越界时 null */
function alphaRatio(raw) {
  const value = raw.replace(/^\[|\]$/g, '');
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  const pct = value.endsWith('%') || n > 1 ? n : n * 100;
  // 越界（/150）拼不出有意义的 color-mix，走「只报不修」
  if (pct < 0 || pct > 100) return null;
  return `${Number(pct.toFixed(2))}%`;
}

/**
 * 半透明类名：uno 只给 rgb()/hex 这类实色加 alpha，var() 色值的 `/50` 会被静默丢弃
 * （border-bkms-neutral-10/50 生成的就是不带 alpha 的 border-color）。
 * 按 uno.config 规则 4 落到 color-mix 任意值，alpha 语义才保得住。
 */
function colorMixClass(prefix, varName, ratio) {
  if (!varName) return null;
  return `${prefix}-[color-mix(in_srgb,var(${varName})_${ratio},transparent)]`;
}

/**
 * 任意值是不是「复合值」：只有「归一后整串就是一个色值」才判单值。
 * bg-[linear-gradient(…#F8B64F…)] / bg-[url(…)] 整体替换成单一注册类会丢内容；
 * border-[1px_solid_#fff] 这类边框简写同理——套用注册类会把 1px solid 一起抹掉。
 * 两种都只报不修（曾经的实现会整串替换，渐变和简写都被吃掉）。
 */
function isCompoundArbitrary(inner) {
  const colors = inner.match(ANY_COLOR_G_RE) ?? [];
  // 多色值一定是复合；一个色值都没有时交给调用方（那里已经先验过 ANY_COLOR_RE）
  if (colors.length !== 1) return colors.length > 1;
  // 单色：除色值外还夹着别的 token（1px_solid、函数调用、第二个值）即为复合
  return inner.trim() !== colors[0];
}

/**
 * 源令牌与目标类是否跨层（色阶 ↔ 语义）。
 * 同值不代表同层：--bkms-brand-2 与 bkms-text-brand 现在同色，语义层一旦分叉就改错了，
 * 所以跨层只给候选，由人工确认。no-hardcoded-color 的 hex→类是从「无层」到「有层」，不适用此判定。
 * 层判定复用 map.mjs 的色阶 / 语义表，不再维护第二份正则。
 */
function isCrossLayer(name, target) {
  const from = layerOfVar(name);
  const to = layerOfClass(target);
  return Boolean(from && to) && from !== to;
}

/** 工具类前缀 → { kind, dir }：border-t → { kind: 'border', dir: 't' } */
function kindOfUtility(prefix) {
  const [head, dir] = prefix.split('-');
  if (head === 'border' && dir) return { kind: 'border', dir };
  // divide-x / divide-y 只定义分隔线宽度，颜色只有不带方向的 divide-<color>：
  // 压平成 divide-<color> 会把横向分隔线改成四向，方向和语义一起被改
  if (head === 'divide' && (dir === 'x' || dir === 'y')) return { kind: 'unregistered' };
  if (head === 'shadow') return { kind: 'shadow' };
  // ring-offset-* 没有对应的 uno 注册类：按 ring 处理会把外发光环修成实心环，语义被改
  if (head === 'ring' && dir === 'offset') return { kind: 'unregistered' };
  return COLOR_UTILITY_KINDS.includes(head) ? { kind: head } : null;
}

/**
 * uno 用 `_` 转义任意值里的空格：判定前还原成空格，否则 `#F8B64F_0%` 这类
 * 因为 `\b` 在 `_` 前不成立而被整条漏掉（色值后面紧跟 `_` 是最常见的渐变写法）。
 * 等长替换，调用方的偏移不受影响。
 */
function normalizeArbitrary(inner) {
  return inner.replace(/_/g, ' ');
}

/** 注册类名 → 对应令牌 var：bkms-bg-card → --bkms-bg-card、bg-bkms-neutral-1 → --bkms-neutral-1 */
function varOfClass(target) {
  const idx = typeof target === 'string' ? target.indexOf('bkms-') : -1;
  return idx < 0 ? null : `--${target.slice(idx)}`;
}

/** template 内既有静态属性（VLiteral）也有绑定表达式（Literal），两者都要挂 */
const templateVisitors = check => ({ VLiteral: check, Literal: check });
const scriptVisitors = check => ({ Literal: check });

/** 属性名 → 语义组；业务里多为 iconBgColor / badgeColor 这类复合名，按后缀兜底 */
function groupOfProperty(name) {
  if (!name) return null;
  if (GROUP_BY_PROPERTY[name]) return GROUP_BY_PROPERTY[name];
  if (/background|bgcolor/i.test(name)) return 'bg';
  if (/border/i.test(name)) return 'line';
  if (/colou?r/i.test(name)) return 'text';
  return null;
}

function isClassContext(node) {
  let p = node.parent;
  while (p) {
    if (p.type === 'VAttribute') {
      const key = p.key;
      if (!key) return false;
      // :class 的 key 是 VDirectiveKey，类名在 argument 上
      if (key.type === 'VDirectiveKey') {
        return key.argument?.type === 'VIdentifier' && key.argument.name === 'class';
      }
      return key.name === 'class';
    }
    if (p.type === 'VElement' || p.type === 'Program' || p.type === 'VDocumentFragment') return false;
    p = p.parent;
  }
  return false;
}

/** style 对象里的属性名（script 的 { color: '#fff' }） */
function propertyNameOf(node) {
  const p = node.parent;
  if (p?.type === 'Property' && p.value === node && !p.computed) {
    return p.key.name ?? p.key.value ?? null;
  }
  return null;
}

/**
 * template 走 defineTemplateBodyVisitor（已按规则上下文绑定），普通文件走 script 访问器。
 * 签名是 (templateBodyVisitor, scriptVisitor)，不要再传 context。
 */
function withTemplate(context, templateVisitor, scriptVisitor) {
  const services = context.sourceCode?.parserServices ?? context.parserServices;
  if (typeof services?.defineTemplateBodyVisitor === 'function') {
    return services.defineTemplateBodyVisitor(templateVisitor, scriptVisitor);
  }
  return scriptVisitor;
}

const literalValue = node => (typeof node.value === 'string' ? node.value : null);

/**
 * 字面量内部偏移 → 源码绝对偏移（VLiteral/Literal 的 range 含引号，值本身从 +1 开始）。
 * 先按 +1 试：同一串文本在节点里重复出现时，indexOf 会取到第一个出现位置而错位。
 * 值在源码中不逐字出现（值里带转义字符，如 'it\'s'）时无法线性映射，只能回退到值起点 +1。
 */
const makeBaseOf = sourceCode => (node, text) => {
  const raw = sourceCode.getText(node);
  if (raw.slice(1, 1 + text.length) === text) return node.range[0] + 1;
  const offset = raw.indexOf(text);
  return node.range[0] + (offset >= 0 ? offset : 1);
};

/** 规则只拿到正则命中时，按「字面量基址 + 命中偏移」换算 loc，避免整串高亮 */
const makeMatchLoc = sourceCode => {
  const baseOf = makeBaseOf(sourceCode);
  return (node, text, match) => {
    const start = baseOf(node, text) + match.index;
    return {
      start: sourceCode.getLocFromIndex(start),
      end: sourceCode.getLocFromIndex(start + match[0].length),
    };
  };
};

/**
 * CSS 块注释等长置空，偏移不变（两条规则共用，注释里的色值 / var() 都不算）。
 * 只认块注释，不认 `//`：CSS 语境没有行注释，而 url(//cdn/x.png) 的协议相对地址前一个字符是
 * `(`，按 `//` 吞掉会把本行后续声明整段变成注释（实测 background + color 同行时 color 漏报）。
 */
function maskCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
}

/**
 * 取 .vue 的 <style> 块文本与绝对起始偏移。
 * vue-eslint-parser 不解析 style 内容，但 getDocumentFragment 能给出 <style> 元素及其 VText（带 range）。
 */
function styleBlocks(sourceCode) {
  const fragment = sourceCode.parserServices?.getDocumentFragment?.();
  if (!fragment) return [];
  const blocks = [];
  for (const el of fragment.children) {
    if (el.type !== 'VElement' || el.name !== 'style') continue;
    for (const child of el.children) {
      if (child.type === 'VText' && child.value.trim()) {
        blocks.push({ text: child.value, start: child.range[0] });
      }
    }
  }
  return blocks;
}

/**
 * 取 start 处 `var(` 到配对 `)` 的整段文本（支持嵌套 var()）。
 * 用于判断 fallback 里是否已引用令牌，避免把「可注入 + 回退」当成外来变量。
 */
function varCallText(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')' && --depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

export default {
  meta: { name: 'theme' },
  rules: {
    'no-hardcoded-color': {
      meta: {
        type: 'problem',
        docs: { description: '禁止写死色值，改用主题令牌' },
        fixable: 'code',
        hasSuggestions: true,
        schema: [],
        messages: {
          useClass: '写死色值 {{value}}，改用 uno 注册类 {{target}}',
          useClassUnknown: '写死色值 {{value}}，token 层无同值色值：新增 token 或改用最近的语义类',
          useVar: '写死色值 {{value}}，改用 {{target}}',
          useVarUnknown: '写死色值 {{value}}，token 层无同值色值：先新增 token（src/styles/theme/tokens）',
          shadow: '写死色值 {{value}}，改用 shadow-[…{{target}}]（uno 未注册阴影类，class 内 var() 属例外）',
          unregistered: '写死色值 {{value}}，{{utility}} 未注册 uno 类：先补注册再改（不自动修复，避免语义被改）',
          compound:
            '写死色值 {{value}} 位于 {{utility}} 的复合值（渐变 / 函数参数）里：换成单一注册类会丢内容，请手工改写',
          alpha: '写死色值 {{value}} 带透明度修饰：注册类会把 /alpha 静默丢弃，改用 color-mix 保留半透明',
          suggestClass: '改用 {{target}}（最接近，语义需自行确认）',
          suggestVar: '改用 {{target}}（最接近，语义需自行确认）',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode;

        const locOf = (start, length) => ({
          start: sourceCode.getLocFromIndex(start),
          end: sourceCode.getLocFromIndex(start + length),
        });

        const baseOf = makeBaseOf(sourceCode);

        /** inner 是 `_`→空格 还原后的副本，偏移一律以原始 token.index 为准；inClass 决定能不能自动修 */
        function checkClassToken(node, token, inner, base, text, inClass) {
          const [whole, prefix] = token;
          const utility = kindOfUtility(prefix);
          if (!utility) return;
          const hex = inner.match(ANY_COLOR_RE)?.[0];
          if (!hex) return;

          const index = base + token.index;
          const loc = locOf(index, whole.length);

          // shadow / unregistered 都必须排在复合值之前：shadow-[0_0_8px_#fff] 的整串本来就不是
          // 单个色值，先判复合会把它从「阴影例外」降级成通用的 compound 文案
          if (utility.kind === 'shadow') {
            const target = suggestShadowVar(hex);
            context.report({
              node,
              loc,
              messageId: 'shadow',
              data: { value: hex, target: target ?? 'var(--bkms-shadow-*)' },
            });
            return;
          }

          // 未注册的类（ring-offset-*）只报不修：替换成 ring-* 会改掉语义
          if (utility.kind === 'unregistered') {
            context.report({ node, loc, messageId: 'unregistered', data: { value: hex, utility: prefix } });
            return;
          }

          // 复合值（渐变 / 函数参数 / 边框简写）只报不修：整段替换会连其余内容一起抹掉
          if (isCompoundArbitrary(inner)) {
            context.report({ node, loc, messageId: 'compound', data: { value: hex, utility: prefix } });
            return;
          }

          const target = suggestClass(hex, utility.kind, { dir: utility.dir });
          // 带 /alpha 时注册类的 alpha 会被 uno 静默丢弃（50% 变 100%），改落 color-mix
          const alphaMatch = text.slice(token.index + whole.length).match(ALPHA_SUFFIX_RE);
          if (alphaMatch) {
            const ratio = alphaRatio(alphaMatch[1]);
            const mix = target && ratio ? colorMixClass(prefix, varOfClass(target), ratio) : null;
            context.report({
              node,
              loc: locOf(index, whole.length + alphaMatch[0].length),
              messageId: 'alpha',
              data: { value: hex, target },
              fix:
                mix && inClass
                  ? fixer => fixer.replaceTextRange([index, index + whole.length + alphaMatch[0].length], mix)
                  : undefined,
            });
            return;
          }

          const replace = fixer => fixer.replaceTextRange([index, index + whole.length], target);
          context.report({
            node,
            loc,
            messageId: target ? 'useClass' : 'useClassUnknown',
            data: { value: hex, target },
            // 非 class 语境（script 里的普通字符串）只提示不改：那里可能只是文案 / 选择器数据
            fix: target && inClass ? replace : undefined,
            // 无同值 token 时给相近候选，灯泡里点选（人工确认语义）
            suggest:
              target || !inClass
                ? undefined
                : nearestClasses(hex, utility.kind, { dir: utility.dir }).map(cls => ({
                    messageId: 'suggestClass',
                    data: { target: cls },
                    fix: fixer => fixer.replaceTextRange([index, index + whole.length], cls),
                  })),
          });
        }

        function check(node) {
          const text = literalValue(node);
          if (text === null) return;

          const base = baseOf(node, text);
          const inClass = isClassContext(node);
          let inClassToken = false;
          for (const token of text.matchAll(ARBITRARY_RE)) {
            const inner = normalizeArbitrary(token[2]);
            if (!ANY_COLOR_RE.test(inner)) continue;
            inClassToken = true;
            checkClassToken(node, token, inner, base, text, inClass);
          }
          if (inClassToken || inClass) return;

          const group = groupOfProperty(propertyNameOf(node));
          // url(#id) 是 SVG 引用不是色值：等长置空，避免偏移错位
          const safe = text.replace(URL_HASH_RE, m => ' '.repeat(m.length));
          for (const m of safe.matchAll(COLOR_RE)) {
            // 无颜色语境时 3 位 hex 不认（getByText('#101') 这类编号会误报）
            if (group === null && SHORT_HEX_RE.test(m[0])) continue;
            const start = base + m.index;
            const end = start + m[0].length;
            const target = suggestVar(m[0], { group });
            context.report({
              node,
              loc: locOf(start, m[0].length),
              messageId: target ? 'useVar' : 'useVarUnknown',
              data: { value: m[0], target },
              fix: target ? fixer => fixer.replaceTextRange([start, end], target) : undefined,
              suggest: target
                ? undefined
                : nearestVars(m[0], { group }).map(v => ({
                    messageId: 'suggestVar',
                    data: { target: v },
                    fix: fixer => fixer.replaceTextRange([start, end], v),
                  })),
            });
          }
        }

        /** CSS 语境（style 块 / .css 文件）报一处色值：一律给 var()，class 内才给注册类 */
        function reportVarAt(start, raw, group) {
          const end = start + raw.length;
          const target = suggestVar(raw, { group });
          context.report({
            loc: locOf(start, raw.length),
            messageId: target ? 'useVar' : 'useVarUnknown',
            data: { value: raw, target },
            fix: target ? fixer => fixer.replaceTextRange([start, end], target) : undefined,
            suggest: target
              ? undefined
              : nearestVars(raw, { group }).map(v => ({
                  messageId: 'suggestVar',
                  data: { target: v },
                  fix: fixer => fixer.replaceTextRange([start, end], v),
                })),
          });
        }

        /** .vue 的 <style> 块 */
        function checkStyleBlock(styleText, blockStart) {
          const text = maskCssComments(styleText);
          for (const decl of text.matchAll(STYLE_DECL_RE)) {
            const value = decl[2];
            const valueStart = blockStart + decl.index + decl[0].lastIndexOf(value);
            const group = groupOfProperty(decl[1]);
            for (const m of value.matchAll(COLOR_RE)) reportVarAt(valueStart + m.index, m[0], group);
          }
        }

        /** 独立 .css 文件（@eslint/css 的 CSS AST：Value 节点的文本与偏移） */
        function checkCssDeclaration(node) {
          const valueNode = node.value;
          if (valueNode?.type !== 'Value') return;
          const text = sourceCode.getText(valueNode);
          const base = valueNode.loc.start.offset;
          const group = groupOfProperty(node.property?.name ?? node.property);
          for (const m of text.matchAll(COLOR_RE)) reportVarAt(base + m.index, m[0], group);
        }

        const isVue = context.filename.endsWith('.vue');
        const scriptVisitor = {
          ...scriptVisitors(check),
          Program() {
            if (!isVue) return;
            for (const block of styleBlocks(sourceCode)) checkStyleBlock(block.text, block.start);
          },
        };
        return { ...withTemplate(context, templateVisitors(check), scriptVisitor), Declaration: checkCssDeclaration };
      },
    },

    'no-default-palette': {
      meta: {
        type: 'problem',
        docs: { description: '禁止使用 uno 默认调色板类名' },
        schema: [],
        messages: {
          banned: '{{value}} 是 uno 默认调色板，属写死色值的间接形态：改用 bkms-* 注册类或语义 shortcut',
        },
      },
      create(context) {
        const locOfMatch = makeMatchLoc(context.sourceCode);

        function check(node) {
          const text = literalValue(node);
          if (text === null || !isClassContext(node)) return;
          for (const m of text.matchAll(UNO_PALETTE_RE)) {
            context.report({
              node,
              loc: locOfMatch(node, text, m),
              messageId: 'banned',
              data: { value: m[0] },
            });
          }
        }
        return withTemplate(context, templateVisitors(check), scriptVisitors(check));
      },
    },

    'prefer-uno-class': {
      meta: {
        type: 'problem',
        docs: { description: 'class 内必须使用 uno 注册类，禁止 var() 任意值' },
        fixable: 'code',
        hasSuggestions: true,
        schema: [],
        messages: {
          banned: 'class 内禁止 var() 任意值（{{value}}）：改用 uno 注册类 {{target}}',
          bannedUnknown: 'class 内禁止 var() 任意值（{{value}}）：该令牌无注册类，先补 uno 注册',
          unregistered: 'class 内禁止 var() 任意值（{{value}}）：{{utility}} 工具类未注册 uno 类，先补注册',
          crossLayer:
            'class 内禁止 var() 任意值（{{value}}）：{{target}} 与源令牌不同层，值相同但语义会分叉，确认后再改',
          alpha: 'class 内禁止 var() 任意值（{{value}}）：注册类会丢弃 /alpha，改用 {{target}}',
          suggestClass: '改用 {{target}}（跨令牌层，语义需自行确认）',
        },
      },
      create(context) {
        const baseOf = makeBaseOf(context.sourceCode);

        function check(node) {
          const text = literalValue(node);
          if (text === null || !isClassContext(node)) return;
          const base = baseOf(node, text);
          for (const token of text.matchAll(ARBITRARY_RE)) {
            const [whole, prefix, inner] = token;
            const name = inner.match(VAR_ONE_RE)?.[1];
            if (!name || !isThemeVar(name)) continue;

            const utility = kindOfUtility(prefix);
            // 例外（uno.config 规则 4/5）：阴影类未注册（shadow-[…var(--bkms-*) ] 是唯一写法）；
            // color-mix 是半透明场景的合法写法
            if (utility?.kind === 'shadow' || inner.includes('color-mix(')) continue;

            const start = base + token.index;
            const loc = {
              start: context.sourceCode.getLocFromIndex(start),
              end: context.sourceCode.getLocFromIndex(start + whole.length),
            };

            // 缺注册的是工具类本身（ring-offset-*），不是令牌：不能复用 bannedUnknown 的文案
            if (utility?.kind === 'unregistered') {
              context.report({ node, loc, messageId: 'unregistered', data: { value: name, utility: prefix } });
              continue;
            }

            const target = utility ? suggestClass(hexOfVar(name), utility.kind, { dir: utility.dir }) : null;
            const end = start + whole.length;
            const replace = fixer => fixer.replaceTextRange([start, end], target);
            // 源是色阶 token、目标是语义类（或反过来）：值相同但层不同，语义层将来分叉就改错了
            const crossLayer = Boolean(target) && isCrossLayer(name, target);

            // 带 /alpha 时注册类会把 alpha 静默丢弃：用源令牌本身拼 color-mix，alpha 和层都不变。
            // 跨层也走这里——把任意值换成注册类（含 suggestion）同样会留下孤立的 `/50`。
            const alphaMatch = text.slice(token.index + whole.length).match(ALPHA_SUFFIX_RE);
            if (alphaMatch) {
              const ratio = alphaRatio(alphaMatch[1]);
              const mix = ratio ? colorMixClass(prefix, name, ratio) : null;
              context.report({
                node,
                loc: {
                  start: context.sourceCode.getLocFromIndex(start),
                  end: context.sourceCode.getLocFromIndex(end + alphaMatch[0].length),
                },
                messageId: 'alpha',
                data: { value: name, target: mix ?? 'color-mix' },
                fix: mix ? fixer => fixer.replaceTextRange([start, end + alphaMatch[0].length], mix) : undefined,
              });
              continue;
            }

            context.report({
              node,
              loc,
              messageId: crossLayer ? 'crossLayer' : target ? 'banned' : 'bannedUnknown',
              data: { value: name, target },
              fix: target && !crossLayer ? replace : undefined,
              suggest: crossLayer ? [{ messageId: 'suggestClass', data: { target }, fix: replace }] : undefined,
            });
          }
        }
        return withTemplate(context, templateVisitors(check), scriptVisitors(check));
      },
    },

    'no-foreign-var': {
      meta: {
        type: 'problem',
        docs: { description: 'var() 只放行 --bkms-* 与同文件局部变量' },
        schema: [],
        messages: {
          banned: 'var({{value}}) 不在白名单：只放行 --bkms-*（及同文件内定义的局部变量）',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const baseOf = makeBaseOf(sourceCode);
        // 同文件局部变量：.vue 的 <style> 块、.css 整份文件都在 sourceCode.text 里
        const locals = new Set([...sourceCode.text.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));

        const locOf = (start, length) => ({
          start: sourceCode.getLocFromIndex(start),
          end: sourceCode.getLocFromIndex(start + length),
        });

        /** 从绝对偏移开始扫 var()：template / script / style 块 / .css 共用一条路径 */
        function scanVars(text, start) {
          for (const m of text.matchAll(VAR_RE)) {
            if (isThemeVar(m[1]) || locals.has(m[1])) continue;
            // `var(--注入变量, var(--bkms-*))` 是有意的主题扩展点：外部可覆盖，未覆盖时回退到令牌
            const call = varCallText(text, m.index);
            const fallback = call.slice(call.indexOf(',') + 1);
            if (call.includes(',') && /var\(\s*--bkms-/.test(fallback)) continue;
            context.report({
              loc: locOf(start + m.index, m[0].length),
              messageId: 'banned',
              data: { value: m[1] },
            });
          }
        }

        function check(node) {
          const text = literalValue(node);
          if (text === null) return;
          scanVars(text, baseOf(node, text));
        }

        /** .vue 的 <style> 块：内容不是 Literal，只能从 documentFragment 取文本（注释置空） */
        function checkStyleBlock(styleText, blockStart) {
          scanVars(maskCssComments(styleText), blockStart);
        }

        /** 独立 .css：@eslint/css 的 Declaration.value 是 Value 节点 */
        function checkCssDeclaration(node) {
          const valueNode = node.value;
          if (valueNode?.type !== 'Value') return;
          scanVars(sourceCode.getText(valueNode), valueNode.loc.start.offset);
        }

        const isVue = context.filename.endsWith('.vue');
        const scriptVisitor = {
          ...scriptVisitors(check),
          Program() {
            if (!isVue) return;
            for (const block of styleBlocks(sourceCode)) checkStyleBlock(block.text, block.start);
          },
        };
        return { ...withTemplate(context, templateVisitors(check), scriptVisitor), Declaration: checkCssDeclaration };
      },
    },
  },
};
