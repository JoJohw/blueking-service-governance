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
 * theme-lint/rules/shared —— 各维度规则模块共用的挂载与定位设施
 *
 * 规则按令牌维度分模块（color / radius），这里只放跨维度通用的东西：
 * 四路挂载（template / script / style 块 / .css）、字面量基址换算、类名与声明切分。
 * 不承载任何颜色或圆角语义——语义判定属于各自模块。
 *
 * 新维度接进来时：写 `rules/<维度>.mjs` 导出规则对象，在 plugin.mjs 里合并即可，
 * 不要再回到 plugin.mjs 里堆规则。
 */

/** CSS 声明：必须以 ; 或 } 收尾，避免把选择器 / @media 前奏误判成声明。
 * 文末（$）也算收尾：`.vue` 里最后一条声明没写分号、后面紧跟 `</style>` 时块文本就此结束 */
export const STYLE_DECL_RE = /([\w-]+)\s*:\s*([^;{}]+)(?=[;}]|$)/g;

export const VAR_RE = /var\(\s*(--[\w-]+)/g;

/** 任意值工具类：text-[...] / border-t-[...] / rounded-[...] */
export const ARBITRARY_RE = /([\w-]+)-\[([^\]]*)\]/g;

/**
 * class 文本里的任意值工具类。
 * inner 已把 uno 的 `_` 还原成空格，start 是类名在源码里的绝对偏移。
 */
export function* arbitraryUtilities(text, base) {
  for (const m of text.matchAll(ARBITRARY_RE)) {
    yield { whole: m[0], prefix: m[1], inner: normalizeArbitrary(m[2]), start: base + m.index };
  }
}

/**
 * class 文本 → 类名本体与绝对偏移，剥掉变体与修饰前缀（hover: / md: / !）。
 * 按最后一个 `:` 切：任意值里的 `:`（color-mix）只在方括号内，类名本体不会有别的冒号。
 */
