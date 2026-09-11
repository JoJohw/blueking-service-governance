# S19 试点实践记录：RepoRefSelect Input 路径

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：RepoRefSelect（`src/components/repo-ref-select/repo-ref-select.vue`）流水线手动输入路径的场景级测试实践。滚动记录见 `../../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S19.md`。

## 1. 被测对象与 mock 边界

被测核心是 **Input 路径的 trim 同步与防抖确认**：无 `repositoryId` 时降级为手动输入；输入立即 trim 同步 `update:modelValue`；仅 trim 后相对当前绑定值实际变化时，防抖结束后 `emit('branchCommit')`；空串不确认。

| 层 | 处理方式 | 理由 |
|---|---|---|
| `useRepoRefSelect` | stub（8 字段与真实 return 对齐，`ref([])`） | 本场景不测下拉拉数 |
| `bkui-vue` Input/Select/Button | `test/stubs/bkui-vue-lite.ts`（`data-testid`） | 聚焦 trim/防抖语义，避免组件库内部实现耦合 |
| `vue-i18n` | 共享 `mock-i18n` | 文案不在测试范围 |
| 渲染工具 | `@vue/test-utils` + fake timers | 需断言 emit 时序；防抖用 `advanceTimersByTimeAsync(1000)`（源码 500ms 的 2 倍，避免边界等值耦合） |

## 2. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | PR 评审 Request Changes（82/100） | B1 未立项、B2 目录违规、M1/M2 | 台账补 S19；移入 `test/scenarios/`；定时器 1000ms；改 `data-testid`；unmount + `ref()` |
| 2 | **4/4** | — | 连跑 3 次稳定；变异 2/2 捕获 |

## 3. 可复用模式

1. **防抖断言勿与常量边界等值**：`advanceTimersByTimeAsync(debounceMs * 2)`，注释标明源码常量，避免实现改 400/600ms 时用例错位。
2. **轻量 UI stub 用 `data-testid`**：自建 Input stub 也按条款 4 用 testid，不用 CSS 类。
3. **VTU 场景须显式 `unmount`**：全局 cleanup 只管 Testing Library；VTU 需在 `afterEach` unmount，才能跑到 `onBeforeUnmount` 的 debounce.cancel。

## 4. 验收结果（对照指南 §4.2）

- [x] 路径清单与台账 S19 卡一致（V = 4）
- [x] 用例全绿（4/4），连跑 3 次稳定
- [x] 单文件 tests 段约 100~130ms（远低于 10s）
- [x] 变异验证 2/2 捕获（见 REVIEW_S19）
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/repo-ref-select.test.ts` | 新增（自 `test/` 根迁入并整改） |
| `test/stubs/bkui-vue-lite.ts` | 轻量 bkui stub（`data-testid`） |
| `docs/vitest/pilots/TEST_PILOT_S19.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S19.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S19 卡 + 枚举行 |
| `docs/vitest/guides/TEST_GUIDELINE.md` | 条款 7 登记 `test/stubs/` |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
