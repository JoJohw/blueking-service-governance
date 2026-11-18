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
 * theme-lint/rules/radius —— 圆角维度规则
 *
 *   no-hardcoded-radius  写死圆角长度（rounded-[6px]、border-radius: 6px）  存量清零前 warn
 *   prefer-radius-class  圆角必须走语义注册类：uno 内置刻度 / 档位类 / 档位直连  warn
 *
 * 与颜色最大的差别：同值一对多是常态（6px 有 control/card/overlay/tab 四个语义档），
 * 所以只有「同值档位唯一」才自动修，其余一律给候选由人挑场景。
 * 形状语义（50%、100%、≥100px 胶囊、rounded-full）不进档位，直接放行。
 */
import { isRadiusScaleVar, isRadiusSemanticVar, nearestRadiusSemantics, radiusSemantics } from '../map.mjs';
import {
  arbitraryUtilities,
  classTokens,
  createThemeRule,
  isClassContext,
  maskCssComments,
  propertyNameOf,
  selectorOf,
  STYLE_DECL_RE,
  VAR_RE,
} from './shared.mjs';

/** 圆角工具类：rounded / rounded-t / rounded-tl（两字母方向必须排在单字母前，否则 tl 会被拆成 t + l） */
const RADIUS_CLASS_RE = /^rounded(?:-(tl|tr|bl|br|t|r|b|l))?(?:-(.+))?$/;
/** uno 内置圆角刻度：值随根字号浮动（项目根字号 12px），不是令牌 */
const UNO_RADIUS_SCALE = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'];
/**
 * 非 class 语境可判定为圆角类名的形态：任意值（rounded-[…]）与档位类（rounded-bkms-*），含方向。
 * 裸 rounded / rounded-lg 在 title、文案里是常见英文词，按类名判会误报。
 */
