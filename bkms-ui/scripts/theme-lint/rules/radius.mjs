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
 *   no-hardcoded-radius  写死圆角长度与形状值（rounded-[6px]、border-radius: 0、50%、999px）  warn
 *   prefer-radius-class  圆角必须走注册类：uno 内置刻度 / 尺度档 / 尺度档直连  warn
 *   no-stacked-radius    同一元素的多个圆角类压在同一角上（静态 class 与 :class 绑定都查）  error
 *
 * 与颜色最大的差别：同值一对多是常态（md 档有 base/field/control/card/overlay/tab/menu 七个语义档），
 * 所以只有「同值档位唯一且场景明确」才自动修，其余一律给候选由人挑场景；无场景词时 base 兜底。
 * 形状值（0 / 百分比 / ≥100px 胶囊 / rounded-full / rounded-none）只映射到 none / full 形状档，
 * 映射唯一所以可自动修；形状档不进语义候选池。
 */
import {
  isRadiusScaleVar,
  isRadiusSemanticVar,
  isRadiusShapeVar,
  nearestRadiusSemantics,
  radiusScaleVarPx,
  radiusSemantics,
} from '../map.mjs';
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
/** uno 内置形状类：换成项目注册的 rounded-bkms-none / rounded-bkms-full */
const SHAPE_BUILTIN = ['none', 'full'];
/**
 * 非 class 语境可判定为圆角类名的形态：任意值（rounded-[…]）与注册类（rounded-bkms-*），含方向。
 * 裸 rounded / rounded-lg 在 title、文案里是常见英文词，按类名判会误报。
 */
