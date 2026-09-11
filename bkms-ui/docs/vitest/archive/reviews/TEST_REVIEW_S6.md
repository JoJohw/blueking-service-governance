# S6 测试用例独立评审记录

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：S6（`test/scenarios/delete-confirm.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S6.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/delete-confirm.test.ts`（4 个测试） |
| 被测源码 | `src/components/delete-comfirm.vue`（79 行） |
| 评审基准 | S6 场景卡（`../../guides/TEST_SCENARIOS_ROUTES.md`）；`../../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评（含自整改） | 93/100 | 通过 | 修正 cleanup 缺失；确认「点击确定不自行关闭」这一设计决策已被断言保护 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 26 | 30 | 显示/确认/取消/loading 四路径覆盖；backlog：Dialog 自带 X 与遮罩关闭属 bkui-vue 内部行为（P3，标注不适用） |
| 准确性 | 24 | 25 | 断言与源码逐一核实（emit 只发 confirm、取消置 isShow=false、`:disabled="loading"`）；`toBeDisabled` 依赖 bkui-vue Button 行为 -1 |
| 有效性 | 14 | 15 | 反向断言完整（取消不触发 confirm、确认不自行关闭）；loading 分支为行为级断言 |
| 可执行性 | 10 | 10 | 无 sleep、无时序依赖，约 200ms 跑完 |
| 规范性 | 10 | 10 | 标题模板、条款 7 正反+边界、cleanup 完备 |
| 可维护性 | 9 | 10 | Harness 包装清晰；loading 通过模块级变量注入，可读性略逊于 props（-1） |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Medium | 缺 `afterEach(cleanup)` 导致弹窗 DOM 跨用例残留 | ✅ 已修 |
| Low | loading 注入方式（模块变量）可读性 | ⏸ 维持（Harness 内 ref 初始化一次即可，改造收益低） |

## 5. 运行实证

`vitest run test/scenarios/delete-confirm.test.ts`：**4 passed (4)**，约 200ms。

## 6. 有效性实证（变异测试）

向 `src/components/delete-comfirm.vue` 注入 4 个模拟回归（撤回均用编辑还原）：

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | `submit()` 不再 `emit('confirm')` | **1 failed** \| 3 passed | 点击确定应触发删除 |
| 2 | 取消按钮不再关闭弹窗 | **1 failed** \| 3 passed | 点击取消应关闭且不触发删除 |
| 3 | 删除进行中不再禁用取消（`:disabled="false"`） | **1 failed** \| 3 passed | 删除进行中应禁用取消 |
| 4 | 确定后组件自行关闭（`isShow=false`） | **1 failed** \| 3 passed | 弹窗应交由父组件决定是否关闭 |

**结论**：4/4 变异被捕获，每个变异仅打挂 1 条对应用例，无误报；组件的三个关键契约（只 emit 不关闭、取消即关、进行中禁关）均有独立保护。

## 7. 推广结论

**通过（93/100，无阻塞）。** 本场景沉淀了「`defineModel` 弹层组件的 Harness 包装 + cleanup」范式，可作为所有弹窗类组件场景的起点。

## 8. 遗留 backlog

- **P3**：Dialog 自带 X / 遮罩关闭行为（bkui-vue 内部，未立项）。
- **P3**：业务级删除入口（如 `delete-app-dialog.vue`）的连带用例，待其所属场景（S14 应用列表）解除 `@blueking/table` 阻塞后再补。
- PILOT_S6 §4 文档性验收待人工执行。
