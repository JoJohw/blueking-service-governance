# S17 测试用例独立评审记录

> 定位：S17（`test/scenarios/cluster-components.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S17.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/cluster-components.test.ts`（3 个测试） |
| 被测源码 | `src/pages/env/cluster-components/cluster-components.vue` |
| 评审基准 | S17 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评 | 88/100 | 通过 | 3/3 全绿；变异 3/3 捕获 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 22 | 30 | 覆盖空态、分组收起/展开、安装侧滑弹出；未覆盖：侧滑内配置表单提交、可选组件分组、更新模式入口（stub 边界已在 PILOT 注明） |
| 准确性 | 24 | 25 | 断言与源码核实一致（空态条件 `appTypeGroups.length === 0`、分组展开 toggle、`handleInstall` 置 `isShowInstallSideslider`）；收起态负断言先行 -1 |
| 有效性 | 15 | 15 | 变异 3/3 捕获，命中用例各归其位；空态用例断言直达文案 |
| 可执行性 | 10 | 10 | 约 4.2~6s/次，连跑 3 次稳定，无 sleep |
| 规范性 | 9 | 10 | 标题模板、cleanup、mock 注释完整；文件头注释清楚交代 stub 策略 |
| 可维护性 | 8 | 10 | `renderPage(addons)` 工厂简洁；分组头用 `.cursor-pointer` 类定位，类名变更时需同步 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Low | 分组头以 `.cursor-pointer` 类定位，非测试 id | ⏸ 维持（源码无测试 id 可用；已在评审记录标注脆弱点） |

## 5. 运行实证

`vitest run test/scenarios/cluster-components.test.ts`：**3 passed (3)**，连跑 3 次稳定（4.2~6s/次）。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | 删除分组展开分支（toggle 仅收起不展开） | **2 failed** \| 1 passed | 展开显示组件名与安装入口；点击安装弹出侧滑 |
| 2 | 空态条件反转（`length === 0` → `length > 0`） | **1 failed** \| 2 passed | 无组件时应显示「暂无组件」空态 |
| 3 | 点击安装不弹出侧滑（`isShowInstallSideslider = false`） | **1 failed** \| 2 passed | 点击安装应弹出安装组件侧滑 |

**结论**：3/3 变异被捕获，命中用例与回归点一一对应，无连带误伤之外的漏报。

## 7. 推广结论

**通过（88/100，无阻塞）。** 自定义 div 列表（非 vxe）场景的打法已验证：不需要表格垫片；重型动态表单子件（如按 schema 渲染的 ComponentsConfig）stub 为按 visible 渲染标记文本的占位，契约对齐真实组件的 v-model。可作为后续「自定义列表 + 重型侧滑」场景的参考。

## 8. 遗留项

**真缺口**：

- **P2**：安装侧滑内表单提交与列表状态刷新。
- **P2**：可选组件分组、更新模式（isUpdateMode）分支。

**其他**：PILOT_S17 §4 文档性验收待人工执行；S17 卡「路由挂载待确认」备注仍开放。
