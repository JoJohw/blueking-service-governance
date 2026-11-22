---
id: engineering/component-preview-sync
name: 组件预览样例同步规范
category: engineering
description: 组件 props/slots 变更后同步预览样例与基线的规范流程：跑 --check 看 diff、判断样例是否要更新、改插件（如需）、--baseline --only 确认
tags: [component-preview, baseline, sample, bkms]
updated_at: 2026-11-22
---

<!-- 同一 skill 同时放在 .agents/skills/ 与 .codebuddy/skills/ 两处，改动请同步 -->

# 组件预览样例同步规范

给开发侧 AI agent 的组件样例维护手册。改了组件的 props / slots（`defineProps` / `defineModel` / `defineSlots` 的类型声明）后，按本规范把预览样例与基线同步好，避免样例静默失真。

## 什么时候触发

- 改了组件 `.vue` 的类型声明（props / slots / model），或改了它 `import` 进来的类型文件。
- 增删组件文件、改组件目录路径。
- 用户说「组件样例过期了」「预览不对」「帮我同步样例」等。

## 背景（30 秒版）

预览清单 `src/pages/designer/generated/component-catalog.js` 由 `scripts/component-preview/index.mjs` 生成：

- **自动推导**：从 `.vue` 类型声明推导占位样例。
- **手写样例**：少数「推导接不住」的组件在 `scripts/component-preview/plugins/*.mjs` 里手写（`propOverrides` / `slotOverrides` / `slotCombos` / `previewVariants` / `componentFamily`）。
- **基线**：`scripts/component-preview/component-baseline.json` 记录每个组件的「样例签名」——取**覆盖前** `analyzedProps` + slots 的 hash，与手写样例无关。

三态：`new`（新增）/ `changed`（组件变了，样例可能过期）/ `stable`（一致）。签名取覆盖前意味着：**能抓「组件变了」，抓不到「手写样例本身写错」**——后者由 `catalog.test.mjs` 的跨字段引用断言兜底（如 `tab` 的 `active ∈ tabs[].name`）。

## 标准流程

1. **看 diff**：跑 `node scripts/component-preview/index.mjs --check`（只读，不写任何产物）。读输出里的 `待确认（new / changed）`、`removedIds`、`纯推导结构变化（info）`。
2. **判断**（见下「判断指南」）。
3. **改插件（仅当需要）**：编辑对应 `plugins/*.mjs` 的手写样例。
4. **确认**：`node scripts/component-preview/index.mjs --baseline --only <组件id>` 写回基线。**必须附证据**（预览截图或 diff 摘录）说明「样例已核对 / 已更新」。

## 判断指南（本 skill 的核心）

拿到 `--check` 的 `changed` 组件，先判断它属于哪一类：

- **纯推导组件**（plugins 里没有它的手写扩展）：样例自动跟随推导，无需改插件，直接 `--baseline --only <id>` 确认即可。
- **手写样例组件**（plugins 里有 `propOverrides` / `slotOverrides` / `slotCombos` / `previewVariants` / `componentFamily` 任一命中）：
  - `propOverrides` 手写目前共 9 个：`components/tab`、`components/key-value`、`components/sort-dropdown`、`components/password-input`、`components/under-line-tips`、`components/toggle-card`、`components/editable-variable-table/sensitive-value-input`、`components/modules/components-sideSlider`（在 `component-defs` 插件）、`pages/application/detail/deploy/instance-list/components/instance-log`。
  - 检查手写数据是否与新结构一致：字段名/类型变了 → 手写里对应字段要同步，否则预览失真；跨字段引用（如 `tab` 的 `active` 必须 ∈ `tabs[].name`）→ 改完跑 `pnpm test:scripts` 验证；只是加了个可选字段 → 通常不用改，确认即可。
- **`new`**：新组件首次入清单。纯推导的直接确认；需要多条列表或真实语义数据的，才考虑补手写样例——优先复用推导，别为了「好看」手写一堆。
- **`removedIds`**：组件被删 / 改名。确认无误后 `--baseline --prune` 清理（完整性守卫不通过会自动拒绝）。
- **`info`**：纯推导组件的结构变化，不影响样例，无需处理。

## CLI 参考

| 命令 | 作用 |
|------|------|
| `node scripts/component-preview/index.mjs --check` | 只读检查 diff/status，不写任何产物 |
| `node scripts/component-preview/index.mjs --baseline` | 首次建全量基线 |
| `node scripts/component-preview/index.mjs --baseline --only <id>` | 增量确认单个 catalog 内组件 |
| `node scripts/component-preview/index.mjs --baseline --prune` | 清理 removed 条目（完整性守卫不通过会拒绝） |
| `node scripts/component-preview/index.mjs --baseline --force --yes` | 非首次全量写回（清空所有待确认） |

## 红线

- **不要**用 `--baseline --force --yes` 全量写回，除非确知当前无人有未确认待办（它会清掉别人的 `changed`）。日常只用 `--only <id>`。
- **不要**手改 `component-baseline.json`，一律走 CLI。
- **不要**为了「样例好看」给纯推导组件加手写样例；手写只给「推导接不住」的场景。
- 确认动作**必须附证据**（截图 / diff 摘录），作为「真核对了」的门槛。
- 基线读取异常时（`--check` 报「基线读取异常」）先停手，别继续 `--baseline` 写回，否则可能把损坏基线覆盖掉。

## 验证

- 改完跑 `pnpm test:scripts`（含 baseline / consumer / catalog 跨字段断言，全绿为准）。
- 需要看实际预览效果时，启动 preview 页面确认样例渲染正常。
