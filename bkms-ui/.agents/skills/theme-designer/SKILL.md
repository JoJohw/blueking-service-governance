---
id: engineering/theme-designer
name: 主题色值修改规范
category: engineering
description: 设计师改 BKMS 主题颜色 token 的规范流程：定位真源、改对层级，改完用 palette 预览对比
tags: [theme, token, color, design, bkms]
updated_at: 2026-11-17
---

<!-- 同一 skill 同时放在 .agents/skills/ 与 .codebuddy/skills/ 两处，改动请同步 -->

# 主题色值修改规范

给设计侧 AI agent 的改色手册。用户说「改颜色 / 改 token / 调主色 / 把 xx 调深 / 换个语义色」等，按本规范执行。

**palette（`pnpm theme:designer`）是只读预览工具，不在这里改 token。** 它的作用是改完后刷新看效果、对比前后色值。

## 核心原则

- `src/styles/theme/tokens/colors.css` 是**唯一允许出现色值字面量**的原子层；`semantic.css` 只引用色阶，**禁止色值字面量**——唯一例外是阴影组：阴影按场景命名、值即完整 8 位效果值，无法由色阶派生。
- 业务/组件代码只用 `--bkms-*` 语义 token，**禁止新增硬编码色值**（stylelint `color-no-hex` 管控）。
- 改 primitive 色阶会影响所有引用它的 semantic token；动手前先说清影响面。

## 真源

- 色值真源：`bkms-color-spec.md`（**不进 git**，本地在 `C:\Users\Administrator\Downloads\bkms-color-spec.md`）。要改确认过的色值，以此为准。
- 仓库里的落地文件：`src/styles/theme/tokens/colors.css`（色阶，唯一写 hex 的地方）和 `semantic.css`（语义，只引用色阶；阴影组例外）。

`scripts/theme-codemod/` 下的 `mapping.json`、`keep.json`、`pending-design.json`、`color-diff-backup.json` 都是**主题改造过渡期**的迁移台账，正式版本不会保留。改现有 token 值不碰它们；只有做全仓 hex→token 批量迁移时才用得到，那不是本 skill 的场景。

## token 文件的注释约定

分组与说明用显式标记维护（palette 解析，CSS 本身忽略）。新增 / 调整 token 时必须同步维护，否则色板丢分组或丢说明：

```css
/**
 * @group brand                        分组名，值即色板展示标题（开组）
 * @note 品牌主色，7 最浅 → 1 最深        分组描述，可多行续写
 */

/** 链接、选中字 */                     每条 token 上方一行「用在」，新增 token 必须写
--bkms-text-brand: var(--bkms-brand-2);

/* @endgroup */                        闭组，之后到下一个 @group 前的声明归入「未分组」
```

- 块注释与相邻声明之间留空行（stylelint `comment-empty-line-before`）。
- `colors.css` 的 keep 组命名即色值（`--bkms-keep-ffb848`），加色时沿用该形态。
- 改完刷新 palette，确认分组名、分组描述、token 说明都正常显示。

## 改色流程

1. **定位**：确认用户要改的是 primitive 色阶还是 semantic 语义色；在 `colors.css` / `semantic.css` 里找到对应变量，读它当前的引用关系。
2. **判断影响面**：若改 primitive（如 `--bkms-brand-2`），列出引用它的 semantic token（如 `--bkms-text-brand`、`--bkms-line-active`），告知用户会影响这些语义色，确认后再改。若只改某个场景，优先改对应 semantic 的 `var()` 指向。
3. **修改**：
   - 改色阶 → 编辑 `src/styles/theme/tokens/colors.css` 对应行；
   - 改语义指向 → 编辑 `semantic.css`，只写 `var(--bkms-xxx)`，不写字面量。
4. **预览对比**：你负责把色板工具启动或刷新好（`pnpm theme:designer`，http://localhost:5300），然后告诉设计师"改好了，打开色板看看"。她只需要在页面上确认新色值和预览效果，不需要接触任何命令。单纯改颜色，到这一步就结束了。

只改 `colors.css` / `semantic.css` 里的值时不需要额外校验——`colors.css` 的 hex 本来就被 stylelint 豁免，`theme:report` 检查的是 `src/` 下业务代码的令牌漂移，和 token 文件无关。

## 你（agent）自己知道的检查

以下情况**你自己处理，不要把命令抛给设计师**——她只管说要什么颜色、看预览效果：

- 改动超出 `colors.css` / `semantic.css`（碰了业务代码或组件覆写），或准备提交给开发 review 时：你自行跑样式检查、令牌漂移检查和构建（构建如因内存不足失败，自己带 `NODE_OPTIONS=--max-old-space-size=8192` 重试）。
- 库升级后：你自行跑 `scripts/theme-codemod/scripts/check-overrides.mjs` 做覆写漂移自检。

只有检查**失败**时才告诉设计师，用大白话说"这个改动会影响到别的样式，我先不动，等开发确认"，不要贴命令或报错原文。单纯改 token 颜色的场景一律不触发这些检查。

## 红线

- 不在 `colors.css` 以外写色值字面量；不在 `semantic.css` 写 hex。
- 不在 palette 里改 token——它只读。

## 边界

- 本 skill 只管**改主题 token**。业务项目「接入主题」是另一回事，不走这里。
- 本 skill 不规定 git 流程，按仓库常规约定提交。
