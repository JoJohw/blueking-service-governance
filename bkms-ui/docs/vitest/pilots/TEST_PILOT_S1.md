# S1 试点实践记录：创建应用向导

> 定位：创建应用向导容器页（`create.vue`）+ 模板选择页（`template/index.vue`）+ tRPC 模板向导（`template/trpc/index.vue`）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S1.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| create.vue（容器） | 真实渲染 + MsHeader/RouterView 桩 | 步骤条按 route.name 取 `STEPS_CONFIG`（create.vue:69-73、100-103），是本场景的路由级分支 |
| template/index.vue | 真实渲染 | 模板卡片单选、搜索过滤（本地 computed，无接口）均为用户可感知行为 |
| trpc/index.vue（向导） | 真实渲染 + 两个表单子件契约 stub | 步骤流转（2→3→4）、校验拦截、创建成败是核心判定 |
| `param-config.vue` | 契约 stub（`validate` 异步 boolean / `getValue` 同步对象 / `getAppIDAutoSuffix` 异步，param-config.vue:390/527/589） | 子件内为重型构建参数表单，非本场景判定点 |
| `app-config.vue` | 契约 stub（`getValue` 同步对象 / `validate` 异步 boolean / `resetStatus` 同步，app-config.vue:170/194/201） | 子件内为 monaco + 命令参数表单 |
| `result.vue` | 真实渲染 | 成功/失败两态文案与入口按钮是本场景断言目标 |
| `ApiServerService` | 逐方法 mock | 断言创建请求与成败分支 |
| `vue-router` | 共享 `createRouterMock` + 覆写 `useRoute`（按用例切 route.name）；RouterView 走全局组件注册桩 | 见 §2 坑 1 |

## 2. 关键踩坑（已回写 PILOT_LOG）

1. **`<RouterView>` 是全局注册组件，`vi.mock('vue-router')` 换不掉**：模板经 `resolveComponent` 解析，模块 mock 不生效；必须在 render 的 `global.components` 注册桩。且 `create.vue` 用 `<RouterView v-slot="{ Component }">`，桩**必须回传插槽参数**（否则解构 undefined 直接崩渲染）。
2. `input[type=search]` 的 ARIA role 是 `searchbox`，不是 `textbox`。
3. 结果页 `$t('{name} 应用创建成功', name)` 在直译 mock 下保留 `{name}` 占位 → 断言用正则而非整句。
4. 向导 `step` 是父容器持有的 props，子组件 `emits('next')` 不会自行推进 → 用 harness 复现状态流转（与 S12 同口径）。

## 3. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 5/8 | RouterView 桩未回传 `v-slot` 参数；搜索框 role 写错 | 桩回传 `{ Component: 占位组件 }`；`getByRole('searchbox')` |
| 2 | 6/8 | 模块级 mock 对全局注册组件无效 | 改在 render 的 `global.components` 注册 RouterView 桩 |
| 3 | 8/8 | — | 全绿 |

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（8/8），连跑 3 次稳定（约 4.4~5.6s/次）
- [x] V = 8（台账预估 4~5，摸底校准：步骤条 2 + 模板选择 2 + tRPC 向导 4）
- [x] 变异验证 4/4 捕获，每变异仅命中 1 条对应用例（见评审 §6）
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/create-application.test.ts` | 新增，8 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S1.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S1.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S1 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |

## 6. 遗留项

- **P2**：其余模板分支（TAF / Agones / Helm）的向导实体——本轮只覆盖 tRPC 向导与 Helm 步骤配置，其余按同构模式补。
- **P2**：重复提交拦截（创建中按钮禁用）、取消时的脏离开确认（confirmBox）——属业务规则未定，待确认后再补断言。
- **P2**：参数配置/应用配置子件的表单校验规则（名称长度与字符集边界、恶意输入）——子件已 stub，需独立场景或放开 stub 后补。
