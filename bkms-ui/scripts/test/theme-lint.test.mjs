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
 * theme-lint 单测：令牌映射（map.mjs）+ 四条 eslint 规则（plugin.mjs）。
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
  isShadowVar,
  isThemeVar,
  layerOfClass,
  layerOfVar,
  nearestClasses,
  nearestVars,
  normalizeHex,
  parseScaleColors,
  parseSemanticShortcuts,
  suggestClass,
  suggestShadowVar,
  suggestVar,
} from '../theme-lint/map.mjs';
import themePlugin from '../theme-lint/plugin.mjs';

const RULES = {
  'theme/no-hardcoded-color': 'error',
  'theme/no-default-palette': 'error',
  'theme/prefer-uno-class': 'error',
  'theme/no-foreign-var': 'error',
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
      expect(name).toMatch(/^bkms-[a-z-]+-\d+$/);
      expect(scale[name]).toBe(`var(--${name})`);
    }
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
      expect(cls).toMatch(/^(bkms-bg-[a-z-]+|bg-bkms-[a-z-]+-\d+)$/);
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
    // 否则兜底指错但恰好某个目录存在 colors.css 时仍会绿。
    const script = `const m = await import(${JSON.stringify(mapUrl)});process.stdout.write(String(Object.keys(m.parseScaleColors()).length))`;
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
      encoding: 'utf8',
    });
    expect(Number(stdout)).toBe(Object.keys(parseScaleColors()).length);
  });
});
