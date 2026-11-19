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
 * theme-lint 单测：令牌映射（map.mjs）+ 六条 eslint 规则（plugin.mjs → rules/*.mjs）。
 *
 * 这是仓库工具自身的测试，不属于业务单测：用例统一放 scripts/test/，由 pnpm test:scripts 统一跑
 * （同目录的 vitest.config.mts），不进 test:unit / test:ci，GitHub 的单元测试流水线不感知它。
 *
 * map.mjs 在加载时读取 src/styles/theme/tokens 下的真实令牌，用例数据直接取自令牌文件
 * （hexOfVar / parseScaleColors）；结构性断言不抄色值，仅少量规范锚点（neutral-1 / brand-2 等）
 * 显式锁定具体色值，用于防令牌被误改。
 */

import css from '@eslint/css';
import tsParser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import vueParser from 'vue-eslint-parser';

import {
  COLOR_KINDS,
  hexOfVar,
  isRadiusScaleVar,
  isRadiusShapeVar,
  isShadowVar,
  isThemeVar,
  layerOfClass,
  layerOfVar,
  nearestClasses,
  nearestRadiusSemantics,
  nearestVars,
  normalizeHex,
  parseRadiusScaleTokens,
  parseScaleColors,
  parseSemanticShortcuts,
  radiusScaleVarPx,
  radiusSemantics,
  suggestClass,
  suggestShadowVar,
  suggestVar,
} from '../theme-lint/map.mjs';
import themePlugin, { THEME_VAR_PREFIXES } from '../theme-lint/plugin.mjs';

const RULES = {
  'theme/no-hardcoded-color': 'error',
  'theme/no-default-palette': 'error',
  'theme/prefer-uno-class': 'error',
  'theme/no-foreign-var': 'error',
  'theme/no-hardcoded-radius': 'error',
  'theme/prefer-radius-class': 'error',
  'theme/no-stacked-radius': 'error',
};

const configFor = {
  vue: [
    {
      files: ['**/*.vue'],
      plugins: { theme: themePlugin },
      languageOptions: {
        parser: vueParser,
        parserOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
      },
      rules: RULES,
    },
  ],
  ts: [
    {
      files: ['**/*.ts'],
      plugins: { theme: themePlugin },
      languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module' },
      rules: RULES,
    },
  ],
  css: [
    {
      files: ['**/*.css'],
      // @eslint/css 提供的非 JS language，Declaration 节点才有 value.property
      language: 'css/css',
      plugins: { css, theme: themePlugin },
      rules: RULES,
    },
  ],
};

const linter = new Linter();

/** 建议项的 fix 已被 Linter 展开成 { range, text }，直接按区间拼回源码 */
function applySuggestion(code, suggestion) {
  const { range, text } = suggestion.fix;
  return code.slice(0, range[0]) + text + code.slice(range[1]);
}

function fix(code, target = 'vue') {
  return linter.verifyAndFix(code, configFor[target], { filename: `demo.${target}` });
}

function verify(code, target = 'vue') {
  return linter.verify(code, configFor[target], { filename: `demo.${target}` });
}

/** 单条规则的报错（多规则同时命中时便于定位） */
function verifyRule(code, ruleId, target = 'vue') {
  return verify(code, target).filter(m => m.ruleId === ruleId);
}

const WHITE = hexOfVar('--bkms-text-inverse'); // 语义层里唯一指向 neutral-10 的文字色
const TITLE = hexOfVar('--bkms-text-title');
const CARD = hexOfVar('--bkms-bg-card');
const LINE = hexOfVar('--bkms-line-default');
const BRAND = hexOfVar('--bkms-brand-2');

describe('map.normalizeHex', () => {
  it('3 位补全为 6 位、4 位补全为 8 位', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
    expect(normalizeHex('#abcd')).toBe('#aabbccdd');
  });

  it('6 / 8 位原样返回并统一小写、去空格', () => {
    expect(normalizeHex(' #3B6EF5 ')).toBe('#3b6ef5');
    expect(normalizeHex('#0003')).toBe('#00000033');
  });

  it('非 hex / 长度非法 / 非字符串一律 null', () => {
    for (const bad of ['#ab', '#1234567', '#123456789', 'red', '', null, undefined, 123]) {
      expect(normalizeHex(bad)).toBeNull();
    }
  });

  it('#rrggbbff 折叠为 6 位，与 rgba(…, 1) 的归一形态一致', () => {
    expect(normalizeHex('#000000ff')).toBe('#000000');
    expect(normalizeHex('#000000FF')).toBe('#000000');
    expect(normalizeHex('rgba(0, 0, 0, 1)')).toBe('#000000');
    // 半透明仍保留 8 位，不能一起折叠
    expect(normalizeHex('#00000080')).toBe('#00000080');
  });

  it('4 位简写展开后同样做 ff 折叠', () => {
    expect(normalizeHex('#ffff')).toBe('#ffffff');
    expect(normalizeHex('#123f')).toBe('#112233');
    expect(normalizeHex('rgba(17, 34, 51, 1)')).toBe('#112233');
    // 简写里带半透明则保留 8 位
    expect(normalizeHex('#1234')).toBe('#11223344');
  });

  it('rgb()/rgba() 归一为 hex，alpha 保留为 8 位', () => {
    expect(normalizeHex('rgb(17, 18, 20)')).toBe('#111214');
    expect(normalizeHex('rgb(59 110 245 / 50%)')).toBe('#3b6ef580');
    expect(normalizeHex('rgba(0, 0, 0, 0.5)')).toBe('#00000080');
    expect(normalizeHex('rgb(100% 0% 0%)')).toBe('#ff0000');
  });

  it('rgb() 写法不完整 / 非颜色函数仍返回 null', () => {
    for (const bad of ['rgb(1,2)', 'rgb(a,b,c)', 'hsl(220 100% 50%)', 'rgba()']) {
      expect(normalizeHex(bad)).toBeNull();
    }
  });
});

describe('map 令牌解析', () => {
  it('色阶注册表的 key 与 var() 一一对应', () => {
    const scale = parseScaleColors();
    const names = Object.keys(scale);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/^bkms-[a-z0-9-]+$/);
      expect(scale[name]).toBe(`var(--${name})`);
    }
    // 场景色与数字色阶同形注册，消费 text-bkms-text-warning-alt 这类类名
    expect(scale['bkms-warning-alt']).toBe('var(--bkms-warning-alt)');
  });

  it('语义快捷类：line 组映射到 border-[var(...)]，text / bg 各自对齐', () => {
    const shortcuts = parseSemanticShortcuts();
    expect(shortcuts.length).toBeGreaterThan(0);
    const prefixByGroup = { text: 'text', line: 'border', bg: 'bg' };
    for (const [shortcut, utility] of shortcuts) {
      const group = shortcut.split('-')[1];
      expect(utility).toBe(`${prefixByGroup[group]}-[var(--${shortcut})]`);
    }
    // 方向边框要靠色阶类保留方向，因此语义 shortcut 只到通用 border-[...]
    expect(shortcuts).toContainEqual(['bkms-line-default', 'border-[var(--bkms-line-default)]']);
  });

  it('hexOfVar 顺着 var() 引用链解析到 hex', () => {
    expect(WHITE).toBe('#ffffff');
    expect(TITLE).toBe('#111214');
    expect(hexOfVar('--bkms-brand-2')).toBe('#3b6ef5');
  });

  it('hexOfVar 对未知令牌 / 非 --bkms-* / color-mix 返回 null', () => {
    expect(hexOfVar('--bkms-not-exist')).toBeNull();
    expect(hexOfVar('--foo')).toBeNull();
    expect(hexOfVar('--bkms-shadow-button')).toBeNull(); // color-mix 无法归一为单值
  });

  it('viz 字典只进 resolveHex，不进建议池', () => {
    expect(isThemeVar('--bkms-viz-line')).toBe(true);
    expect(THEME_VAR_PREFIXES).toContain('--bkms-viz-');
    expect(hexOfVar('--bkms-viz-bg-card')).toBe('#ffffff');
    expect(hexOfVar('--bkms-viz-series-3')).toBe('#3a84ff');
    for (const value of ['#ffffff', '#3a84ff', '#abb5cc']) {
      expect(nearestVars(value, {}, 3).some(v => v.includes('viz-'))).toBe(false);
    }
  });

  it('isThemeVar / isShadowVar 区分令牌族', () => {
    expect(isThemeVar('--bkms-brand-2')).toBe(true);
    expect(isThemeVar('--foo')).toBe(false);
    expect(isShadowVar('--bkms-shadow-card')).toBe(true);
    expect(isShadowVar('--bkms-brand-2')).toBe(false);
  });
});

