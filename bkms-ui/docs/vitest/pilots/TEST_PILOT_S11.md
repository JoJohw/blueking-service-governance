# S11 试点实践记录：制品管理

> 定位：制品管理（`src/pages/application/detail/artifact/index.vue`）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S11.md`。

## 1. 被测对象与 mock 边界

被测核心是 index.vue 的**「应用类型 → 视图分发」**：Helm-like 应用（`helm`/`agones`）显示容器镜像 + Helm Chart 双页签；非 Helm-like 直接展示容器镜像。

| 层 | 处理方式 | 理由 |
|---|---|---|
| `TabHeader`（bkui-vue Tab） | 真实渲染 | 页签显隐是核心可感知行为 |
| `container-image.vue` / `helm-chart.vue` | **stub**（标记文本） | 重型子页（表格/上传），其交互留待各自场景覆盖 |
| `useAppDetail`（store） | mock，提供 `appType` | 视图分发依赖应用类型 |
| `vue-router` / `vue-i18n` | mock | 隔离 URL 同步与文案 |

## 2. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 2/3 | 「点击页签切换内容」失败：页签经 `useUrlQuerySync` 与路由 query 双向同步，mock 路由下点击后 URL 不回写，组件不切换 | 移除该用例（jsdom 下非缺陷表现），登记 `ai_unsure.md` 与评审 backlog 待专项处理 |
| 2 | 2/2 | — | 连跑 3 次稳定（约 3s/次） |

## 3. 可复用模式

- **「类型分发型」容器页**的测法：把重型子页 stub 成可断言的标记文本，被测逻辑只剩「按类型决定显示什么」，用例既轻又稳。
- 与列表类场景（stub 表格）思路一致：**把组件库/重子组件的绘制责任剥离，只测页面自身的判定**。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（2/2），连跑 3 次稳定
- [x] V = 2（Helm-like 双页签 / 非 Helm-like 无页签；第 3 条「切换页签」jsdom 下不可行，已登记）
- [x] 变异验证 2/2 捕获
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/artifact-management.test.ts` | 新增，2 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S11.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S11.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S11 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
