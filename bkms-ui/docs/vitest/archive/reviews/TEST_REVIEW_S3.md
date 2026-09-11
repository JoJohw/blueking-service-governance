# S3 测试用例独立评审记录

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：S3（`test/scenarios/app-config-resources.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S3.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/app-config-resources.test.ts`（6 个测试） |
| 被测源码 | `components/resources-form.vue`、`use-app-spec-section.ts` |
| 评审基准 | S3 场景卡（`../../guides/TEST_SCENARIOS_ROUTES.md`，V 由 3 校准为 6）；`../../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评 | 87/100 | 通过 | 6/6 全绿；变异 4/4 捕获 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 21 | 30 | 覆盖进入编辑态、取消回滚、保存失败、两条环境写入路径、恢复默认配置；未覆盖其余 5 个配置子模块、字段级修改标识与单字段重置、Tab/query 同步（backlog，其中子模块同构性为「推断/需确认」→ N/A-C） |
| 准确性 | 24 | 25 | 断言与源码核实一致（use-app-spec-section.ts:274-286 编辑/取消、:343-383 保存分派、:310-328 恢复默认）；实例数校验因组件库 min 兜底改为保存失败路径 -1 |
| 有效性 | 15 | 15 | 变异 4/4 捕获；保存失败用例以「请求已发出」为完成信号再断言未提示成功，符合消极断言标准写法 |
| 可执行性 | 10 | 10 | 约 5.7~7.0s/次，连跑 3 次稳定，无 sleep |
| 规范性 | 9 | 10 | 标题模板、共享 helpers 复用；实例数输入框用唯一 spinbutton 定位（label 无 aria 关联）并加注释 -1 |
| 可维护性 | 8 | 10 | harness + loadEnv 工厂清晰；harness 依赖 defineExpose 契约，组件契约变更需同步 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Low | 实例数校验提示不可达（bkui `:min="1"` 兜底） | ✅ 判 N/A-A（已给反证：S1/S12 同类无兜底校验可测），反向路径改为保存失败 |
| Low | `getByRole('spinbutton')` 依赖「编辑态唯一 number 输入」这一隐含前提 | ⏸ 维持（已注注释；子件新增 number 输入需同步） |
| Medium | 其余配置子模块是否同构未验证 | ⏸ backlog（推断/需确认 → N/A-C） |

## 5. 运行实证

`vitest run test/scenarios/app-config-resources.test.ts`：**6 passed (6)**，连跑 3 次稳定（5.7~7.0s/次）。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | handleCancelEdit 不回滚快照（:275） | **1 failed** \| 5 passed | 取消应恢复原配置 |
| 2 | 保存成功后不退出编辑态（:378） | **1 failed** \| 5 passed | 默认环境保存后应回到查看态 |
| 3 | 保存环境分派反转（:350 `isDefault` 取反） | **3 failed** \| 3 passed | 默认环境保存 / 普通环境保存 / 恢复默认 |
| 4 | handleResetToDefault 不调用 deleteEnv（:315） | **1 failed** \| 5 passed | 恢复默认配置应删除环境覆盖 |

**结论**：4/4 变异被捕获，命中范围与回归点一致（变异 3 影响面较大，命中 3 条符合预期）。

## 7. 推广结论

**通过（87/100，无阻塞）。** 多态切换类场景的通用打法：**不要 mock 通用 composable**（判定逻辑都在里面），而是以代表性子模块 + harness 驱动父容器契约（`defineExpose`）来覆盖；环境/默认双写入路径是本类场景最具价值的判定分支，应作为必测项。

## 8. 遗留项

**真缺口**：

- **P2**：其余配置子模块（健康探针、生命周期、更新策略、元数据、网络访问、程序配置）。
- **P2**：字段级修改标识、单字段重置、环境切换脏离开确认。
- **P2**：`app-config/index.vue` 的 Tab 与 URL query 同步。

**N/A（A 组件库不可达）**：资源规格「实例数不能小于1」提示（`min` 兜底）。
**N/A（C 行为未定）**：其余子模块是否与资源规格同构——待业务确认。

**其他**：PILOT_S3 §4 文档性验收待人工执行。