const RADIUS_LOOKS_LIKE_CLASS_RE = /^rounded(?:-(?:tl|tr|bl|br|t|r|b|l))?-(?:\[|bkms-)/;
/** 圆角属性名：kebab（border-radius / border-top-left-radius）与 camel（borderRadius）通吃 */
const RADIUS_PROPERTY_RE = /^border[-]?(?:top|bottom)?[-]?(?:left|right)?[-]?radius$/i;
/** 声明尾部的 !important：只替换值本体，标记保留 */
const IMPORTANT_RE = /\s*!important\s*$/i;
/** 内联 style / script 字符串里的圆角声明（属性名不一定能拿到，只能按文本扫） */
const RADIUS_DECL_TEXT_RE = /border-radius\s*:\s*([^;}"']+)/g;
/** 圆角类覆盖的角：整体与 t/r/b/l 会压到别的方向上，tl/tr/br/bl 只占单角 */
const RADIUS_CORNERS = {
  '': ['tl', 'tr', 'br', 'bl'],
  t: ['tl', 'tr'],
  r: ['tr', 'br'],
  b: ['br', 'bl'],
  l: ['tl', 'bl'],
  tl: ['tl'],
  tr: ['tr'],
  br: ['br'],
  bl: ['bl'],
};
/** 叠加判定放宽到 uno 内置刻度：叠加本身就违规，不必先要求它走注册类 */
const RADIUS_CLASS_TAIL_RE = /^(?:bkms-[\w-]+|\[[^\]]*\]|none|full|sm|md|lg|xl|2xl|3xl)$/;
/**
 * 场景词 → 语义档：只用于候选排序（6px 有七个同值档，base 为无场景归属时的兜底）。
 * 命不中不报错，由 radiusSemantics 把 base 排到最前。
 */
const RADIUS_HINTS = [
  [/popover|dropdown|tooltip|dialog|modal|overlay|notify|message/i, 'overlay'],
  [/menu|nav|sidebar/i, 'menu'],
  [/tab/i, 'tab'],
  [/tag|badge/i, 'tag'],
  [/input|field|textarea|search|select/i, 'field'],
  [/scroll|thumb/i, 'scroll'],
  [/btn|button|radio|switch|pagination|cascader|picker|upload|collapse/i, 'control'],
  [/card|panel|box|section|wrapper/i, 'card'],
];

/** class 里的圆角类名：内置刻度 / 档位类 / 档位任意值 / 未注册的 var 任意值 */
function checkRadiusClassName(node, className, start, text, h, fixable) {
  const radius = radiusClassOf(className);
  if (!radius) return;
  const { dir, tail } = radius;
  const hint = radiusHintOf(text);
  const classOf = t => radiusClassNameOf(dir, t.label);

  // rounded-[var(--bkms-radius-*)]：形状档合法，语义令牌只差注册类，尺度档只给候选
  if (tail?.startsWith('[') && tail.endsWith(']')) {
    const name = radiusArbitrary(tail.slice(1, -1)).match(/var\(\s*(--bkms-radius-[\w-]+)\s*\)/)?.[1];
    if (!name) return;
    if (isRadiusShapeVar(name)) return;
    if (isRadiusScaleVar(name)) {
      const { candidates } = radiusCandidates(radiusScaleVarPx(name), hint);
      h.report(node, start, className.length, {
        messageId: 'bannedStep',
        data: { value: name, targets: candidates.map(classOf).join(' / ') },
        suggest: fixable
          ? h.suggest(
              candidates,
              'suggestRadius',
              t => h.replace(start, className.length, classOf(t)),
              t => `${classOf(t)}（${t.px}px）`,
            )
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

  // 注册类（rounded-bkms-*）：语义档与形状档合法，尺度档只在迁移过渡期允许
  if (tail?.startsWith('bkms-')) {
    // 档位存在才算档位：uno 不会为不存在的档位生成类，报它既非事实也给不出候选
    const scale = `--bkms-radius-${tail.slice('bkms-'.length)}`;
    if (isRadiusShapeVar(scale)) return;
    const px = radiusScaleVarPx(scale);
    if (px === null) return;
    const { candidates } = radiusCandidates(px, hint);
    h.report(node, start, className.length, {
      messageId: 'bannedStep',
      data: { value: className, targets: candidates.map(classOf).join(' / ') },
      suggest: fixable
        ? h.suggest(
            candidates,
            'suggestRadius',
            t => h.replace(start, className.length, classOf(t)),
            t => `${classOf(t)}（${t.px}px）`,
          )
        : undefined,
    });
    return;
  }

  if (tail && SHAPE_BUILTIN.includes(tail)) {
    const target = radiusClassNameOf(dir, tail);
    h.report(node, start, className.length, {
      messageId: 'useBuiltinShape',
      data: { value: className, target },
      fix: fixable ? h.replace(start, className.length, target) : undefined,
    });
    return;
  }

  // 未注册的尾巴（rounded-foo）不是本规则的目标
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
    multiline: true,
    span: { start: valueNode.loc.start.offset + text.indexOf(raw), length: raw.length, fixable: true },
  });
}

/** 圆角声明里的尺度档直连（border-radius: var(--bkms-radius-md)）：尺度档只该被语义层引用 */
function checkRadiusScaleVar(node, text, start, h) {
  for (const m of text.matchAll(VAR_RE)) {
    if (isRadiusShapeVar(m[1])) continue;
    if (!isRadiusScaleVar(m[1])) continue;
    const px = radiusScaleVarPx(m[1]);
    const { candidates } = radiusCandidates(px);
    const at = start + m.index;
    h.report(node, at, m[0].length, {
      messageId: 'bannedVar',
      data: { value: m[1], targets: candidates.map(t => t.label).join(' / ') },
      suggest: h.suggest(
        candidates,
        'suggestRadius',
        t => h.replace(at, m[0].length, `var(${t.name})`),
        t => `var(${t.name})（${t.px}px）`,
      ),
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
      multiline: true,
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
function checkRadiusValue(node, raw, h, { mode, dir, hint, span, multiline }) {
  const value = raw.trim();
  const parts = value.split(/\s+/);
  // 多值简写一律报：令牌化后四角并列同样逐角跟改，语义归属也读不出来
  if (parts.length > 1) {
    const split = compoundSplit(value);
    h.report(node, span.start, span.length, {
      messageId: 'compound',
      data: { value },
      suggest: split ? compoundSuggestions(split, span, h, multiline) : undefined,
    });
    return;
  }
  const parsed = radiusValueOf(value);
  if (parsed.kind === 'zero' || parsed.kind === 'shape') {
    reportShapeValue(node, value, parsed.kind, h, { mode, dir, span });
    return;
  }
  if (parsed.kind !== 'px') return;
  reportRadiusValue(node, value, parsed.px, h, { mode, dir, hint, span });
}

/**
 * 同一 class / @apply 里的圆角类叠加：两个类的覆盖角有交集就报。
 * 带变体前缀（hover: / dark: / [&>*]:）的令牌跳过——它们作用于别的状态，不算叠加。
 */
function checkStackedRadius(node, text, base, h) {
  const list = [];
  const seen = new Set();
  // 裸 token 管静态 class 与字符串外的表达式；字符串字面量内部再扫一遍，
  // 否则 :class="['a', 'b']" 与 :class="{ 'a': ok }" 这两种主流写法整段漏检
  const candidates = [];
  for (const m of text.matchAll(/[^\s"'`]+/g)) candidates.push({ raw: m[0], start: m.index });
  for (const m of text.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) {
    const inner = m[1] ?? m[2] ?? m[3] ?? '';
    for (const t of inner.matchAll(/[^\s]+/g)) candidates.push({ raw: t[0], start: m.index + 1 + t.index });
  }
  for (const { raw, start } of candidates) {
    if (raw.includes(':')) continue;
    const name = raw.replace(/^!/, '');
    const radius = radiusClassOf(name);
    if (!radius) continue;
    if (radius.tail !== undefined && !RADIUS_CLASS_TAIL_RE.test(radius.tail)) continue;
    const tokenStart = base + start + raw.length - name.length;
    // 裸 token 与字符串扫描会命中同一个位置，按偏移去重
    if (seen.has(tokenStart)) continue;
    seen.add(tokenStart);
    list.push({ name, start: tokenStart, corners: RADIUS_CORNERS[radius.dir ?? ''] });
  }
  // 两轮扫描打乱了源码顺序，按偏移还原，建议里「删哪个」才符合阅读顺序
  list.sort((a, b) => a.start - b.start);
  for (let i = 1; i < list.length; i++) {
    // 同名类重复写不构成叠加：uno 对同一个类只生成一条规则，谁赢都一样
    const conflict = list
      .slice(0, i)
      .find(p => p.name !== list[i].name && p.corners.some(c => list[i].corners.includes(c)));
    if (!conflict) continue;
    // 留哪个由人定：整体档与方向档谁是错的取决于设计意图，两条建议各删一个
    // 删类名连带吃掉一侧空格，否则留下连续空格；@apply 后面的空格属于指令，只能往后吃
    const drop = target => {
      const end = target.start + target.name.length;
      const source = h.sourceCode.text;
      if (/\s/.test(source[end] ?? '')) return h.replace(target.start, target.name.length + 1, '');
      const stripBefore =
        /\s/.test(source[target.start - 1] ?? '') && !/@apply\s+$/.test(source.slice(0, target.start));
      return stripBefore
        ? h.replace(target.start - 1, target.name.length + 1, '')
        : h.replace(target.start, target.name.length, '');
    };
    h.report(node, list[i].start, list[i].name.length, {
      messageId: 'stacked',
      data: { value: list[i].name, conflict: conflict.name },
      suggest: [
        { messageId: 'dropLater', data: { value: list[i].name }, fix: drop(list[i]) },
        { messageId: 'dropEarlier', data: { value: conflict.name }, fix: drop(conflict) },
      ],
    });
  }
}

/** 多值简写里「两侧清零 + 两侧同语义」的拆分：只认 0 x x 0 / x 0 0 x 两种历史形态 */
function compoundSplit(value) {
  const parts = value.split(/\s+/);
  if (parts.length !== 4) return null;
  const isNone = p => ['0', '0px', 'none', 'var(--bkms-radius-none)'].includes(p.toLowerCase());
  const [tl, tr, br, bl] = parts;
  if (tl.toLowerCase() !== bl.toLowerCase() || tr.toLowerCase() !== br.toLowerCase()) return null;
  if (isNone(tl) && !isNone(tr)) {
    return { overall: tr, cleared: ['border-start-start-radius', 'border-end-start-radius'] };
  }
  if (isNone(tr) && !isNone(tl)) {
    return { overall: tl, cleared: ['border-start-end-radius', 'border-end-end-radius'] };
  }
  return null;
}

/**
 * 拆开建议 = 整体语义 + 单角清零。整体已是指令牌就直接用，px / 形状值走候选映射；
 * 尺度档直连与未知值不猜——猜错等于替人换语义。
 * CSS 语境按原声明缩进换行，内联 style / script 字符串里换行会破坏值，只能单行。
 */
function compoundSuggestions({ overall, cleared }, span, h, multiline) {
  const source = h.sourceCode.text;
  const decl = declarationSpanOf(source, span);
  if (!decl) return undefined;
  const suffix = /!important/i.test(source.slice(decl.start, decl.start + decl.length)) ? ' !important' : '';
  const lineIndent = source.slice(source.lastIndexOf('\n', decl.start - 1) + 1, decl.start).match(/^\s*/)?.[0];
  const joiner = multiline ? `;\n${lineIndent || '  '}` : '; ';
  const build = name =>
    [`border-radius: ${name}${suffix}`, ...cleared.map(p => `${p}: var(--bkms-radius-none)${suffix}`)].join(joiner);
  const one = target => [
    { messageId: 'suggestSplit', data: { target }, fix: h.replace(decl.start, decl.length, build(target)) },
  ];

  const varName = overall.match(/^var\(\s*(--bkms-radius-[\w-]+)\s*\)$/)?.[1];
  if (varName) {
    if (!isRadiusSemanticVar(varName) && !isRadiusShapeVar(varName)) return undefined;
    return one(overall);
  }
  const parsed = radiusValueOf(overall);
  if (parsed.kind === 'shape') return one('var(--bkms-radius-full)');
  if (parsed.kind !== 'px') return undefined;
  return h.suggest(
    radiusCandidates(parsed.px).candidates,
    'suggestSplit',
    t => h.replace(decl.start, decl.length, build(`var(${t.name})`)),
    t => `var(${t.name})`,
  );
}

/**
 * 值 span → 整条声明 span。拆开建议要换掉 `border-radius: <值> [!important]` 整条：
 * 只换值会把属性名留在前面、把 !important 留在末尾，应用后就是重复声明。
 * script 对象（borderRadius: '…'）的值外层是引号，扫不到「属性:」，返回 null 表示不给建议。
 */
function declarationSpanOf(source, span) {
  let start = span.start;
  while (start > 0 && /\s/.test(source[start - 1])) start -= 1;
  if (source[start - 1] !== ':') return null;
  start -= 1;
  while (start > 0 && /\s/.test(source[start - 1])) start -= 1;
  const nameEnd = start;
  while (start > 0 && /[\w-]/.test(source[start - 1])) start -= 1;
  if (start === nameEnd) return null;
  let end = span.start + span.length;
  const tail = /^\s*!important/i.exec(source.slice(end, end + 16));
  if (tail) end += tail[0].length;
  return { start, length: end - start };
}

/** 节点是否位于 :class 绑定表达式内——绑定层统一检查，字面量层跳过 */
function isInsideClassBinding(node) {
  let p = node.parent;
  while (p) {
    if (p.type === 'VExpressionContainer') return true;
    if (p.type === 'VAttribute' || p.type === 'VElement') return false;
    p = p.parent;
  }
  return false;
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

/** 圆角注册类名：rounded-bkms-{语义|形状}，方向保留；语义档与色阶 text-bkms-* 同形 */
function radiusClassNameOf(dir, label) {
  return `rounded-${dir ? `${dir}-` : ''}bkms-${label}`;
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
 * zero / shape 分别映射 none / full 形状档，不再直接放行。
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
  // 胶囊（>=100px）与 rounded-full 同源，统一由 full 形状档表达；20~99px 是大圆角方块，不自动改形状
  if (px >= 100) return { kind: 'shape' };
  return { kind: 'px', px };
}

/**
 * 写死圆角上报一处。mode 决定修复产物：class 落语义类（保留方向），CSS 落 var()。
 * 只有「同值语义档唯一且场景明确」才自动改——同值多个时语义由场景决定，替人选就是引入漂移。
 */
function reportRadiusValue(node, raw, px, h, { mode, dir, hint, span }) {
  const { candidates, exact } = radiusCandidates(px, hint);
  const targetOf = t => (mode === 'class' ? radiusClassNameOf(dir, t.label) : `var(${t.name})`);
  const unique = exact && candidates.length === 1;

  if (unique) {
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
      ? h.suggest(
          candidates,
          'suggestRadius',
          t => h.replace(span.start, span.length, targetOf(t)),
          t => `${targetOf(t)}（${t.px}px）`,
        )
      : undefined,
  });
}

/** 形状值只有 none / full 两个归宿，映射唯一所以直接自动修 */
function reportShapeValue(node, raw, kind, h, { mode, dir, span }) {
  const label = kind === 'zero' ? 'none' : 'full';
  const target = mode === 'class' ? radiusClassNameOf(dir, label) : `var(--bkms-radius-${label})`;
  h.report(node, span.start, span.length, {
    messageId: mode === 'class' ? 'useClassShape' : 'useVarShape',
    data: { value: raw, target },
    fix: span.fixable ? h.replace(span.start, span.length, target) : undefined,
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
        useClassShape: '写死圆角形状 {{value}}，改用注册类 {{target}}',
        useVarShape: '写死圆角形状 {{value}}，改用 {{target}}',
        compound: '圆角多值简写 {{value}}：整体语义写 border-radius，单角覆盖写 border-start/end-*-radius',
        suggestRadius: '改用 {{target}}（语义需自行确认）',
        suggestSplit: '拆成 {{target}} + 单角清零',
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
        bannedScale: '{{value}} 是 uno 内置圆角刻度（值随根字号浮动）：改用语义档 rounded-bkms-<场景>',
        bannedStep: '{{value}} 是圆角档位：档位只该被语义层引用，改用语义档 {{targets}}',
        bannedVar: '圆角值直接引用档位 {{value}}：改用语义档 var()（{{targets}}）',
        unregistered: '禁止圆角 var() 任意值（{{value}}）：改用语义类 {{target}}',
        unknownSemantic:
          '未知圆角语义档 {{value}}：令牌里没有它，先新增令牌（src/styles/theme/tokens/radius.css）或改用现有语义档',
        useBuiltinShape: '{{value}} 是 uno 内置形状类：改用项目注册类 {{target}}',
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

  'no-stacked-radius': createThemeRule({
    meta: {
      type: 'problem',
      docs: { description: '同一元素的多个圆角类不能压在同一角上' },
      hasSuggestions: true,
      schema: [],
      messages: {
        stacked: '圆角类叠加：{{value}} 与 {{conflict}} 压在同一角上，uno 生成顺序不可控，只留一个来源',
        dropLater: '删掉 {{value}}',
        dropEarlier: '删掉 {{value}}',
      },
    },
    check(node, text, h) {
      if (!isClassContext(node)) return;
      // :class 绑定里的字面量交给 checkBinding 整段处理：逐条检查既看不到跨项叠加，又会重复报
      if (isInsideClassBinding(node)) return;
      checkStackedRadius(node, text, h.baseOf(node, text), h);
    },
    checkBinding(node, text, h) {
      checkStackedRadius(node, text, h.baseOf(node, text), h);
    },
    checkStyle({ text: styleText, start }, h) {
      const text = maskCssComments(styleText);
      for (const m of text.matchAll(/@apply\s+([^;]+);/g)) {
        checkStackedRadius(null, m[1], start + m.index + m[0].indexOf(m[1]), h);
      }
    },
  }),
};