const RADIUS_LOOKS_LIKE_CLASS_RE = /^rounded(?:-(?:tl|tr|bl|br|t|r|b|l))?-(?:\[|bkms-)/;
/** 圆角属性名：kebab（border-radius / border-top-left-radius）与 camel（borderRadius）通吃 */
const RADIUS_PROPERTY_RE = /^border[-]?(?:top|bottom)?[-]?(?:left|right)?[-]?radius$/i;
/** 声明尾部的 !important：只替换值本体，标记保留 */
const IMPORTANT_RE = /\s*!important\s*$/i;
/** 内联 style / script 字符串里的圆角声明（属性名不一定能拿到，只能按文本扫） */
const RADIUS_DECL_TEXT_RE = /border-radius\s*:\s*([^;}"']+)/g;
/**
 * 场景词 → 语义档：只用于候选排序（6px 有 control/card/overlay/tab 四个同值档）。
 * 命不中不报错，按令牌文件里的顺序给候选。
 */
const RADIUS_HINTS = [
  [/checkbox|radio/i, 'checkbox'],
  [/popover|dropdown|tooltip|dialog|modal|overlay|notify|message/i, 'overlay'],
  [/menu|nav|sidebar/i, 'menu'],
  [/tab/i, 'tab'],
  [/tag|badge/i, 'tag'],
  [/input|field|textarea|search|select/i, 'field'],
  [/scroll|thumb/i, 'scroll'],
  [/btn|button|switch|pagination|cascader|picker|upload|collapse/i, 'control'],
  [/card|panel|box|section|wrapper/i, 'card'],
];

/** class 里的圆角类名：内置刻度 / 档位类 / 档位任意值 / 未注册的 var 任意值 */
function checkRadiusClassName(node, className, start, text, h, fixable) {
  const radius = radiusClassOf(className);
  if (!radius) return;
  const { dir, tail } = radius;
  const hint = radiusHintOf(text);
  const classOf = t => radiusClassNameOf(dir, t.label);

  // rounded-[var(--bkms-radius-*)]：语义令牌只差注册类，档位则只给候选
  if (tail?.startsWith('[') && tail.endsWith(']')) {
    const name = radiusArbitrary(tail.slice(1, -1)).match(/var\(\s*(--bkms-radius-[\w-]+)\s*\)/)?.[1];
    if (!name) return;
    if (isRadiusScaleVar(name)) {
      const { candidates } = radiusCandidates(Number(name.replace('--bkms-radius-', '')), hint);
      h.report(node, start, className.length, {
        messageId: 'bannedStep',
        data: { value: name, targets: candidates.map(classOf).join(' / ') },
        suggest: fixable
          ? h.suggest(candidates, 'suggestRadius', t => h.replace(start, className.length, classOf(t)))
          : undefined,
      });
      return;
    }
    // 语义档必须真的存在：拼错时 auto-fix 会产出 uno 没注册的类名，比不修更伤
    if (!isRadiusSemanticVar(name)) {
      h.report(node, start, className.length, { messageId: 'unknownSemantic', data: { value: name } });
      return;
    }
    const label = name.replace('--bkms-radius-', '');
    h.report(node, start, className.length, {
      messageId: 'unregistered',
      data: { value: name, target: radiusClassNameOf(dir, label) },
      fix: fixable ? h.replace(start, className.length, radiusClassNameOf(dir, label)) : undefined,
    });
    return;
  }

  // 档位类（rounded-bkms-6）：迁移过渡期才允许，新代码一律走语义档
  if (tail?.startsWith('bkms-')) {
    // 档位存在才算档位：uno 不会为不存在的档位生成类，报它既非事实也给不出候选
    const scale = `--bkms-radius-${tail.slice('bkms-'.length)}`;
    if (!isRadiusScaleVar(scale)) return;
    const { candidates } = radiusCandidates(Number(tail.slice('bkms-'.length)), hint);
    h.report(node, start, className.length, {
      messageId: 'bannedStep',
      data: { value: className, targets: candidates.map(classOf).join(' / ') },
      suggest: fixable
        ? h.suggest(candidates, 'suggestRadius', t => h.replace(start, className.length, classOf(t)))
        : undefined,
    });
    return;
  }

  // 语义类（rounded-card）/ 形状（rounded-full / rounded-none）都不是本规则的目标
  if (tail && !UNO_RADIUS_SCALE.includes(tail)) return;

  // 裸 rounded / rounded-t 与内置刻度（rounded-lg）：值随根字号浮动，换算不出可靠档位
  h.report(node, start, className.length, { messageId: 'bannedScale', data: { value: className } });
}

/** class 里的圆角任意值：rounded[-方向]-[6px] */
function checkRadiusClassText(node, text, h, fixable) {
  const base = h.baseOf(node, text);
  const hint = radiusHintOf(text);
  for (const utility of arbitraryUtilities(text, base)) {
    const radius = radiusClassOf(utility.prefix);
    if (!radius) continue;
    checkRadiusValue(node, radiusArbitrary(utility.inner), h, {
      mode: 'class',
      dir: radius.dir,
      hint,
      span: { start: utility.start, length: utility.whole.length, fixable },
    });
  }
}

/** 独立 .css 的 Declaration */
function checkRadiusCss(node, h) {
  const valueNode = node.value;
  if (valueNode?.type !== 'Value') return;
  const property = node.property?.name ?? node.property;
  if (!RADIUS_PROPERTY_RE.test(property)) return;
  const text = h.sourceCode.getText(valueNode);
  const raw = text.replace(IMPORTANT_RE, '').trim();
  const hint = radiusHintOf(selectorOf(h.sourceCode.text, valueNode.loc.start.offset));
  checkRadiusValue(null, raw, h, {
    mode: 'var',
    hint,
    span: { start: valueNode.loc.start.offset + text.indexOf(raw), length: raw.length, fixable: true },
  });
}

/** 圆角声明里的档位直连（border-radius: var(--bkms-radius-6)）：档位只该被语义层引用 */
function checkRadiusScaleVar(node, text, start, h) {
  for (const m of text.matchAll(VAR_RE)) {
    if (!isRadiusScaleVar(m[1])) continue;
    const px = Number(m[1].replace('--bkms-radius-', ''));
    const { candidates } = radiusCandidates(px);
    const at = start + m.index;
    h.report(node, at, m[0].length, {
      messageId: 'bannedVar',
      data: { value: m[1], targets: candidates.map(t => t.label).join(' / ') },
      suggest: h.suggest(candidates, 'suggestRadius', t => h.replace(at, m[0].length, `var(${t.name})`)),
    });
  }
}

/** .vue 的 <style> 块 */
function checkRadiusStyleBlock({ text: styleText, start }, h) {
  const text = maskCssComments(styleText);
  for (const decl of text.matchAll(STYLE_DECL_RE)) {
    if (!RADIUS_PROPERTY_RE.test(decl[1])) continue;
    const raw = decl[2].replace(IMPORTANT_RE, '').trim();
    const valueStart = start + decl.index + decl[0].indexOf(raw);
    checkRadiusValue(null, raw, h, {
      mode: 'var',
      hint: radiusHintOf(selectorOf(text, decl.index)),
      span: { start: valueStart, length: raw.length, fixable: true },
    });
  }
}

/** 内联 style / script 字符串：属性名已知就用整串，否则扫 border-radius: 声明 */
function checkRadiusText(node, text, h) {
  const base = h.baseOf(node, text);
  const hint = radiusHintOf(text);
  const property = propertyNameOf(node);
  if (property && RADIUS_PROPERTY_RE.test(property)) {
    const raw = text.replace(IMPORTANT_RE, '').trim();
    checkRadiusValue(node, raw, h, {
      mode: 'var',
      hint,
      span: { start: base + text.indexOf(raw), length: raw.length, fixable: true },
    });
    return;
  }
  for (const m of text.matchAll(RADIUS_DECL_TEXT_RE)) {
    const raw = m[1].replace(IMPORTANT_RE, '').trim();
    checkRadiusValue(node, raw, h, {
      mode: 'var',
      hint,
      span: {
        start: base + m.index + m[0].length - m[1].length + m[1].indexOf(raw),
        length: raw.length,
        fixable: true,
      },
    });
  }
}

/**
 * 一个圆角值。span 是「要被整体替换掉的文本」：class 场景是整个类名（rounded-[4px]），
 * 声明场景是值本体（4px）——两者长度不同，拿值长度当替换长度会留下残片。
 */
function checkRadiusValue(node, raw, h, { mode, dir, hint, span }) {
  const value = raw.trim();
  const parts = value.split(/\s+/);
  if (parts.length > 1) {
    if (parts.some(p => radiusValueOf(p).kind === 'px')) {
      h.report(node, span.start, span.length, { messageId: 'compound', data: { value } });
    }
    return;
  }
  const parsed = radiusValueOf(value);
  if (parsed.kind !== 'px') return;
  reportRadiusValue(node, value, parsed.px, h, { mode, dir, hint, span });
}

/** uno 用 `_` 转义空格，判定前先还原 */
function radiusArbitrary(inner) {
  return inner.replace(/_/g, ' ').trim();
}

/** 同值语义档；档位里没有同值时（2px / 10px）退到最近档位 */
function radiusCandidates(px, hint) {
  const same = radiusSemantics(px, hint);
  return same.length ? { candidates: same, exact: true } : { candidates: nearestRadiusSemantics(px), exact: false };
}

/** 圆角语义类名：rounded-{语义}，方向保留 */
function radiusClassNameOf(dir, label) {
  return `rounded-${dir ? `${dir}-` : ''}${label}`;
}

/** 圆角工具类拆解：rounded-t-[6px] → { dir: 't', tail: '[6px]' }；不是圆角类返回 null */
function radiusClassOf(className) {
  const m = className.match(RADIUS_CLASS_RE);
  return m ? { dir: m[1], tail: m[2] } : null;
}

function radiusHintOf(text) {
  return RADIUS_HINTS.find(([re]) => re.test(text))?.[1];
}

/**
 * 圆角值归类：zero（0）/ shape（百分比、≥100px 胶囊）/ px / opaque（关键字等）。
 * 只认 px：rem/em 在项目里没有可依赖的基准（根字号被设成 12px），换算只会更错。
 */
function radiusValueOf(raw) {
  const value = raw.trim().toLowerCase();
  if (/^0(?:\.0+)?(?:px)?$/.test(value)) return { kind: 'zero' };
  if (/^-?\d+(?:\.\d+)?%$/.test(value)) return { kind: 'shape' };
  const m = value.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (!m) return { kind: 'opaque' };
  const px = Number(m[1]);
  if (px === 0) return { kind: 'zero' };
  // 胶囊（>=100px）与 rounded-full 同源，属形状语义，不进档位
  if (px >= 100) return { kind: 'shape' };
  return { kind: 'px', px };
}

/**
 * 写死圆角上报一处。mode 决定修复产物：class 落语义类（保留方向），CSS 落 var()。
 * 只有「同值语义档唯一」才自动改——同值多个时语义由场景决定，替人选就是引入漂移。
 */
function reportRadiusValue(node, raw, px, h, { mode, dir, hint, span }) {
  const { candidates, exact } = radiusCandidates(px, hint);
  const targetOf = t => (mode === 'class' ? radiusClassNameOf(dir, t.label) : `var(${t.name})`);

  if (exact && candidates.length === 1) {
    const target = targetOf(candidates[0]);
    h.report(node, span.start, span.length, {
      messageId: mode === 'class' ? 'useClass' : 'useVar',
      data: { value: raw, target },
      // 非 class 语境的字符串可能只是数据 / 文案，只报不修
      fix: span.fixable ? h.replace(span.start, span.length, target) : undefined,
    });
    return;
  }

  h.report(node, span.start, span.length, {
    messageId: exact
      ? mode === 'class'
        ? 'useClassMulti'
        : 'useVarMulti'
      : mode === 'class'
        ? 'useClassUnknown'
        : 'useVarUnknown',
    data: { value: raw, targets: candidates.map(t => t.label).join(' / ') },
    suggest: span.fixable
      ? h.suggest(candidates, 'suggestRadius', t => h.replace(span.start, span.length, targetOf(t)))
      : undefined,
  });
}

export default {
  'no-hardcoded-radius': createThemeRule({
    meta: {
      type: 'problem',
      docs: { description: '禁止写死圆角长度，改用圆角语义令牌' },
      fixable: 'code',
      hasSuggestions: true,
      schema: [],
      messages: {
        useClass: '写死圆角 {{value}}，改用 uno 注册类 {{target}}',
        useClassMulti: '写死圆角 {{value}}：{{targets}} 同值，按场景择一',
        useClassUnknown: '写死圆角 {{value}}：档位无同值，最近的语义档是 {{targets}}',
        useVar: '写死圆角 {{value}}，改用 {{target}}',
        useVarMulti: '写死圆角 {{value}}：{{targets}} 同值，按场景择一',
        useVarUnknown: '写死圆角 {{value}}：档位无同值，最近的语义档是 {{targets}}',
        compound: '写死圆角 {{value}} 位于多值简写里：四角语义不同，请手工改写',
        suggestRadius: '改用 {{target}}（语义需自行确认）',
      },
    },
    check(node, text, h) {
      const inClass = isClassContext(node);
      // script 里的动态类名同样是 class，扫描口径一致；只有 class 语境才给自动修
      checkRadiusClassText(node, text, h, inClass);
      if (!inClass) checkRadiusText(node, text, h);
    },
    checkStyle: checkRadiusStyleBlock,
    checkCss: checkRadiusCss,
  }),

  'prefer-radius-class': createThemeRule({
    meta: {
      type: 'problem',
      docs: { description: '圆角必须走语义注册类，禁用 uno 内置刻度与档位直连' },
      fixable: 'code',
      hasSuggestions: true,
      schema: [],
      messages: {
        bannedScale: '{{value}} 是 uno 内置圆角刻度（值随根字号浮动）：改用语义档 rounded-<场景>',
        bannedStep: '{{value}} 是圆角档位：档位只该被语义层引用，改用语义档 {{targets}}',
        bannedVar: '圆角值直接引用档位 {{value}}：改用语义档 var()（{{targets}}）',
        unregistered: '禁止圆角 var() 任意值（{{value}}）：改用语义类 {{target}}',
        unknownSemantic:
          '未知圆角语义档 {{value}}：令牌里没有它，先新增令牌（src/styles/theme/tokens/radius.css）或改用现有语义档',
        suggestRadius: '改用 {{target}}（语义需自行确认）',
      },
    },
    check(node, text, h) {
      const inClass = isClassContext(node);
      const base = h.baseOf(node, text);
      for (const { name, start } of classTokens(text, base)) {
        // 非 class 语境只认形态特殊的类名：裸 rounded / rounded-lg 在文案、数据里是常见英文词
        if (!inClass && !RADIUS_LOOKS_LIKE_CLASS_RE.test(name)) continue;
        checkRadiusClassName(node, name, start, text, h, inClass);
      }
      if (inClass) return;
      const property = propertyNameOf(node);
      if (property && RADIUS_PROPERTY_RE.test(property)) {
        checkRadiusScaleVar(node, text, 0, h);
        return;
      }
      for (const m of text.matchAll(RADIUS_DECL_TEXT_RE)) {
        checkRadiusScaleVar(node, m[1], m.index + m[0].length - m[1].length, h);
      }
    },
    checkStyle({ text: styleText, start }, h) {
      const text = maskCssComments(styleText);
      for (const decl of text.matchAll(STYLE_DECL_RE)) {
        if (!RADIUS_PROPERTY_RE.test(decl[1])) continue;
        checkRadiusScaleVar(null, decl[2], start + decl.index + decl[0].indexOf(decl[2]), h);
      }
    },
    checkCss(node, h) {
      const valueNode = node.value;
      if (valueNode?.type !== 'Value') return;
      const property = node.property?.name ?? node.property;
      if (!RADIUS_PROPERTY_RE.test(property)) return;
      checkRadiusScaleVar(null, h.sourceCode.getText(valueNode), valueNode.loc.start.offset, h);
    },
  }),
};
