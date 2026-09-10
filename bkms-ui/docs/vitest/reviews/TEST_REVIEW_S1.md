# S1 测试用例独立评审记录

> 定位：S1（`test/scenarios/create-application.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S1.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/create-application.test.ts`（8 个测试） |
| 被测源码 | `src/pages/application/create.vue`、`template/index.vue`、`template/trpc/index.vue`、`result.vue` |
| 评审基准 | S1 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`，V 由 4~5 校准为 8）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评 | 88/100 | 通过 | 8/8 全绿；变异 4/4 捕获且命中精确 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 22 | 30 | 覆盖步骤条两种模板配置、搜索空态、模板跳转、校验拦截、步骤前进、创建成功/失败；未覆盖其余模板向导（TAF/Agones/Helm 实体）、子件表单规则、重复提交与脏离开（backlog，其中后两项为「推断/需确认」→ N/A-C） |
| 准确性 | 24 | 25 | 断言与源码核实一致（create.vue:69-73 步骤配置、template/index.vue:152-154 搜索过滤、trpc/index.vue:171-182 校验拦截、:210-237 创建成败）；`{name}` 插值未解析改用正则 -1 |
| 有效性 | 15 | 15 | 变异 4/4 捕获，每变异只挂 1 条对应用例；校验拦截为「校验被消费 + 创建按钮不出现 + 未发请求」三重断言 |
| 可执行性 | 10 | 10 | 约 4.4~5.6s/次，连跑 3 次稳定，无 sleep |
| 规范性 | 9 | 10 | 标题模板、共享 helpers（`mock-i18n` / `mock-router`）复用；路由 mock 因需动态 route.name 做了局部覆写并注释说明 -1 |
| 可维护性 | 8 | 10 | harness 与三个 render 工厂清晰；RouterView 桩属本页特有的解析机制，读者需理解成本 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Low | `vue-router` mock 在共享 helper 上覆写了 `useRoute`（需按用例切 route.name） | ⏸ 维持（已注原因；共享 helper 的 route 为静态对象，本场景必须动态） |
| Medium | 重复提交拦截、脏离开确认未覆盖 | ⏸ backlog（「推断/需确认」，按指南条款 8 不写断言 → N/A-C） |

## 5. 运行实证

`vitest run test/scenarios/create-application.test.ts`：**8 passed (8)**，连跑 3 次稳定（4.4~5.6s/次）。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | create.vue:71 Helm 步骤配置改为三步 | **1 failed** \| 7 passed | Helm 流程应只两步 |
| 2 | template/index.vue:152 搜索过滤失效（返回全量） | **1 failed** \| 7 passed | 搜索无匹配应展示空态 |
| 3 | trpc/index.vue:173 校验失败仍前进 | **1 failed** \| 7 passed | 校验不通过应停留 |
| 4 | trpc/index.vue:233 创建失败仍置 SUCCESS | **1 failed** \| 7 passed | 创建失败应展示失败态 |

**结论**：4/4 变异被捕获，每个变异只打挂一条对应用例，指向精确、无误伤。

## 7. 推广结论

**通过（88/100，无阻塞）。** 新沉淀一条 mock 边界规律：**全局注册组件（`RouterView` 等，由 `app.use` 注入）不走模块解析，`vi.mock` 换不掉，必须在 render 的 `global.components` 注册桩**；带 `v-slot` 的桩必须回传插槽参数。适用于所有含路由容器页的场景。

## 8. 遗留项

**真缺口**：

- **P2**：TAF / Agones / Helm 三个模板向导实体（与 tRPC 同构）。
- **P2**：param-config / app-config 子件的表单校验规则（名称边界、恶意输入）。
- **N/A（C 行为未定）**：重复提交拦截、取消时的脏离开确认——已登记 `ai_unsure.md` 待业务确认后再补断言。

**其他**：PILOT_S1 §4 文档性验收待人工执行。