describe('map.suggest', () => {
  it('每个色阶令牌都能落到某个注册类上（语义优先或色阶兜底）', () => {
    for (const name of Object.keys(parseScaleColors())) {
      const hex = hexOfVar(`--${name}`);
      expect(hex).not.toBeNull();
      const cls = suggestClass(hex, 'bg');
      expect(cls).toEqual(expect.any(String));
      expect(cls).toMatch(/^(bkms-bg-[a-z0-9-]+|bg-bkms-[a-z0-9-]+)$/);
    }
  });

  it('语义优先：同值语义类压过色阶类', () => {
    expect(suggestClass(WHITE, 'text')).toBe('bkms-text-inverse');
    expect(suggestClass(CARD, 'bg')).toBe('bkms-bg-card');
  });

  it('方向边框退化为色阶类，避免压平成通用 border-color', () => {
    expect(suggestClass(LINE, 'border')).toBe('bkms-line-default');
    expect(suggestClass(LINE, 'border', { dir: 't' })).toMatch(/^border-t-bkms-[a-z-]+-\d+$/);
  });

  it('shadow 不是 uno 注册类，返回 null', () => {
    expect(suggestClass(WHITE, 'shadow')).toBeNull();
  });

  it('非法 kind / 非法色值返回 null', () => {
    expect(suggestClass('#ffffff', 'nope')).toBeNull();
    expect(suggestClass('not-a-color', 'text')).toBeNull();
  });

  it('suggestShadowVar 给出阴影令牌 var()', () => {
    expect(suggestShadowVar(hexOfVar('--bkms-shadow-card'))).toBe('var(--bkms-shadow-card)');
    expect(suggestShadowVar(WHITE)).toBeNull();
  });

  it('suggestVar 按属性组优先，无提示时给色阶', () => {
    expect(suggestVar(WHITE, { group: 'text' })).toBe('var(--bkms-text-inverse)');
    expect(suggestVar(CARD, { group: 'bg' })).toBe('var(--bkms-bg-card)');
    // 组内无同值语义色时不跨组猜语义，直接落色阶
    expect(suggestVar(BRAND, { group: 'bg' })).toBe('var(--bkms-brand-2)');
    expect(suggestVar(TITLE)).toBe('var(--bkms-neutral-1)');
    expect(suggestVar('#010203')).toBeNull();
  });

  it('nearest* 受 limit 与色差上限约束', () => {
    const classes = nearestClasses(BRAND, 'text', {}, 2);
    expect(classes.length).toBeLessThanOrEqual(2);
    for (const cls of classes) expect(cls).toMatch(/^(bkms-text-|text-)/);

    const vars = nearestVars(TITLE, {}, 2);
    expect(vars.length).toBeLessThanOrEqual(2);
    for (const v of vars) expect(v).toMatch(/^var\(--bkms-[\w-]+\)$/);

    // 距离上限：极端绿色离令牌层太远，不给候选，避免误导
    expect(nearestClasses('#00ff00', 'bg')).toEqual([]);
  });

  it('COLOR_KINDS 覆盖 uno 颜色工具类且不含未知项', () => {
    for (const kind of ['text', 'bg', 'border', 'fill', 'stroke', 'ring', 'divide', 'outline']) {
      expect(COLOR_KINDS).toContain(kind);
    }
  });
});

describe('map 令牌层判定', () => {
  // 多段 family（nav-indicator）必须也判成色阶：外部另写 [a-z]+ 正则会把它漏成"未知层"
  it('多段 family 的色阶令牌判为 scale', () => {
    expect(layerOfVar('--bkms-nav-indicator-1')).toBe('scale');
    expect(layerOfClass('text-bkms-nav-indicator-1')).toBe('scale');
  });

  it('语义令牌与语义类判为 semantic，色阶类判为 scale', () => {
    expect(layerOfVar('--bkms-bg-card')).toBe('semantic');
    expect(layerOfClass('bkms-bg-card')).toBe('semantic');
    expect(layerOfClass('border-t-bkms-warning-3')).toBe('scale');
  });

  it('未定义的令牌 / 非 bkms 类返回 null', () => {
    expect(layerOfVar('--bkms-not-exist')).toBeNull();
    expect(layerOfClass('text-red-500')).toBeNull();
  });
});

