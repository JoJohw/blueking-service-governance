# S19 测试用例独立评审记录

> 定位：S19（`test/scenarios/repo-ref-select.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S19.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。初评见 `repo-ref-select-REVIEW.md`（Request Changes 82/100），本文件为整改后终审。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/repo-ref-select.test.ts`（4 个测试） |
| 被测源码 | `src/components/repo-ref-select/repo-ref-select.vue`（Input 路径 trim / 防抖） |
| 评审基准 | S19 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评（`repo-ref-select-REVIEW.md`） | 82/100 | Request Changes | B1 未立项、B2 目录违规、M1 定时器边界耦合、M2 CSS 类查询 |
| 终审（整改后） | 90/100 | 通过 | 阻塞项关闭；变异 2/2；连跑 3 次稳定 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 24 | 30 | Input 四路径覆盖；下拉 Select 路径待补（P2）-6 |
| 准确性 | 24 | 25 | stub 8 字段对齐真实 hook；防抖推进 2× 避免边界耦合；VTU emit 断言与条款 5「用户可见」略有张力 -1 |
| 有效性 | 15 | 15 | 变异 2/2 捕获，各打挂对应用例 |
| 可执行性 | 10 | 10 | 连跑 3 次稳定；tests 段约 115~127ms |
| 规范性 | 9 | 10 | 条款 1/3/4/7/11 已对齐；仍用 VTU 而非 user-event（组件 emit 契约测法合理）-1 |
| 可维护性 | 8 | 10 | lite stub + fake timers 清晰；全局 bkui alias 与文件级 mock 并存需注释说明 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Blocking | B1 场景未立项 / §4.2 未走 | ✅ 台账 S19 + pilot/review + 变异/连跑 |
| Blocking | B2 目录在 `test/` 根 | ✅ 迁入 `test/scenarios/` |
| Medium | M1 `advanceTimersByTimeAsync(500)` 边界耦合 | ✅ 改 1000ms + 注释 |
| Medium | M2 CSS 类查询 | ✅ `data-testid="repo-ref-input-stub"` |
| Low | mount 后未 unmount | ✅ `afterEach` unmount |
| Low | `groups: { value: [] }` | ✅ 改 `ref([])` |
| Low | `test/stubs/` 未登记条款 7 | ✅ 指南条款 7 补登记 |
| Low | describe `@QG-` 与条款 3 不一致 | ✅ 改「模块：交互主题」 |

## 5. 运行实证

`vitest run test/scenarios/repo-ref-select.test.ts`：**4 passed (4)**，连跑 3 次稳定（Duration 5.0~7.0s，tests 115~127ms）。

## 6. 有效性实证（变异测试）

向 `repo-ref-select.vue` 注入 2 个模拟回归（撤回均用编辑还原）：

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | `handleInputChange` 去掉 `value.trim()` | **4 failed** \| 0 passed | trim 相关四条均红（首条最直接） |
| 2 | `emitBranchCommit` 去掉空串 `return` | **1 failed** \| 3 passed | 仅空格不应触发分支确认 |

**结论**：2/2 变异被捕获；空串拦截有独立保护。

## 7. 推广结论

**通过（90/100，无阻塞）。** 本场景沉淀了「组件 Input 契约 + fake timers 防抖」测法，以及「防抖推进取 2× 常量、VTU 须显式 unmount」两条可复用注意点。初评阻塞项（立项 + 目录）已关闭。

## 8. 遗留 backlog

- **P2**：Select 下拉路径（`repositoryId` 非空：打开预拉、搜索、分组刷新、选中确认）。
- PILOT_S19 §4 文档性验收待人工执行。
