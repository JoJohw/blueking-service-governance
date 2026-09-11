# S18 试点实践记录：构建管理

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：构建管理（`src/pages/application/detail/app-build/build-management.vue`）的场景级测试实践。滚动记录见 `../../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S18.md`。

## 1. 被测对象与 mock 边界

被测核心是**构建入口的判定与弹层**：镜像来源为镜像仓库时禁用「执行构建」，否则点击弹出「执行配置」（代码分支/版本号）。

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue（Button/Skeleton/Popover/Form） | 真实渲染 | 禁用态与弹层是核心可感知行为 |
| `RepoRefSelect` | stub | 依赖代码仓库外部接口 |
| `BuildsService` / `BkintegrationsBkciService` / `ApiServerService` | **Proxy 通用 stub** | 页面依赖接口多，逐个猜方法名成本高；Proxy 让任意方法返回 resolved |
| pinia | `createPinia()` 安装 | 页面使用未被 mock 的其它 store |
| vxe | `installVxeShims()`（helpers） | 页面含构建历史表格 |

## 2. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 0/3 | `No "BkintegrationsBkciService" export is defined`：依赖接口未 mock | 改用 Proxy 通用 service stub |
| 2 | 0/3 | `getActivePinia()` 无 active Pinia；重型列表页超时 | 安装 `createPinia()`；引入 `installVxeShims()` 并放宽超时 |
| 3 | 3/3 | — | 但出现 `Failed to parse URL`：页面经 `use-recommend-tag` 发真实请求 |
| 4 | **3/3** | 补 `ApiServerService` mock，噪音消除 | 连跑 3 次稳定（约 6.5s/次） |

## 3. 可复用模式

1. **Proxy 通用 service stub**：依赖面广的页面不必逐个 mock 方法——
   `new Proxy({}, { get: () => vi.fn().mockResolvedValue({ list: [], total: 0 }) })`。
2. **页面用了未被 mock 的 store 时**：直接 `createPinia()` 装真实 pinia，比逐个 mock store 省事。
3. **警惕「真实请求」噪音**：出现 `Failed to parse URL` 说明有接口未 mock，应补 mock 而不是放过——
   这类错误栈在 Node 内部，分类器会把它归为「预期」，容易掩盖 mock 不全。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（3/3），连跑 3 次稳定
- [x] V = 3（镜像仓库禁用 / 代码仓库可用 / 点击弹出执行配置）
- [x] 变异验证 2/2 捕获
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/build-management.test.ts` | 新增，3 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S18.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S18.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S18 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