describe('rule: no-hardcoded-color', () => {
  it('template 静态 class 里的任意值色值 → 注册类', () => {
    const [msg] = verifyRule(`<template><div class="text-[${WHITE}]" /></template>`, 'theme/no-hardcoded-color');
    expect(msg.message).toBe(`写死色值 ${WHITE}，改用 uno 注册类 bkms-text-inverse`);
    expect(msg.line).toBe(1);
  });

  it('修复后直接换成注册类', () => {
    const { output } = fix(`<template><div class="bg-[${CARD}]" /></template>`);
    expect(output).toBe(`<template><div class="bkms-bg-card" /></template>`);
  });

  it('<style> 块修复：偏移落在第二条声明上，blockStart + 声明内偏移不串位', () => {
    const code = `<template><div /></template>\n<style>\n.a { margin: 0; color: ${WHITE}; }\n</style>`;
    const { output } = fix(code);
    expect(output).toBe(code.replace(WHITE, 'var(--bkms-text-inverse)'));
  });

  it('独立 .css 修复：Declaration 的 loc.offset 与 fix range 一致', () => {
    const code = `.a { margin: 0; color: ${WHITE}; }`;
    const { output } = fix(code, 'css');
    expect(output).toBe(code.replace(WHITE, 'var(--bkms-text-inverse)'));
  });

  it(':class 绑定表达式同样命中，方向边框保留方向', () => {
    const [msg] = verifyRule(`<template><div :class="'border-t-[${LINE}]'" /></template>`, 'theme/no-hardcoded-color');
    expect(msg.message).toMatch(/^写死色值 #\w+，改用 uno 注册类 border-t-bkms-/);
  });

  it('内联 style 属性不解析属性名，按色阶兜底给 var()', () => {
    const [msg] = verifyRule(`<template><div style="color: ${TITLE}" /></template>`, 'theme/no-hardcoded-color');
    expect(msg.message).toBe(`写死色值 ${TITLE}，改用 var(--bkms-neutral-1)`);
  });

  it('script 里的样式对象按属性名给语义 var()', () => {
    const [msg] = verifyRule(`const style = { color: '${TITLE}' };`, 'theme/no-hardcoded-color', 'ts');
    expect(msg.message).toBe(`写死色值 ${TITLE}，改用 var(--bkms-text-title)`);
  });

  it('<style> 块按声明切分，注释与 url(#id) 不误报', () => {
    const code = `<template><div /></template>
<style scoped>
/* 这里写 #fff 不算 */
.a { color: ${WHITE}; }
.b { fill: url(#icon); }
</style>`;
    const messages = verifyRule(code, 'theme/no-hardcoded-color');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe(`写死色值 ${WHITE}，改用 var(--bkms-text-inverse)`);
  });

  // CSS 没有 `//` 行注释，url(//cdn/x.png) 是协议相对地址。旧的「`//` 之前不是冒号就当注释」守卫
  // 挡不住它（前一个字符是 `(`），会把同一行后面的声明整段吞掉
  it('协议相对地址 url(//…) 不吞掉后续声明', () => {
    const code = `<template><div /></template>
<style>
.a { background: url(//cdn.example.com/x.png); color: ${TITLE}; }
</style>`;
    const messages = verifyRule(code, 'theme/no-hardcoded-color');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe(`写死色值 ${TITLE}，改用 var(--bkms-text-title)`);
  });

  it('协议相对地址后面的 var() 同样被扫到', () => {
    const code = `<template><div /></template>
<style>
.a { background: url(//cdn.example.com/x.png); color: var(--primary-color); }
</style>`;
    const [msg] = verifyRule(code, 'theme/no-foreign-var');
    expect(msg.message).toBe('var(--primary-color) 不在白名单：只放行 --bkms-*（及同文件内定义的局部变量）');
  });

  it('独立 .css 文件走 css language 的 Declaration', () => {
    const [msg] = verifyRule(`.a { color: ${TITLE}; }`, 'theme/no-hardcoded-color', 'css');
    expect(msg.message).toBe(`写死色值 ${TITLE}，改用 var(--bkms-text-title)`);
  });

  it('无颜色语境的 3 位 hex（编号）不报，6 位仍报', () => {
    expect(verifyRule(`const id = '#101';`, 'theme/no-hardcoded-color', 'ts')).toEqual([]);
    const [msg] = verifyRule(`const color = '#101010';`, 'theme/no-hardcoded-color', 'ts');
    expect(msg.messageId).toBe('useVarUnknown');
    expect(msg.suggestions?.length).toBeGreaterThan(0);
  });

  // hsl 未做颜色空间转换：只报不导，空 suggest 会被 ESLint 归一成 undefined。
  // 用一条用例钉住这个已知缺口，避免被反复当成 bug 提。
  it('hsl() 只报不导', () => {
    const [msg] = verifyRule(
      `<template><div style="color: hsl(220 100% 50%)" /></template>`,
      'theme/no-hardcoded-color',
    );
    expect(msg.messageId).toBe('useVarUnknown');
    expect(msg.suggestions).toBeUndefined();
    expect(msg.fix).toBeUndefined();
  });

  it('令牌层无同值色值时给相近候选而非自动修复', () => {
    const [msg] = verifyRule(`<template><div class="text-[#01020399]" /></template>`, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('useClassUnknown');
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions?.length).toBeGreaterThan(0);
  });

  // 候选只给类名时看不出是哪个颜色，灯泡里跟着带上候选自己的 hex
  it('灯泡候选带上具体 hex', () => {
    const [msg] = verifyRule(`<template><div class="bg-[#010203]" /></template>`, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('useClassUnknown');
    for (const s of msg.suggestions) expect(s.data.target).toMatch(/（#[0-9a-f]{6}）$/);

    const [varMsg] = verifyRule(`<template><div style="color: #010203" /></template>`, 'theme/no-hardcoded-color');
    expect(varMsg.messageId).toBe('useVarUnknown');
    for (const s of varMsg.suggestions) expect(s.data.target).toMatch(/^var\(--bkms-.+\)（#[0-9a-f]{6}）$/);
  });

  it('rgb() 归一为 hex 后能命中同值令牌', () => {
    const [msg] = verifyRule(`<template><div style="color: rgb(17, 18, 20)" /></template>`, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('useVar');
    expect(msg.message).toBe('写死色值 rgb(17, 18, 20)，改用 var(--bkms-neutral-1)');
  });

  it('带 alpha 的 rgb() 归一为 8 位 hex，无同值令牌时给候选', () => {
    const [msg] = verifyRule(
      `<template><div style="color: rgba(0, 0, 0, 0.5)" /></template>`,
      'theme/no-hardcoded-color',
    );
    expect(msg.messageId).toBe('useVarUnknown');
    expect(msg.suggestions?.length).toBeGreaterThan(0);
  });

  it('ring-offset 的色值只报不修，避免外发光环被改成实心环', () => {
    const code = `<template><div class="ring-offset-[${BRAND}]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('unregistered');
    expect(msg.message).toBe(`写死色值 ${BRAND}，ring-offset 未注册 uno 类：先补注册再改（不自动修复，避免语义被改）`);
    expect(msg.fix).toBeUndefined();
    expect(fix(code).output).toBe(code);
  });

  it('阴影色值走 shadow-[…] 例外提示', () => {
    const shadow = hexOfVar('--bkms-shadow-card');
    const [msg] = verifyRule(
      `<template><div class="shadow-[0_0_8px_${shadow}]" /></template>`,
      'theme/no-hardcoded-color',
    );
    expect(msg.message).toBe(
      `写死色值 ${shadow}，改用 shadow-[…var(--bkms-shadow-card)]（uno 未注册阴影类，class 内 var() 属例外）`,
    );
  });

  it('drop-shadow 同属阴影例外，不能因为前缀带连字符被静默放过', () => {
    const [msg] = verifyRule(
      `<template><div class="drop-shadow-[2px_0_2px_rgba(0,0,0,0.06)]" /></template>`,
      'theme/no-hardcoded-color',
    );
    expect(msg.message).toBe(
      '写死色值 rgba(0,0,0,0.06)，改用 drop-shadow-[…var(--bkms-shadow-*)]（uno 未注册阴影类，class 内 var() 属例外）',
    );
  });

  // 复合值（渐变 / 函数参数 / 简写）整体替换成单色注册类会连其余内容一起抹掉
  it.each([
    ['渐变', `bg-[linear-gradient(to_right,${BRAND},${WHITE})]`],
    ['函数参数', `bg-[radial-gradient(circle,${BRAND},transparent)]`],
    ['var() 带回退', `bg-[var(--Neutral-11,${WHITE})]`],
    // 单个色值 + 非函数残留也是复合值：border-bkms-* 只带颜色，1px solid 会被 --fix 吃掉
    ['边框简写', `border-[1px_solid_${WHITE}]`],
    ['方向边框简写', `border-t-[2px_dashed_${LINE}]`],
  ])('%s 复合任意值只报不修', (_label, cls) => {
    const code = `<template><div class="${cls}" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('compound');
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions).toBeUndefined();
    expect(fix(code).output).toBe(code);
  });

  // 反向断言：单色任意值仍然必须可修，否则上面那条「简写不修」会被过度收紧掩盖掉
  it('单色任意值仍可自动修（简写判定不误伤）', () => {
    const code = `<template><div class="border-[${LINE}]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('useClass');
    expect(fix(code).output).not.toBe(code);
  });

  // uno 用 `_` 转义空格，判定前必须还原，否则 `#3b6ef5_0%` 里 \b 不成立会整条漏报
  it('下划线分隔的渐变同样认作复合值', () => {
    const code = `<template><div class="bg-[linear-gradient(90deg,${BRAND}_0%,${WHITE}_100%)]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('compound');
    expect(fix(code).output).toBe(code);
  });

  it('复合值报错定位落在类名片段上，不漂到文件末尾', () => {
    const code = `<template>\n  <div class="bg-[linear-gradient(to_right,${BRAND},${WHITE})]" />\n</template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.line).toBe(2);
    expect(msg.column).toBe(code.split('\n')[1].indexOf('bg-[') + 1);
  });

  // 非 class 语境（普通字符串 / 文案 / 选择器数据）只提示不改，否则 --fix 会改掉非样式语义
  it.each([
    ['普通字符串', `const cls = 'bg-[${CARD}]';`, 'ts'],
    ['带 alpha', `const cls = 'bg-[${CARD}]/50';`, 'ts'],
  ])('%s 非 class 语境不给 autofix', (_label, code, target) => {
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color', target);
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions).toBeUndefined();
    expect(fix(code, target).output).toBe(code);
  });

  it('同一写法在 class 语境仍可修（语境判定不误伤）', () => {
    expect(fix(`<template><div class="bg-[${CARD}]" /></template>`).output).toBe(
      `<template><div class="bkms-bg-card" /></template>`,
    );
  });

  it('单色 rgb() 任意值仍可整体替换（复合判定不误伤）', () => {
    const { output } = fix(`<template><div class="bg-[rgba(255,255,255,1)]" /></template>`);
    expect(output).toBe(`<template><div class="bkms-bg-card" /></template>`);
  });

  // 注册类的 /alpha 会被 uno 静默丢弃（50% 变 100%），只能落 color-mix
  it.each([
    [`bg-[${CARD}]/50`, 'bg-[color-mix(in_srgb,var(--bkms-bg-card)_50%,transparent)]'],
    [`bg-[${CARD}]/[0.5]`, 'bg-[color-mix(in_srgb,var(--bkms-bg-card)_50%,transparent)]'],
  ])('%s 带 alpha → color-mix 保留半透明', (cls, expected) => {
    const code = `<template><div class="${cls}" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('alpha');
    expect(msg.fix).toBeDefined();
    expect(fix(code).output).toBe(`<template><div class="${expected}" /></template>`);
  });

  // 语义类目标名会随语义层变化（brand-2 → line-active 之类），这里只钉住"没有退化成注册类"
  it('border 带 alpha：产出 color-mix 而不是丢掉 alpha 的注册类', () => {
    const { output } = fix(`<template><div class="border-[${BRAND}]/30" /></template>`);
    expect(output).toContain('color-mix(in_srgb,var(--bkms-');
    expect(output).toContain('_30%,transparent)');
    expect(output).not.toContain('class="border-bkms-');
  });

  it('带 alpha 但无同值令牌时只报不修', () => {
    const code = `<template><div class="bg-[#010203]/50" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('alpha');
    expect(msg.fix).toBeUndefined();
    expect(fix(code).output).toBe(code);
  });

  it('alpha 越界（/150）只报不修，不拼出 150% 的 color-mix', () => {
    const code = `<template><div class="bg-[${CARD}]/150" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('alpha');
    expect(msg.fix).toBeUndefined();
    expect(fix(code).output).toBe(code);
  });

  // divide-x / divide-y 只定义宽度，颜色只有不带方向的 divide-<color>：
  // 压平会把横向分隔线变成四向，方向和语义一起被改
  it.each(['divide-x', 'divide-y'])('%s 任意值只报不修', direction => {
    const code = `<template><div class="${direction}-[${LINE}]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-color');
    expect(msg.messageId).toBe('unregistered');
    expect(msg.message).toBe(`写死色值 ${LINE}，${direction} 未注册 uno 类：先补注册再改（不自动修复，避免语义被改）`);
    expect(fix(code).output).toBe(code);
  });

  it('不带方向的 divide 仍可替换（方向词不误伤）', () => {
    const { output } = fix(`<template><div class="divide-[${LINE}]" /></template>`);
    expect(output).toMatch(/^<template><div class="divide-bkms-[a-z-]+-\d+" \/><\/template>$/);
  });
});

describe('rule: no-default-palette', () => {
  it.each(['text-red-500', 'bg-blue-50', 'border-gray-900', 'shadow-red-500'])('%s 被判定为默认调色板', cls => {
    const messages = verifyRule(`<template><div class="${cls}" /></template>`, 'theme/no-default-palette');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain(cls);
  });

  it.each(['border-t-gray-900', 'border-x-red-500', 'divide-y-blue-50', 'ring-offset-slate-100'])(
    '方向修饰的 %s 也判',
    cls => {
      const messages = verifyRule(`<template><div class="${cls}" /></template>`, 'theme/no-default-palette');
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain(cls);
    },
  );

  // 方向词只认 border / divide 的合法方向，注册类与残缺写法不误伤
  it.each(['border-t-bkms-neutral-5', 'text-bkms-brand-2', 'border-red-5000', 'divide-z-red-500'])('%s 不命中', cls => {
    expect(verifyRule(`<template><div class="${cls}" /></template>`, 'theme/no-default-palette')).toEqual([]);
  });

  it('注册类与近似字符不命中', () => {
    const code = `<template><div class="text-bkms-brand-2 bg-bkms-neutral-1 text-red-5000" /></template>`;
    expect(verifyRule(code, 'theme/no-default-palette')).toEqual([]);
  });

  it('非 class 语境不判（如文案）', () => {
    expect(verifyRule(`<template><span>text-red-500</span></template>`, 'theme/no-default-palette')).toEqual([]);
  });

  it('报错定位落在命中类名上，不是整个字符串', () => {
    const code = `<template><div class="p-2 text-red-500" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-default-palette');
    expect(msg.column).toBe(code.indexOf('text-red-500') + 1);
  });
});

describe('rule: prefer-uno-class', () => {
  // 色阶 token → 语义类：值相同但层不同，语义层分叉后就会改错，因此只给候选不自动修
  it('跨令牌层只给候选，不自动修', () => {
    const code = `<template><div :class="'text-[var(--bkms-brand-2)]'" /></template>`;
    const [msg] = verifyRule(code, 'theme/prefer-uno-class');
    expect(msg.messageId).toBe('crossLayer');
    expect(msg.message).toBe(
      'class 内禁止 var() 任意值（--bkms-brand-2）：bkms-text-brand 与源令牌不同层，值相同但语义会分叉，确认后再改',
    );
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions).toHaveLength(1);
    expect(fix(code).output).toBe(code);
  });

  // 与 no-hardcoded-color 同源：直接把任意值换成注册类，/50 会被 uno 静默丢弃
  it('带 /alpha 时用源令牌拼 color-mix，不丢半透明', () => {
    const code = `<template><div class="bg-[var(--bkms-brand-2)]/50" /></template>`;
    const [msg] = verifyRule(code, 'theme/prefer-uno-class');
    expect(msg.messageId).toBe('alpha');
    expect(fix(code).output).toBe(
      `<template><div class="bg-[color-mix(in_srgb,var(--bkms-brand-2)_50%,transparent)]" /></template>`,
    );
  });

  // 跨层 + alpha 也走 color-mix：换成注册类会留下孤立的 `/50`，等于又丢一次 alpha
  it('跨层且带 alpha 时用源令牌拼 color-mix，不换层也不丢 alpha', () => {
    const code = `<template><div :class="'text-[var(--bkms-brand-2)]/50'" /></template>`;
    const [msg] = verifyRule(code, 'theme/prefer-uno-class');
    expect(msg.messageId).toBe('alpha');
    expect(fix(code).output).toBe(
      `<template><div :class="'text-[color-mix(in_srgb,var(--bkms-brand-2)_50%,transparent)]'" /></template>`,
    );
  });

  it('同层仍可自动修（语义 token → 语义类）', () => {
    const code = `<template><div :class="'text-[var(--bkms-text-title)]'" /></template>`;
    const [msg] = verifyRule(code, 'theme/prefer-uno-class');
    expect(msg.messageId).toBe('banned');
    expect(msg.fix).toBeDefined();
    expect(fix(code).output).toBe(`<template><div :class="'bkms-text-title'" /></template>`);
  });

  it('阴影 var() 与 color-mix 是合法例外', () => {
    const code = `<template><div class="shadow-[0_0_8px_var(--bkms-shadow-card)] bg-[color-mix(in_srgb,var(--bkms-brand-2)_20%,transparent)]" /></template>`;
    expect(verifyRule(code, 'theme/prefer-uno-class')).toEqual([]);
  });

  it('非 --bkms-* 的 var() 不归本规则管', () => {
    expect(verifyRule(`<template><div :class="'text-[var(--foo)]'" /></template>`, 'theme/prefer-uno-class')).toEqual(
      [],
    );
  });

  it('style 块里的 var() 任意值不在 class 语境，不报', () => {
    const code = `<template><div /></template>\n<style>\n.a { color: var(--bkms-brand-2); }\n</style>`;
    expect(verifyRule(code, 'theme/prefer-uno-class')).toEqual([]);
  });

  it('ring-offset 内的 var() 任意值不自动修复，且文案指向工具类而非令牌', () => {
    const [msg] = verifyRule(
      `<template><div class="ring-offset-[var(--bkms-brand-2)]" /></template>`,
      'theme/prefer-uno-class',
    );
    expect(msg.messageId).toBe('unregistered');
    expect(msg.message).toBe('class 内禁止 var() 任意值（--bkms-brand-2）：ring-offset 工具类未注册 uno 类，先补注册');
    expect(msg.fix).toBeUndefined();
  });
});

describe('rule: no-foreign-var', () => {
  it('非白名单 var() 报警', () => {
    const [msg] = verifyRule(`const s = 'color: var(--foo)';`, 'theme/no-foreign-var', 'ts');
    expect(msg.message).toContain('var(--foo)');
  });

  it('报错定位落在 var() 片段上，不是整个字符串', () => {
    const code = `const s = 'color: var(--foo)';`;
    const [msg] = verifyRule(code, 'theme/no-foreign-var', 'ts');
    expect(msg.column).toBe(code.indexOf('var(--foo') + 1);
  });

  it('--bkms-* 与同文件局部变量放行', () => {
    const code = `
:root { --local-gap: 4px; }
const a = 'color: var(--bkms-brand-2)';
const b = 'padding: var(--local-gap)';
`;
    expect(verifyRule(code, 'theme/no-foreign-var', 'ts')).toEqual([]);
  });

  it('template 静态属性里的外来 var() 也报', () => {
    const messages = verifyRule(`<template><div style="color: var(--foreign)" /></template>`, 'theme/no-foreign-var');
    expect(messages).toHaveLength(1);
  });

  // <style> 块内容不是 Literal（是 VText），只能从 documentFragment 取文本扫，
  // 否则规则名义上"覆盖 style 块"实际一条都不会报
  it('<style> 块里的外来 var() 也报', () => {
    const code = `<template><div /></template>\n<style>\n.a { color: var(--Neutral-11); }\n</style>`;
    const messages = verifyRule(code, 'theme/no-foreign-var');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('var(--Neutral-11)');
  });

  it('<style> 块里注释掉的 var() 不报', () => {
    const code = `<template><div /></template>\n<style>\n/* color: var(--Neutral-11) */\n.a { color: var(--bkms-text-title); }\n</style>`;
    expect(verifyRule(code, 'theme/no-foreign-var')).toEqual([]);
  });

  it('<style> 块内同文件定义的局部变量放行（含嵌套回退）', () => {
    const code = `<template><div /></template>
<style>
:root { --local-gap: 4px; }
.a { padding: var(--local-gap); color: var(--bkms-text-title); }
</style>`;
    expect(verifyRule(code, 'theme/no-foreign-var')).toEqual([]);
  });

  it('独立 .css 走 Declaration.value 报外来 var()', () => {
    const messages = verifyRule(`.a { color: var(--Neutral-11); }`, 'theme/no-foreign-var', 'css');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('var(--Neutral-11)');
  });

  // 「父级注入覆盖、未注入回退到令牌」是有意的主题扩展点，不是漂移
  it('fallback 里已含 --bkms-* 的注入变量放行', () => {
    const code = `const s = 'color: var(--probe-label, var(--bkms-neutral-3))';`;
    expect(verifyRule(code, 'theme/no-foreign-var', 'ts')).toEqual([]);
  });

  it('fallback 不是令牌时仍然报（放行范围不扩大）', () => {
    const [msg] = verifyRule(`const s = 'color: var(--probe-label, #fff)';`, 'theme/no-foreign-var', 'ts');
    expect(msg.message).toContain('var(--probe-label)');
  });

  it('独立 .css 同文件局部变量放行', () => {
    expect(verifyRule(`.a { --local: 1px; padding: var(--local); }`, 'theme/no-foreign-var', 'css')).toEqual([]);
  });

  // VAR_RE 允许 `var(` 后有空白，高亮要覆盖到变量名，不能用拼接出来的长度
  it('var( 与变量名之间有空格时，高亮长度仍然完整', () => {
    const code = `const s = 'color: var( --foo)';`;
    const [msg] = verifyRule(code, 'theme/no-foreign-var', 'ts');
    expect(msg.column).toBe(code.indexOf('var(') + 1);
    expect(msg.endColumn - msg.column).toBe('var( --foo'.length);
  });

  it('报错定位落在 style 块 / .css 的 var() 片段上', () => {
    const cssCode = `.a { color: var(--Neutral-11); }`;
    const [cssMsg] = verifyRule(cssCode, 'theme/no-foreign-var', 'css');
    expect(cssMsg.column).toBe(cssCode.indexOf('var(--Neutral-11') + 1);

    const vueCode = `<template><div /></template>\n<style>\n.a { color: var(--Neutral-11); }\n</style>`;
    const [vueMsg] = verifyRule(vueCode, 'theme/no-foreign-var');
    expect(vueMsg.line).toBe(3);
    expect(vueMsg.column).toBe(vueCode.split('\n')[2].indexOf('var(--Neutral-11') + 1);
  });
});

/**
 * 令牌目录定位：cwd 优先、本文件位置兜底。cwd 不是 bkms-ui 时（monorepo 根跑 eslint / uno /
 * lint-staged），兜底必须上溯到子项目根，否则整份 eslint 与 uno 配置会直接抛错而不是降级。
 */
describe('令牌目录定位', () => {
  it('cwd 不在 bkms-ui 时仍能加载 map.mjs，且解析到同一份令牌', () => {
    const mapUrl = new URL('../theme-lint/map.mjs', import.meta.url).href;
    // 不只断言"能加载"：还要校验解析出的色阶数与当前进程一致，
    // 否则兜底指错但恰好某个目录存在 color.css 时仍会绿。
    const script = `const m = await import(${JSON.stringify(mapUrl)});process.stdout.write(String(Object.keys(m.parseScaleColors()).length))`;
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
      encoding: 'utf8',
    });
    expect(Number(stdout)).toBe(Object.keys(parseScaleColors()).length);
  });
});

describe('map 圆角反查', () => {
  it('同值语义档：6px 对应七个语义，base 兜底排最前', () => {
    expect(
      radiusSemantics(6)
        .map(t => t.label)
        .sort(),
    ).toEqual(['base', 'card', 'control', 'field', 'menu', 'overlay', 'tab']);
    expect(radiusSemantics(6)[0].label).toBe('base');
  });

  it('4px 两档（tag/scroll）、8px 与 3px 无同值语义', () => {
    expect(radiusSemantics(4).map(t => t.label)).toEqual(['tag', 'scroll']);
    expect(radiusSemantics(8).map(t => t.label)).toEqual([]);
    expect(radiusSemantics(3).map(t => t.label)).toEqual([]);
  });

  it('hint 只排序，不增删候选', () => {
    const hinted = radiusSemantics(6, 'tab');
    expect(hinted).toHaveLength(7);
    expect(hinted[0].label).toBe('tab');
    expect(hinted[1].label).toBe('base');
  });

  it('档位里没有同值时给最近档位', () => {
    const near = nearestRadiusSemantics(2);
    expect(near).toHaveLength(3);
    expect(near[0].px).toBe(1);
  });

  it('档位层拆成尺度档 hairline/xs/sm/md/lg/xl 与形状档 none/full', () => {
    expect(Object.keys(parseRadiusScaleTokens())).toEqual([
      'bkms-hairline',
      'bkms-xs',
      'bkms-sm',
      'bkms-md',
      'bkms-lg',
      'bkms-xl',
      'bkms-none',
      'bkms-full',
    ]);
  });

  it('isRadiusScaleVar 只认尺度档，形状档另有判定', () => {
    expect(isRadiusScaleVar('--bkms-radius-md')).toBe(true);
    expect(isRadiusScaleVar('--bkms-radius-lg')).toBe(true);
    expect(isRadiusScaleVar('--bkms-radius-none')).toBe(false);
    expect(isRadiusScaleVar('--bkms-radius-card')).toBe(false);
  });

  it('isRadiusShapeVar 只认 none/full', () => {
    expect(isRadiusShapeVar('--bkms-radius-none')).toBe(true);
    expect(isRadiusShapeVar('--bkms-radius-full')).toBe(true);
    expect(isRadiusShapeVar('--bkms-radius-md')).toBe(false);
  });

  it('radiusScaleVarPx 按档位名换算尺度档像素值', () => {
    expect(radiusScaleVarPx('--bkms-radius-xs')).toBe(3);
    expect(radiusScaleVarPx('--bkms-radius-sm')).toBe(4);
    expect(radiusScaleVarPx('--bkms-radius-md')).toBe(6);
    expect(radiusScaleVarPx('--bkms-radius-lg')).toBe(8);
    expect(radiusScaleVarPx('--bkms-radius-full')).toBeNull();
  });
});

describe('rule: no-hardcoded-radius', () => {
  // 6px 有七个同值语义档：语义由场景决定，只给候选
  it('同值多档只给候选，不自动修', () => {
    const code = `<template><div class="rounded-[6px]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('useClassMulti');
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions).toHaveLength(7);
    expect(fix(code).output).toBe(code);
  });

  // 候选是 token 对象，直接插值会变成 [object Object]，灯泡里看不出改什么
  it('灯泡文案带真实替换目标', () => {
    const [msg] = verifyRule(`<template><div class="bk-card rounded-[6px]" /></template>`, 'theme/no-hardcoded-radius');
    expect(msg.suggestions.map(s => s.data.target)).toContain('rounded-bkms-card（6px）');
    for (const s of msg.suggestions) expect(s.data.target).not.toContain('[object');

    const [cssMsg] = verifyRule(
      `<template><div /></template>\n<style>\n.a { border-radius: 6px; }\n</style>`,
      'theme/no-hardcoded-radius',
    );
    expect(cssMsg.suggestions.map(s => s.data.target)).toContain('var(--bkms-radius-card)（6px）');
  });

  it('4px 两档只给候选，不替人选 tag / scroll', () => {
    const code = `<template><div class="rounded-[4px]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('useClassMulti');
    expect(msg.suggestions).toHaveLength(2);
    expect(fix(code).output).toBe(code);
  });

  it('3px 无同值语义档，只给最近候选', () => {
    const code = `<template><div class="rounded-[3px]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('useClassUnknown');
    expect(fix(code).output).toBe(code);
  });

  it('方向保留：唯一同值语义档 → rounded-t-bkms-indicator', () => {
    const code = `<template><div class="rounded-t-[1px]" /></template>`;
    expect(fix(code).output).toBe(`<template><div class="rounded-t-bkms-indicator" /></template>`);
  });

  it('档位无同值（2px）时给最近档位候选，不自动修', () => {
    const code = `<template><div class="rounded-[2px]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('useClassUnknown');
    expect(msg.suggestions?.length).toBe(3);
    expect(fix(code).output).toBe(code);
  });

  // 形状值不再放行：映射到 none / full 唯一，所以直接自动修成项目注册的形状类
  it.each([
    ['rounded-[0]', 'rounded-bkms-none'],
    ['rounded-[0px]', 'rounded-bkms-none'],
    ['rounded-[50%]', 'rounded-bkms-full'],
    ['rounded-[999px]', 'rounded-bkms-full'],
  ])('%s 形状值自动修成 %s', (cls, target) => {
    const code = `<template><div class="${cls}" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('useClassShape');
    expect(fix(code).output).toBe(`<template><div class="${target}" /></template>`);
  });

  it('形状声明也自动修成形状档 var()', () => {
    const cssCode = `.a { border-radius: 50%; }`;
    const [msg] = verifyRule(cssCode, 'theme/no-hardcoded-radius', 'css');
    expect(msg.messageId).toBe('useVarShape');
    expect(fix(cssCode, 'css').output).toBe(`.a { border-radius: var(--bkms-radius-full); }`);

    const inline = `<template><div style="border-radius: 0" /></template>`;
    expect(fix(inline).output).toBe(`<template><div style="border-radius: var(--bkms-radius-none)" /></template>`);
  });

  it('项目注册的形状类与语义类放行', () => {
    for (const cls of ['rounded-bkms-none', 'rounded-bkms-full', 'rounded-bkms-card']) {
      expect(verifyRule(`<template><div class="${cls}" /></template>`, 'theme/no-hardcoded-radius')).toEqual([]);
    }
  });

  // 20px 在 80×80 卡片上是大圆角方块，归 full 会被钳成正圆；阈值定在 100px
  it('20px 有专属档位，落到 tile 语义', () => {
    const code = `<template><div class="rounded-[20px]" /></template>`;
    expect(fix(code).output).toBe(`<template><div class="rounded-bkms-tile" /></template>`);
  });

  it('档位里没有的值只给最近档位候选，不自动修', () => {
    const code = `<template><div class="rounded-[10px]" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('useClassUnknown');
    expect(fix(code).output).toBe(code);
  });

  it('<style> 块：唯一同值语义档 → var()，!important 保留', () => {
    const code = `<template><div /></template>\n<style>\n.bk-empty-home { border-radius: 20px !important; }\n</style>`;
    expect(fix(code).output).toBe(code.replace('20px !important', 'var(--bkms-radius-tile) !important'));
  });

  it('<style> 块：多值简写只报不修', () => {
    const code = `<template><div /></template>\n<style>\n.a { border-radius: 0 4px 4px 0; }\n</style>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(msg.messageId).toBe('compound');
    expect(fix(code).output).toBe(code);
  });

  // 四角并列换成令牌后依然要逐角跟改、读不出语义归属，所以不再只在含字面量时上报
  it('令牌化的多值简写同样只报不修', () => {
    const code = `.a { border-radius: var(--bkms-radius-none) var(--bkms-radius-card); }`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius', 'css');
    expect(msg.messageId).toBe('compound');
    expect(fix(code, 'css').output).toBe(code);
  });

  // 0 x x 0 / x 0 0 x 是历史产物的两种形态：整体语义 + 清零侧可以机械推出来
  it.each([
    ['0 20px 20px 0', 'border-start-start-radius', 'border-end-start-radius'],
    ['20px 0 0 20px', 'border-start-end-radius', 'border-end-end-radius'],
  ])('%s 给「整体 + 单角清零」建议', (value, first, second) => {
    const code = `.a { border-radius: ${value}; }`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius', 'css');
    expect(msg.suggestions).toHaveLength(1);
    expect(applySuggestion(code, msg.suggestions[0])).toBe(
      `.a { border-radius: var(--bkms-radius-tile);\n  ${first}: var(--bkms-radius-none);\n  ${second}: var(--bkms-radius-none); }`,
    );
  });

  it('CSS 语境按原声明缩进换行', () => {
    const code = `<template><div /></template>\n<style>\n.a {\n  border-radius: 0 var(--bkms-radius-overlay) var(--bkms-radius-overlay) 0;\n}\n</style>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    expect(applySuggestion(code, msg.suggestions[0])).toBe(
      code.replace(
        'border-radius: 0 var(--bkms-radius-overlay) var(--bkms-radius-overlay) 0;',
        'border-radius: var(--bkms-radius-overlay);\n  border-start-start-radius: var(--bkms-radius-none);\n  border-end-start-radius: var(--bkms-radius-none);',
      ),
    );
  });

  // 内联 style 与 script 字符串里换行会破坏值本身，只能单行
  it('内联 style 不换行', () => {
    const code = `<template><div style="border-radius: 0 20px 20px 0" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius');
    const out = applySuggestion(code, msg.suggestions[0]);
    expect(out).not.toContain('\n');
    expect(out).toBe(
      `<template><div style="border-radius: var(--bkms-radius-tile); border-start-start-radius: var(--bkms-radius-none); border-end-start-radius: var(--bkms-radius-none)" /></template>`,
    );
  });

  // 只替换值会留下属性名与尾部 !important，应用后变成重复声明
  it('拆开建议替换整条声明，属性名与 !important 不残留', () => {
    const code = `.a { border-radius: 0 var(--bkms-radius-overlay) var(--bkms-radius-overlay) 0 !important; }`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius', 'css');
    expect(applySuggestion(code, msg.suggestions[0])).toBe(
      `.a { border-radius: var(--bkms-radius-overlay) !important;\n  border-start-start-radius: var(--bkms-radius-none) !important;\n  border-end-start-radius: var(--bkms-radius-none) !important; }`,
    );
  });

  // script 样式对象的值外层是引号，一条属性塞不下四条声明，只能报不能修
  it('script 样式对象的多值不给拆开建议', () => {
    const [msg] = verifyRule(`const style = { borderRadius: '0 20px 20px 0' };`, 'theme/no-hardcoded-radius', 'ts');
    expect(msg.messageId).toBe('compound');
    expect(msg.suggestions).toBeUndefined();
  });

  // 属性名藏在三元后面：不沿 ConditionalExpression 上溯到 Property，整条会被静默跳过
  it('样式对象的三元值仍按属性名判定', () => {
    const msgs = verifyRule(
      `const style = { borderRadius: ok ? '4px' : '0 20px 20px 0' };`,
      'theme/no-hardcoded-radius',
      'ts',
    );
    expect(msgs.map(m => m.messageId)).toContain('compound');
  });

  // 4px 有 tag / scroll 两个同值档：拆开后整体语义同样由场景定，只给候选
  it('字面量多值给多档候选，不替人选', () => {
    const [msg] = verifyRule(`.a { border-radius: 0 4px 4px 0; }`, 'theme/no-hardcoded-radius', 'css');
    expect(msg.suggestions.length).toBeGreaterThan(1);
    for (const s of msg.suggestions) expect(s.data.target).toMatch(/^var\(--bkms-radius-[\w-]+\)$/);
  });

  it('推不出整体语义的多值（四角各异）不给建议', () => {
    const [msg] = verifyRule(`.a { border-radius: 4px 6px 8px 10px; }`, 'theme/no-hardcoded-radius', 'css');
    expect(msg.messageId).toBe('compound');
    expect(msg.suggestions).toBeUndefined();
  });

  it('内联 style 属性与脚本样式对象都命中，4px 只给候选', () => {
    const inlineCode = `<template><div style="border-radius: 4px" /></template>`;
    const [inline] = verifyRule(inlineCode, 'theme/no-hardcoded-radius');
    expect(inline.messageId).toBe('useVarMulti');
    expect(inline.suggestions).toHaveLength(2);

    const scriptCode = `const style = { borderRadius: '4px' };`;
    const [script] = verifyRule(scriptCode, 'theme/no-hardcoded-radius', 'ts');
    expect(script.messageId).toBe('useVarMulti');
    expect(script.suggestions).toHaveLength(2);

    // fix 必须落在值本体上：漏掉字面量基址就会插到文件开头
    expect(inlineCode.slice(...inline.suggestions[0].fix.range)).toBe('4px');
    expect(inline.suggestions[0].fix.text).toBe('var(--bkms-radius-tag)');
    expect(scriptCode.slice(...script.suggestions[0].fix.range)).toBe('4px');
    expect(script.suggestions[0].fix.text).toBe('var(--bkms-radius-tag)');
  });

  it('独立 .css 走 Declaration：8px 无同值给最近候选', () => {
    const [msg] = verifyRule(`.a { border-radius: 8px; }`, 'theme/no-hardcoded-radius', 'css');
    expect(msg.messageId).toBe('useVarUnknown');
    expect(msg.message).toBe('写死圆角 8px：档位无同值，最近的语义档是 base / field / control');
  });

  it('独立 .css 走 Declaration：唯一同值语义档自动修', () => {
    const [msg] = verifyRule(`.a { border-radius: 20px; }`, 'theme/no-hardcoded-radius', 'css');
    expect(msg.message).toBe('写死圆角 20px，改用 var(--bkms-radius-tile)');
  });

  it('非圆角属性里的数值不误报', () => {
    expect(verifyRule(`.a { padding: 6px; font-size: 6px; }`, 'theme/no-hardcoded-radius', 'css')).toEqual([]);
  });

  // script 里的动态类名同样是 class：扫描口径一致，只是不给自动修（可能只是数据 / 文案）
  it('script 里的类名字符串也报，但只报不修', () => {
    const code = `const s = 'rounded-[2px]';`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius', 'ts');
    expect(msg.messageId).toBe('useClassUnknown');
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions).toBeUndefined();
    expect(fix(code, 'ts').output).toBe(code);
  });

  it('script 对象里的 kebab 键也认', () => {
    const code = `const s = { 'border-radius': '4px' };`;
    const [msg] = verifyRule(code, 'theme/no-hardcoded-radius', 'ts');
    expect(msg.messageId).toBe('useVarMulti');
    expect(msg.suggestions).toHaveLength(2);
    expect(fix(code, 'ts').output).toBe(code);
  });
});

describe('rule: prefer-radius-class', () => {
  it.each(['rounded', 'rounded-t', 'rounded-sm', 'rounded-lg', 'rounded-tl-xl'])('%s 是内置刻度', cls => {
    const [msg] = verifyRule(`<template><div class="${cls}" /></template>`, 'theme/prefer-radius-class');
    expect(msg.messageId).toBe('bannedScale');
  });

  it('尺度档类给语义候选，不自动修', () => {
    const code = `<template><div class="rounded-bkms-md" /></template>`;
    const [msg] = verifyRule(code, 'theme/prefer-radius-class');
    expect(msg.messageId).toBe('bannedStep');
    expect(msg.fix).toBeUndefined();
    expect(fix(code).output).toBe(code);
  });

  it('内置形状类自动换成项目注册类', () => {
    for (const label of ['none', 'full']) {
      const code = `<template><div class="rounded-${label}" /></template>`;
      const [msg] = verifyRule(code, 'theme/prefer-radius-class');
      expect(msg.messageId).toBe('useBuiltinShape');
      expect(fix(code).output).toBe(`<template><div class="rounded-bkms-${label}" /></template>`);
    }
  });

  it('语义令牌的 var() 任意值直接换成注册类（方向保留）', () => {
    expect(fix(`<template><div class="rounded-[var(--bkms-radius-card)]" /></template>`).output).toBe(
      `<template><div class="rounded-bkms-card" /></template>`,
    );
    expect(fix(`<template><div class="rounded-t-[var(--bkms-radius-card)]" /></template>`).output).toBe(
      `<template><div class="rounded-t-bkms-card" /></template>`,
    );
  });

  it('尺度档 var() 任意值只给候选', () => {
    const [msg] = verifyRule(
      `<template><div class="rounded-[var(--bkms-radius-md)]" /></template>`,
      'theme/prefer-radius-class',
    );
    expect(msg.messageId).toBe('bannedStep');
    expect(msg.suggestions).toHaveLength(7);
  });

  it('CSS 里直连尺度档变量也报', () => {
    const code = `<template><div /></template>\n<style>\n.a { border-radius: var(--bkms-radius-md); }\n</style>`;
    const [msg] = verifyRule(code, 'theme/prefer-radius-class');
    expect(msg.messageId).toBe('bannedVar');
  });

  it('形状档 var() 与形状档类都合法', () => {
    for (const cls of ['rounded-bkms-none', 'rounded-bkms-full', 'rounded-[var(--bkms-radius-none)]']) {
      expect(verifyRule(`<template><div class="${cls}" /></template>`, 'theme/prefer-radius-class')).toEqual([]);
    }
    const cssCode = `<template><div /></template>\n<style>\n.a { border-radius: var(--bkms-radius-full); }\n</style>`;
    expect(verifyRule(cssCode, 'theme/prefer-radius-class')).toEqual([]);
  });

  it.each(['rounded-bkms-card', 'rounded-t-bkms-control'])('%s 放行', cls => {
    expect(verifyRule(`<template><div class="${cls}" /></template>`, 'theme/prefer-radius-class')).toEqual([]);
  });

  it('script 里的尺度档类也报，只报不修', () => {
    const code = `const s = 'rounded-bkms-md';`;
    const [msg] = verifyRule(code, 'theme/prefer-radius-class', 'ts');
    expect(msg.messageId).toBe('bannedStep');
    expect(msg.fix).toBeUndefined();
    expect(msg.suggestions).toBeUndefined();
    expect(fix(code, 'ts').output).toBe(code);
  });

  // 圆角令牌由本规则认领，颜色规则不能再落 bannedUnknown（「该令牌无注册类」是事实错误）
  it('prefer-uno-class 不再对圆角任意值误报', () => {
    const code = `<template><div class="rounded-[var(--bkms-radius-card)]" /></template>`;
    expect(verifyRule(code, 'theme/prefer-uno-class')).toEqual([]);
    const [msg] = verifyRule(code, 'theme/prefer-radius-class');
    expect(msg.messageId).toBe('unregistered');
  });

  it('未知语义档只报不修（不产出 uno 没注册的类名）', () => {
    const code = `<template><div class="rounded-[var(--bkms-radius-cardd)]" /></template>`;
    const [msg] = verifyRule(code, 'theme/prefer-radius-class');
    expect(msg.messageId).toBe('unknownSemantic');
    expect(msg.fix).toBeUndefined();
    expect(fix(code).output).toBe(code);
  });

  // 非 class 语境只认形态特殊的两种（任意值 / 档位类）：裸 rounded 在文案里是常见英文词
  it.each([
    ['template 属性值', '<template><div title="rounded" /></template>', 'vue'],
    ['script 普通字符串', `const shape = 'rounded';`, 'ts'],
    ['script 内置刻度词', `const shape = 'rounded-lg';`, 'ts'],
  ])('非 class 语境的裸刻度词不误报：%s', (_label, code, target) => {
    expect(verifyRule(code, 'theme/prefer-radius-class', target)).toEqual([]);
  });

  it('不存在的档位（rounded-bkms-99）不当档位，也不给候选', () => {
    expect(verifyRule(`<template><div class="rounded-bkms-99" /></template>`, 'theme/prefer-radius-class')).toEqual([]);
  });

  it('script 里的 var() 任意值文案不带「class 内」', () => {
    const [msg] = verifyRule(`const s = 'rounded-[var(--bkms-radius-card)]';`, 'theme/prefer-radius-class', 'ts');
    expect(msg.messageId).toBe('unregistered');
    expect(msg.message).not.toContain('class 内');
  });
});

describe('rule: no-stacked-radius', () => {
  // uno 的类名顺序不等于 CSS 顺序，同角两个来源谁赢取决于生成顺序
  it('同角叠加上报，指向后出现的类', () => {
    const code = `<template><div class="rounded-bkms-card rounded-tl-bkms-card" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-stacked-radius');
    expect(msg.messageId).toBe('stacked');
    expect(msg.message).toContain('rounded-tl-bkms-card');
    expect(msg.message).toContain('rounded-bkms-card');
  });

  it('整体 + 方向、方向 + 方向只要同角就报', () => {
    expect(
      verifyRule(
        `<template><div class="rounded-bkms-card rounded-t-bkms-none" /></template>`,
        'theme/no-stacked-radius',
      ),
    ).toHaveLength(1);
    expect(
      verifyRule(
        `<template><div class="rounded-tl-bkms-card rounded-t-bkms-none" /></template>`,
        'theme/no-stacked-radius',
      ),
    ).toHaveLength(1);
  });

  it('不同方向的边不冲突', () => {
    const code = `<template><div class="rounded-t-bkms-card rounded-b-bkms-card" /></template>`;
    expect(verifyRule(code, 'theme/no-stacked-radius')).toEqual([]);
  });

  // hover: 作用于另一个状态，静止态只有一个来源
  it('变体前缀不算叠加', () => {
    const code = `<template><div class="rounded-bkms-base hover:rounded-bkms-card" /></template>`;
    expect(verifyRule(code, 'theme/no-stacked-radius')).toEqual([]);
  });

  it('uno 内置刻度参与叠加判定', () => {
    const code = `<template><div class="rounded-lg rounded-bkms-card" /></template>`;
    expect(verifyRule(code, 'theme/no-stacked-radius')).toHaveLength(1);
  });

  it('非 class 语境不扫，避免把文案当类名', () => {
    expect(
      verifyRule(
        `<template><div title="rounded-bkms-card rounded-tl-bkms-card" /></template>`,
        'theme/no-stacked-radius',
      ),
    ).toEqual([]);
  });

  it('@apply 里的叠加同样上报', () => {
    const code = `<template><div /></template>\n<style>\n.a { @apply rounded-bkms-card rounded-tl-bkms-card; }\n</style>`;
    const [msg] = verifyRule(code, 'theme/no-stacked-radius');
    expect(msg.messageId).toBe('stacked');
  });

  // 留哪个取决于设计意图，两条建议各删一个，删完不留双空格
  it('叠加给两条建议：各删一个', () => {
    const code = `<template><div class="rounded-bkms-card rounded-tl-bkms-card" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-stacked-radius');
    expect(msg.suggestions.map(s => s.data.value)).toEqual(['rounded-tl-bkms-card', 'rounded-bkms-card']);
    expect(applySuggestion(code, msg.suggestions[0])).toBe(`<template><div class="rounded-bkms-card" /></template>`);
    expect(applySuggestion(code, msg.suggestions[1])).toBe(`<template><div class="rounded-tl-bkms-card" /></template>`);
  });

  it('@apply 里删类不吃掉指令后的空格', () => {
    const code = `<template><div /></template>\n<style>\n.a { @apply rounded-bkms-card rounded-tl-bkms-card; }\n</style>`;
    const [msg] = verifyRule(code, 'theme/no-stacked-radius');
    expect(applySuggestion(code, msg.suggestions[0])).toContain('@apply rounded-bkms-card;');
  });

  // 绑定的类名是一串独立 Literal，逐字面量判定看不到彼此，必须在属性层看整段表达式
  it(':class 数组里跨项叠加上报', () => {
    const code = `<template><div :class="['rounded-bkms-card', 'rounded-tl-bkms-card']" /></template>`;
    const [msg] = verifyRule(code, 'theme/no-stacked-radius');
    expect(msg.messageId).toBe('stacked');
    expect(msg.message).toContain('rounded-tl-bkms-card');
  });

  it(':class 对象写法同样上报', () => {
    const code = `<template><div :class="{ 'rounded-bkms-card': ok, 'rounded-t-bkms-none': ok }" /></template>`;
    expect(verifyRule(code, 'theme/no-stacked-radius')).toHaveLength(1);
  });

  it(':class 单个字符串仍按文本判定', () => {
    const code = `<template><div :class="'rounded-bkms-card rounded-tl-bkms-card'" /></template>`;
    expect(verifyRule(code, 'theme/no-stacked-radius')).toHaveLength(1);
  });

  it(':class 绑定里同名类重复与不同角不报', () => {
    expect(
      verifyRule(
        `<template><div :class="['rounded-bkms-card', 'rounded-bkms-card']" /></template>`,
        'theme/no-stacked-radius',
      ),
    ).toEqual([]);
    expect(
      verifyRule(
        `<template><div :class="['rounded-t-bkms-card', 'rounded-b-bkms-card']" /></template>`,
        'theme/no-stacked-radius',
      ),
    ).toEqual([]);
  });
});
