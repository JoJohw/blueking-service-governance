# S2 试点实践记录：提交部署 / 部署管理

> 定位：部署管理（`src/pages/application/detail/deploy/deploy.vue`）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S2.md`。

## 1. 被测对象与 mock 边界

页面为部署总览容器（TabHeader + 环境选择 + 部署入口 + 三个 Tab 子页）。本轮聚焦**部署入口的权限分发**：`canManageFeatureEnvs = isAppModelAppType(appType)`（trpc/taf 才展示「应用关联的特性环境」入口）。

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue（TabHeader/Button/Popover） | 真实渲染 | 入口显隐是核心可感知行为 |
| 子页（overview / deploy-history / quickly-deploy / full-update） | stub 为标记文本 | 各自体量大，单独立项 |
| `~/api/modules/v1`、`~/api/modules/bkmsserver` | Proxy 通用 stub | 依赖面广 |
| pinia | `createPinia()` | 页面使用未被 mock 的 store |
| vxe | `installVxeShims()` | 实例列表等表格 |

## 2. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 0/2 | `HTMLDocument is not defined`（页面含 vxe）；重型页面超时 | 引入 `installVxeShims()` + 放宽超时至 20s |
| 2 | **2/2** | — | 连跑稳定 |

## 3. 已知噪音（待处理）

页面仍有 4 个接口发出**真实请求**（`apps/{appID}/deploy-stat`、`/envs`、`/deploy-statuses`），说明它们未经已 mock 的 api 模块（可能走 `use-deploy.ts` 的其它导入路径）。当前被分类器归为「预期」不失败，但应定位并补全 mock。已登记 backlog。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（2/2）
- [x] V = 2（模型类展示入口 / 非模型类不展示）；「点击部署走 precheck 与提交」依赖 precheck 流程，见 backlog
- [x] 变异验证 2/2 捕获
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/deploy-management.test.ts` | 新增，2 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S2.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S2.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S2 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