export function* classTokens(text, base) {
  for (const m of text.matchAll(/[^\s"'`]+/g)) {
    const name = m[0].slice(m[0].lastIndexOf(':') + 1).replace(/^!/, '');
    if (name) yield { name, start: base + m.index + m[0].length - name.length };
  }
}

/**
 * 规则工厂：一条 theme 规则要覆盖 template / script / style 块 / .css 四个入口，
 * 挂载方式完全相同（含 vue-eslint-parser 的 defineTemplateBodyVisitor 细节）。
 * 工厂只负责挂载，判定逻辑保持各规则的纯函数：
 *
 *   check(node, text, helpers)      每条字面量（template 的 VLiteral、script 的 Literal）
 *   checkStyle(block, helpers)      .vue 的 <style> 块（block = { text, start }）
 *   checkCss(node, helpers)         独立 .css 的 Declaration 节点
 *   checkBinding(node, text, helpers)  :class / v-bind:class 绑定的整段表达式文本
 *
 * checkBinding 是可选的：绑定里的类名是一串互不相干的 Literal，逐字面量判定看不到
 * 「同一元素上的多个类」，需要整段表达式的规则（如圆角叠加）才挂。
 */
export function createThemeRule({ meta, check, checkStyle, checkCss, checkBinding }) {
  return {
    meta,
    create(context) {
      const helpers = makeRuleHelpers(context);

      const onLiteral = node => {
        const text = literalValue(node);
        if (text !== null) check(node, text, helpers);
      };

      const scriptVisitor = { ...scriptVisitors(onLiteral) };
      if (checkStyle) {
        // <style> 内容不是 Literal（是 VText），vue-eslint-parser 不进 AST，只能从文档片段取文本
        scriptVisitor.Program = () => {
          if (!context.filename.endsWith('.vue')) return;
          for (const block of styleBlocks(helpers.sourceCode)) checkStyle(block, helpers);
        };
      }

      const templateVisitor = { ...templateVisitors(onLiteral) };
      if (checkBinding) {
        // 静态 class 已由 VLiteral 覆盖，这里只接 :class 绑定，避免同一处检查两遍
        templateVisitor.VAttribute = node => {
          const key = node.key;
          const isClassBinding =
            key?.type === 'VDirectiveKey' &&
            key.argument?.type === 'VIdentifier' &&
            key.argument.name === 'class' &&
            node.value?.type === 'VExpressionContainer';
          if (!isClassBinding) return;
          checkBinding(node, helpers.sourceCode.getText(node.value), helpers);
        };
      }

      const visitors = { ...withTemplate(context, templateVisitor, scriptVisitor) };
      if (checkCss) visitors.Declaration = node => checkCss(node, helpers);
      return visitors;
    },
  };
}

export function isClassContext(node) {
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

export const literalValue = node => (typeof node.value === 'string' ? node.value : null);

/**
 * 字面量内部偏移 → 源码绝对偏移（VLiteral/Literal 的 range 含引号，值本身从 +1 开始）。
 * 先按 +1 试：同一串文本在节点里重复出现时，indexOf 会取到第一个出现位置而错位。
 * 值在源码中不逐字出现（值里带转义字符，如 'it\'s'）时无法线性映射，只能回退到值起点 +1。
 */
export function makeBaseOf(sourceCode) {
  return (node, text) => {
    const raw = sourceCode.getText(node);
    if (raw.slice(1, 1 + text.length) === text) return node.range[0] + 1;
    const offset = raw.indexOf(text);
    return node.range[0] + (offset >= 0 ? offset : 1);
  };
}

/** 规则只拿到正则命中时，按「字面量基址 + 命中偏移」换算 loc，避免整串高亮 */
export function makeMatchLoc(sourceCode) {
  const baseOf = makeBaseOf(sourceCode);
  return (node, text, match) => {
    const start = baseOf(node, text) + match.index;
    return {
      start: sourceCode.getLocFromIndex(start),
      end: sourceCode.getLocFromIndex(start + match[0].length),
    };
  };
}

/**
 * CSS 块注释等长置空，偏移不变（注释里的色值 / var() 都不算）。
 * 只认块注释，不认 `//`：CSS 语境没有行注释，而 url(//cdn/x.png) 的协议相对地址前一个字符是
 * `(`，按 `//` 吞掉会把本行后续声明整段变成注释（实测 background + color 同行时 color 漏报）。
 */
export function maskCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
}

/**
 * uno 用 `_` 转义任意值里的空格：判定前还原成空格，否则 `#F8B64F_0%` 这类
 * 因为 `\b` 在 `_` 前不成立而被整条漏掉（色值后面紧跟 `_` 是最常见的渐变写法）。
 * 等长替换，调用方的偏移不受影响。
 */
export function normalizeArbitrary(inner) {
  return inner.replace(/_/g, ' ');
}

/** style 对象里的属性名（script 的 { color: '#fff' }） */
export function propertyNameOf(node) {
  // 值套了三元 / 逻辑运算时，node 的 parent 不是 Property，要沿表达式上溯再取键名
  let value = node;
  let p = value.parent;
  while (p?.type === 'ConditionalExpression' || p?.type === 'LogicalExpression') {
    value = p;
    p = p.parent;
  }
  if (p?.type === 'Property' && p.value === value && !p.computed) {
    return p.key.name ?? p.key.value ?? null;
  }
  return null;
}

/**
 * 规则公共上下文：定位、上报、替换、候选建议。
 * 「命中什么」每条规则各不相同，但这四件事每条都要做一遍，收在这里避免各写一份偏移换算。
 */
function makeRuleHelpers(context) {
  const sourceCode = context.sourceCode;
  const baseOf = makeBaseOf(sourceCode);

  /** 绝对偏移 → loc，report 与 fix range 用同一套偏移，避免各算一次造成高亮漂移 */
  const locOf = (start, length) => ({
    start: sourceCode.getLocFromIndex(start),
    end: sourceCode.getLocFromIndex(start + length),
  });

  return {
    context,
    sourceCode,
    baseOf,
    locOf,
    /** 统一上报：定位用绝对偏移 [start, start + length)，fix / suggest 由调用方给 range */
    report(node, start, length, extra) {
      context.report({ node, loc: locOf(start, length), ...extra });
    },
    /** 用 text 替换 [start, start + length) 的 fixer */
    replace(start, length, text) {
      return fixer => fixer.replaceTextRange([start, start + length], text);
    },
    /**
     * 多个候选 → 多条 suggestion，IDE 灯泡里逐条点选。
     * 同值不同场景（圆角 control/card/overlay 都是 6px）时不设默认项：替人定就是引入漂移。
     * labelOf 决定灯泡文案里的替换目标：候选是 token 对象时直接插值只会显示 [object Object]。
     */
    suggest(candidates, messageId, buildFix, labelOf = c => (typeof c === 'string' ? c : (c?.label ?? c?.name ?? ''))) {
      return candidates.map(candidate => ({
        messageId,
        data: { target: labelOf(candidate) },
        fix: buildFix(candidate),
      }));
    },
  };
}

export const scriptVisitors = check => ({ Literal: check });

/** 声明所属选择器文本：最近一个 `{` 之前、上一个 `}` 之后，用来提场景词 */
export function selectorOf(text, index) {
  const open = text.lastIndexOf('{', index);
  if (open < 0) return '';
  const close = text.lastIndexOf('}', open);
  return text.slice(close + 1, open);
}

/**
 * 取 .vue 的 <style> 块文本与绝对起始偏移。
 * vue-eslint-parser 不解析 style 内容，但 getDocumentFragment 能给出 <style> 元素及其 VText（带 range）。
 */
export function styleBlocks(sourceCode) {
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

/** template 内既有静态属性（VLiteral）也有绑定表达式（Literal），两者都要挂 */
export const templateVisitors = check => ({ VLiteral: check, Literal: check });

/**
 * 取 start 处 `var(` 到配对 `)` 的整段文本（支持嵌套 var()）。
 * 用于判断 fallback 里是否已引用令牌，避免把「可注入 + 回退」当成外来变量。
 */
export function varCallText(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')' && --depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

/**
 * template 走 defineTemplateBodyVisitor（已按规则上下文绑定），普通文件走 script 访问器。
 * 签名是 (templateBodyVisitor, scriptVisitor)，不要再传 context。
 */
export function withTemplate(context, templateVisitor, scriptVisitor) {
  const services = context.sourceCode?.parserServices ?? context.parserServices;
  if (typeof services?.defineTemplateBodyVisitor === 'function') {
    return services.defineTemplateBodyVisitor(templateVisitor, scriptVisitor);
  }
  return scriptVisitor;
}
