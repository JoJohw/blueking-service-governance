# S6 试点实践记录：删除二次确认

> 定位：删除二次确认（`src/components/delete-comfirm.vue`）的场景级测试实践，供后续组件级场景复用。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S6.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue `Dialog` / `Button` | **真实渲染** | 沿用 S12 验证过的链路；弹窗显隐与按钮态是核心可感知行为 |
| `vue-i18n` | partial mock（直译） | 文案不在测试范围 |
| `v-model:isShow` | Harness 包装组件承载 | RTL 的 `render` 拿不到组件实例，需包装组件持有 ref 并回写 `onUpdate:isShow` |

## 2. 迭代记录（2 轮到全绿）

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 1/4 | `Found multiple elements with role button and name 确定/取消`：未做 `afterEach(cleanup)`，前一用例的弹窗 DOM 残留 | 引入 `cleanup` 并在 `afterEach` 调用（后续所有渲染型场景必备） |
| 2 | **4/4** | — | — |

## 3. 可复用模式

1. **`defineModel` 组件的 Harness**：包装组件内 `ref` 持有显隐状态，`'onUpdate:isShow': v => (isShow.value = v)` 回写，才能测到「取消关闭」这类由子组件发起的变更。
2. **命令式组件的边界断言**：本组件只 `emit('confirm')`、不自行关闭（避免父组件删除失败时弹窗已消失）——用例必须断言「点击确定后弹窗仍在」，否则该设计决策无保护。
3. **变异注入注意**：Vue 模板属性之间**不能写 JS 注释**（`// xxx` 会导致模板编译失败，表现为 Failed Suites 而非断言失败）；变异标记写进 script 或干脆不写。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（4/4），耗时约 200ms
- [x] 路径清单 V：台账预估 2（确认/取消）→ 摸底校准 4（+ 展示内容、+ 删除进行中禁用取消）
- [x] 规范逐条符合（条款 7：正向确认 + 反向取消 + 边界 loading）
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/delete-confirm.test.ts` | 新增，4 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S6.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S6.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S6 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
