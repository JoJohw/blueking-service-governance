---
id: engineering/component-preview-designer
name: 组件预览样例维护规范（设计师）
category: engineering
description: 设计师在预览页查看与维护组件样例的规范：觉得样例不合适可直接改 plugins 里的样例；基线仍由开发侧 CLI 维护，复杂结构性改动建议提需求给开发
tags: [component-preview, design, bkms]
updated_at: 2026-11-22
---

<!-- 同一 skill 同时放在 .agents/skills/ 与 .codebuddy/skills/ 两处，改动请同步 -->

# 组件预览样例维护规范（设计师）

给设计侧 AI agent 的组件预览使用手册。设计师在预览页（`src/pages/designer/preview/`）查看组件形态、状态、枚举各态；觉得某个组件的样例不合适，也可以自己改。

## 能做什么

- **查看**：在预览页浏览全仓组件形态。
- **改样例内容**：觉得某个组件的样例不合适（占位不好看、状态不全、语义不对），**可以自己改** `scripts/component-preview/plugins/*.mjs` 里的样例数据，改完重新生成清单（`node scripts/component-preview/index.mjs`）再看效果。

## 不碰什么

- **不碰** `scripts/component-preview/component-baseline.json`（基线）——那是「组件结构变更」的 diff/确认，由开发侧用 CLI（`--check` / `--baseline`）维护，跟改样例内容无关。
- 预览页 header 的 Tag（「新增」/「示例待更新」）是「组件 props/slots 结构变了」的信号，不是「样例内容不对」的提示：看到「示例待更新」说明组件结构变了、样例可能过期，可以自己把样例调对，也可以叫开发一起看。

## 改样例的边界

- 常规的 prop 覆写、slot 内容、简单状态变体，直接改 `plugins/*.mjs` 即可。
- 涉及**组件族（`componentFamily`）、接口关联（`enumOverrides` / `transformSamples`）、复杂逻辑（`disabledFn`）**这类结构性改动时，牵动推导链、易出错，建议提需求给开发按 `component-preview-sync` skill 落地，别自己硬改。

## 边界

- 本 skill 只管「组件样例」的查看与维护；改主题 token 走 `theme-designer` skill，两者互不相关。
- 本 skill 不规定 git 流程，按仓库常规约定提交。
