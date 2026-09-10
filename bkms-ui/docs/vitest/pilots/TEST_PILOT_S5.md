# S5 试点实践记录：动态输入项

> 定位：动态输入项（`src/components/dynamic-input.vue`）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S5.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue `Input` / `Radio` / `Select` | **真实渲染** | 输入形态（textarea / number / 单选 / 下拉）与禁用态都是用户可感知行为 |
| `KeyValue`（MAP 类型依赖） | 未覆盖 | 动态键值表格属子组件交互，另计（见 backlog） |
| `v-model` | Harness 包装组件承载 | 需断言回传值，包装组件记录 `onUpdate:modelValue` |

## 2. 迭代记录（4 轮到全绿）

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 4/5 | INT 用例断言 `getByRole('spinbutton')` 找不到：bkui-vue 数字输入框未暴露该 role | 改为行为断言 |
| 2 | 5/5 | — | — |
| 3 | 4/5 | 变异验证（类型分发失效）暴露 INT 用例是**弱断言**：`Number('12') === 12` 对字符串也成立，捕获不到类型降级 | 收紧为 `toBe(12)` |
| 4 | 4/5 | 源码现状是**回传字符串 `'12'` 而非数字**（`v-model.trim` + bkui-vue number input），严格数值断言不成立 | 改为「数字输入形态」断言（`toHaveAttribute('type','number')`）+ 字符串回传；数据类型契约是否需调整待业务确认 |

## 3. 可复用模式

1. **变异验证是断言强度的试金石**：全绿 ≠ 断言有效。本场景全绿后，靠「类型分发失效」变异才发现 INT 用例形同虚设——**每个场景必须做变异验证**，且变异要针对「类型/分支判断」而不只是「是否调用」。
2. **回传类断言要掐准类型**：`Number(x)` 之类的宽松转换会掩盖类型问题；要么严格 `toBe`，要么改断言用户可感知的形态属性（`type="number"`）。
3. **模板内变异标记**：HTML 注释 `<!-- MUTATION-N -->` 可用；JS 注释 `// xxx` 写在模板属性间会导致编译失败（S6 已踩）。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（5/5），约 250ms
- [x] 路径清单 V：台账预估 3 → 摸底校准 5（补数字形态、文本域、禁用态）
- [x] 规范逐条符合
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/dynamic-input.test.ts` | 新增，5 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S5.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S5.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S5 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
