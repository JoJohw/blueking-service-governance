# S15 测试用例独立评审记录

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：S15（`test/scenarios/helm-deploy.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S15.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/helm-deploy.test.ts`（7 个测试） |
| 被测源码 | `src/pages/application/detail/helm-deploy/`（index / deploy-application / deploy-history / preview-rollback） |
| 评审基准 | S15 场景卡（`../../guides/TEST_SCENARIOS_ROUTES.md`，V 校准 7）；`../../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评 | 88/100 | 通过 | 7/7 全绿；变异 4/4 捕获且命中精确 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 22 | 30 | 覆盖更新入口禁用、校验拦截、部署正向主路径（含回填）、预检弹窗两分支、回滚入口约束与确认；未覆盖：移除部署确认、查看 Values、生产环境晋级约束、脏离开确认（backlog） |
| 准确性 | 24 | 25 | 断言与源码核实一致（index.vue:238-241 禁用状态机、deploy-application.vue:387-388 校验拦截、deploy-history.vue:259-261 首行禁用、preview-rollback.vue:153-179 确认链）；部署参数断言含回填值 -1 |
| 有效性 | 15 | 15 | 变异 4/4 捕获且每变异仅命中 1 条对应用例；校验拦截为「错误态出现 + 预览未调用」双断言 |
| 可执行性 | 10 | 10 | 约 5.5~7.5s/次，连跑 3 次稳定，无 sleep；`findBy*` 承载 bkui 延迟显隐 |
| 规范性 | 9 | 10 | 标题模板、cleanup、beforeEach 重置单例 ref；2 处类名查询（`.bk-select` 触发器 / `.is-error` 信号）——bkui 无测试 id 可用，属必要代价 -1 |
| 可维护性 | 8 | 10 | `openFilledDeployApplication` 工厂与 stub 契约注释清晰；文件级 mock + importActual 的双态组件需读者理解成本 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Low | `.bk-select` / `.is-error` 类名查询（bkui 无测试 id 可用） | ⏸ 维持（组件库升级时需复查这两处类名） |
| Low | stub 与真实组件并存（importActual），文件内有注释说明 | ⏸ 维持（S15 特有的容器/子件分层需求所致） |

## 5. 运行实证

`vitest run test/scenarios/helm-deploy.test.ts`：**7 passed (7)**，连跑 3 次稳定（5.5~7.5s/次）。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | index.vue 禁用状态机去掉 `pending-upgrade`（index.vue:240） | **1 failed** \| 6 passed | 更新按钮应禁用 |
| 2 | deploy-application.vue 校验失败不再拦截（:388） | **1 failed** \| 6 passed | 未选必填项应被拦截 |
| 3 | deploy-history.vue 首行禁用恒失效（isLatestVersion 恒 false） | **1 failed** \| 6 passed | 第 1 页首行应禁用回滚 |
| 4 | preview-rollback.vue 回滚成功后不 emit success（:174） | **1 failed** \| 6 passed | 确认回滚应通知父组件 |

**结论**：4/4 变异被捕获，每个变异只打挂一条对应用例，指向精确、无误伤。

## 7. 推广结论

**通过（88/100，无阻塞）。** 两条新打法进入沉淀：① **文件级 mock 与真实组件并存**——同一路径既要 stub（容器场景）又要真实渲染（子件场景）时，用 `vi.importActual` 取真实组件；② **bkui 弹层时序**——Dialog/Sideslider 的 isShow 切换经内部 setTimeout 置位，查询必须 `findBy*`；Form 错误文案走 tooltip 时以 `is-error` 态为信号。适用于所有含 bkui 弹层与表单校验的场景。

## 8. 遗留项

**真缺口**：

- **P2**：移除部署确认（InfoBox 命令式）、查看 Values、生产环境晋级约束、脏离开确认、部署历史搜索/分页。

**其他**：PILOT_S15 §4 文档性验收待人工执行。
