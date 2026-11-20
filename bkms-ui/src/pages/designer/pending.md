# 组件预览 pending 清单

> 记录 `/#/__designer?view=component` 下组件预览的检查进度与问题。
> 扫描方式：chrome-devtools 逐个点击自动清单，读取 `SafeComponent` 捕获的错误。

## 概览

- 当前 catalog：**49** 个组件（纯图标、iframe、单次使用等低价值组件已从清单过滤）
- 已检查至：`ms-header`（catalog 顺序第 32 个）
- 待检查：17 个（见下）

## 已修复

| 组件 | 原错误 | 处理 |
|---|---|---|
| 全局假失败 | `Cannot read properties of undefined (reading 'props')` | `SafeComponent` 加 key，避免实例复用导致错误状态残留 |
| custom-navigation、editable-variable-table/index、env-group-selector | `.flatMap` / `.forEach` / `.filter` of undefined | 生成器 AST 提取 `defineProps` 类型参数，支持内联类型 |
| code-revision/code-revision-field、tag-config-form | `Cannot read properties of undefined (reading 'props')` | 生成器标记 `needsForm`，预览页按标记包一层 `<Form>` |
| monaco-editor/ms-editor-plus、monaco-editor/ms-editor | `fn is not a function` | 运行时类型判断锚定开头（`^Array` 优先于 `String`），函数数组占位给 `[]` |
| 全部函数型 prop | `xxx is not a function` | 函数型 prop 序列化为 `() => ''` |

## 待检查（ms-header 之后，按 catalog 默认顺序）

- overflow-ctrl
- password-input
- repeatable-input
- scroll-layout
- secret-toggle
- skeleton/skeleton
- sort-dropdown
- startup-command-input
- status-dot-icon
- status-icon
- tab-header
- tab
- table-exception
- tag-config-form
- toggle-card
- under-line-tips
- user-selector

## 已知视觉空白（渲染成功但看不到内容）

| 组件 | 现象 | 原因 |
|---|---|---|
| flex-row | 空 | 左右两列是 slot，占位块未落在可见区域 |
| collapsible-aside-layout | 空 | 内容依赖 slot，占位块未落在可见区域 |
| edit-block | 空 | 内容型组件依赖 slot / 文本 props |
| env-vars-import-sideslider | 空 | 初始 `isShow=false` + `render-directive="if"`，DOM 不生成 |
| modules/components-sideSlider | 空 | Sideslider 初始 `visible=false`，DOM 不生成 |
| status-dot-icon | 空（小圆点） | `colorMap` 只认 `normal`/`abnormal`，占位 `icon` 落到无匹配 symbol 的分支 |

## 备注

- 请求已被 `request-isolation.ts` 短接为空数组，预览不发起真实 API 调用。
- 预览背景透明，浅灰舞台底色透出，避免白底组件与白画布融为一体。
