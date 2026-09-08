# S16 测试用例独立评审记录

> 定位：S16（`test/scenarios/public-env-var-form.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S16.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/public-env-var-form.test.ts`（4 个测试） |
| 被测源码 | `src/pages/env/public-env-vars/env-var-form-dialog.vue` |
| 评审基准 | S16 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评 | 91/100 | 通过 | 一次通过 4/4；变异 3/3 捕获 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 25 | 30 | 覆盖新建/编辑模式差异、Key 校验拦截、作用域联动；未覆盖：创建/更新提交成功与失败、敏感变量值输入、Sideslider 内列表与删除确认 |
| 准确性 | 24 | 25 | 断言与源码核实一致（`envVarKeyRegex`、作用域 `v-if`、编辑只读）；成功回调经 attrs 注入，写法略绕 -1 |
| 有效性 | 15 | 15 | 变异 3/3 捕获，各打挂唯一对应用例；校验用例为「文案出现 + 成功未触发」双断言 |
| 可执行性 | 10 | 10 | 约 4.2s/次，连跑 3 次稳定，无 sleep |
| 规范性 | 9 | 10 | 标题模板、cleanup 符合；`attrs` 传监听而非 props 可读性一般 -1 |
| 可维护性 | 8 | 10 | `renderDialog(editData)` 工厂简洁；editData 为 loose 类型，字段变更时无类型保护 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Low | 成功回调用 attrs 注入（非 props） | ⏸ 维持（组件用 emit，RTL 无 props 形式，注释已说明） |
| Low | `editData` 为 loose 类型 | ⏸ 维持（待用 `ScopedEnvVarOutputObj` 类型约束） |

## 5. 运行实证

`vitest run test/scenarios/public-env-var-form.test.ts`：**4 passed (4)**，连跑 3 次稳定（4.2~4.4s/次）。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | Key 格式校验规则清空 | **1 failed** \| 3 passed | Key 不符合规则时提交应被拦截 |
| 2 | 编辑模式也展示作用域选择（`v-if="true"`） | **1 failed** \| 3 passed | 编辑时作用域应只读展示 |
| 3 | 选择「指定环境类型」后不再展开类型选项 | **1 failed** \| 3 passed | 指定环境类型应出现环境类型选项 |

**结论**：3/3 变异被捕获，每个变异只打挂一条对应用例，用例指向明确。

## 7. 推广结论

**通过（91/100，无阻塞）。** 弹窗表单类场景的打法已验证：直接渲染弹窗 + 用 `editData` 切换模式 + 校验类断言双保险。可作为 S2（提交部署）、S4（可编辑表格）等表单场景的参考。

## 8. 遗留项

**真缺口**：

- **P2**：创建/更新提交的成功与失败路径（含接口失败时的表现）。
- **P2**：敏感变量（Switcher + SensitiveValueInput）的值输入与脱敏展示。
- **P3**：Sideslider 内变量列表、删除确认（delete-env-var-dialog）。

**其他**：PILOT_S16 §4 文档性验收待人工执行。
