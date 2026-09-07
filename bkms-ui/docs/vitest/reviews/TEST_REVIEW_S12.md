# S12 测试用例独立评审记录

> 定位：S12 场景级测试用例（`test/scenarios/component-management.test.ts`）的独立质量评审记录，共三轮闭环（初评 → 复审 → 终审）+ 一轮变异验证（§6），与实施记录 `../pilots/TEST_PILOT_S12.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维评分 + 结论门禁），评审基准见 §1。评审约定：HTTP 错误由 fetch interceptor 统一拦截并反馈，业务层一般不手写 catch + Message——「试运行接口失败」类用例断言现状行为，不计为缺失提示。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/component-management.test.ts`（终审时 21 个测试） |
| 被测源码 | `src/pages/marketplace/component-management.vue`（531 行） |
| 评审模式 | 完整评审（需求基准 = S12 场景卡 + 被测源码 + 业务约定，含需求/Scenario/Case 追溯） |
| 评审基准 | S12 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 九条规范 |
| 评分方法 | QA Skill-Suite 六维模型（完整性 30 / 准确性 25 / 有效性 15 / 可执行性 10 / 规范性 10 / 可维护性 10），每项发现指定唯一主扣分维度 |

## 2. 评审时间线

| 轮次 | 得分 | 门禁结论 | 关键发现 |
|---|---|---|---|
| 第 1 轮（初评） | 82/100 | 通过 | P1 缺失 ×2：M1 子模板校验失败拦截分支（三级校验链后两级，无用例置 false）、M2 离开确认 onConfirm 分支（状态迁移缺最后一条边）；Medium 断言补强 ×3（编辑成功缺「弹层关闭」对称断言、边界用例末段纯消极收尾、`scopeWorkspaceIDs` 空间隔离值未断言）；规范性：查询 API 超出指南条款 4 字面白名单（系统性，建议回写）；稳定性债务：`vite.config.mts` 兜底注释与用例实际依赖不对齐 |
| 第 2 轮（复审） | 91/100 | 通过 | 上轮全部采纳项逐条核实关闭；**额外核实 stub 契约修正**：output 模板真实 `isValid()` 为同步返回 boolean（`component-output-template.vue:195`），stub 误写 `Promise.resolve()` 时 Promise 恒 truthy，output 校验分支根本不可测——修正顺序正确；新发现 Medium：M1 用例「先等 loading 恢复」完成信号不成立（校验失败路径在置 loading 前已 return，按钮从未进 loading），消极断言存在首检即过漏报窗口 |
| 第 3 轮（终审） | 92/100 | **放行** | M1 修复核实：isValid 改为可观察 `vi.fn`，消极断言前先等「校验方法被真实消费」（契约注释引用真实源码行号：input async `component-input-template.vue:172` / output sync `:195`）；实测 21/21 全绿 7.84s；10 个 unhandled errors 均属已知兜底范畴，非新缺陷 |

## 3. 终审六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 26 | 30 | 双模式回显 / 三级校验链（表单 + 输入 + 输出）/ 试运行三态 / 提交 2×2（模式 × 成败）/ 离开确认四分支（含 onConfirm）/ 面板开合全覆盖；backlog：M3 loading 重复提交（推断/需确认）、M4 编辑 × 脏检查组合态、P3 批量（见 §7） |
| 准确性 | 24 | 25 | 全部断言与源码逐条核实一致（含 `scopeWorkspaceIDs` 空间隔离值）；空值文案三选一正则弱断言 -1（bkui-vue required 与 rules 依次执行、展示末条文案的内部行为，依据已在 PILOT_LOG 留档） |
| 有效性 | 14 | 15 | 反向断言充分（不调接口 / 按钮不出现 / refresh 不触发）；M1 修复后残余理论性 microtask 排布窗口 -1（Low，常规路径必被 click-await flush 或 waitFor 轮询捕获，不阻塞） |
| 可执行性 | 9 | 10 | mock 状态重置无跨用例泄漏（beforeEach/afterEach 闭环）；20ms 快照等待为全文件唯一固定 sleep（有注释说明，实测连跑稳定） |
| 规范性 | 10 | 10 | 指南条款 4 白名单已回写，系统性偏差消除；推断项未擅自固化断言（M3 留待业务确认） |
| 可维护性 | 9 | 10 | Harness / vi.hoisted / 契约 stub 三模式结构清晰；边界四点合一条 it -1（Low） |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| P1 | M1 子模板校验失败拦截试运行（inputValid / outputValid 两个分支） | ✅ 已补用例 |
| P1 | M2 离开确认 onConfirm 分支（确认离开 → 关闭弹层且不刷新列表） | ✅ 已补用例 |
| Medium | 编辑成功用例补「弹层关闭」断言（与新建成功对称） | ✅ |
| Medium | 边界用例 21 位末段补「提交按钮不出现」正向断言 | ✅ |
| Medium | `scopeWorkspaceIDs` 空间隔离断言（新建 `['ws-under-test']` / 编辑 `[]`） | ✅ |
| Medium | 指南条款 4 白名单回写（`getByPlaceholderText` / `getByDisplayValue` / `getByTestId` 仅限 stub） | ✅ 已回写 |
| Medium | M1 消极断言完成信号（isValid 可观察 `vi.fn` + 先等消费信号再消极断言） | ✅ 终审核实关闭 |
| Low | `vite.config.mts` 兜底注释补充 preview rejection 依赖与移除条件 | ✅ |
| Low | stub 非响应式返回值限制留档（面板用例依赖「挂载前赋值」） | ✅ |
| Low | stub 契约注释引用真实 defineExpose 源码行号 + 核对 async/sync 差异 | ✅ |
| Low | 空值文案三选一正则的决策依据固化 | ✅ 注释已说明 |
| Low | 格式重排类（it 主语 / 边界四点拆分 / 旧用例 waitFor 顺序） | ⏸ 按「黄金法则不为格式买单」砍掉（PILOT_LOG 有记录） |
| Low | 20ms sleep 防回归护栏 | ⏸ 维持现状（有注释，实测稳定） |

## 5. 运行实证（终审）

- `vitest run test/scenarios/component-management.test.ts`：**21 passed (21)，Duration 7.84s（tests 4.02s）**，满足指南 §4.2「单场景 < 10s」。
- 10 个 unhandled errors 全部为已知兜底范畴：9 个 bkui-vue FormItem 校验 reject（组件库已知缺陷，`vite.config.mts` 开关注释有说明）+ 1 个 preview mock rejection（`vite.config.mts` 注释已覆盖该用例依赖），均被 `dangerouslyIgnoreUnhandledErrors` 兜住，与 `../guides/TEST_PILOT_LOG.md` 记录一致，非本套用例缺陷。

## 6. 有效性实证（变异测试）

> 终审通过后追加：向业务源码 `src/pages/marketplace/component-management.vue` 注入 4 个模拟回归（变异），验证测试保护网真实有效。验证全程仅改动业务源码，完成后已 `git restore` 撤回全部变异并复跑确认 21/21 恢复全绿，业务代码与 HEAD 一致。

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | 编辑模式名称回显失效（`name: componentData.name \|\| ''` → `''`） | **3 failed** \| 18 passed | A2 编辑回显（`toHaveValue('exist-comp')` 失败）+ D3/D4 编辑提交级联（名称为空导致校验拦截进不了步骤 2） |
| 2 | 三级校验链退化：`validateForm` 忽略子模板校验结果（`return !!valid`） | **1 failed** \| 20 passed | **精确命中** M1 用例「当输入或输出模板校验失败时，试运行应被拦截且不调用预览接口」——preview 被错误放行（`spy` 实际被调用 1 次） |
| 3 | 空间隔离参数丢失（`scopeWorkspaceIDs` 恒传 `[]`） | **1 failed** \| 20 passed | **精确命中** D1 新建提交的参数断言；编辑用例不受影响（编辑模式本就传 `[]`），无误报 |
| 4 | 离开确认失效（`handleBeforeClose` 恒返回 `true`） | **3 failed** \| 18 passed | E 组三个依赖确认弹窗的用例（`infoBox` 期望 1 次、实际 0 次）；「未修改直接关闭」用例正确地仍通过（该行为变异后不变） |

**结论**：

1. **4/4 变异全部被捕获**，回归保护网真实有效；
2. 评审过程争议最大的两处补强（M1 子模板校验用例、`scopeWorkspaceIDs` 空间隔离断言）均实证「没有它们此类回归会静默上线」——变异 2/3 若无对应用例则 21/21 全绿放行；
3. 失败精确度高：每个变异只打挂对应保护网的用例（变异 2/3 各仅 1 failed），说明用例间耦合低、断言指向明确，非「一坏全红」的虚假保护。

## 7. 推广结论

**通过（92/100，无阻塞问题），S12 正式作为试点样板向 S3/S13 推广。推广前必关项已清零；测试有效性另经变异测试实证（§6，4/4 变异全部被捕获）。**

随样板一起复用的两个固化模式：

1. **消极断言必须有完成信号**：标准写法见 `../pilots/TEST_PILOT_S12.md` §7——先等真实消费点（可观察 `vi.fn` 调用计数）或正向 UI 信号，再断言未被调用；多分支各 `mockClear` 独立计数。
2. **stub 契约注释必须引用真实 defineExpose 源码行号**，并核对同步/异步差异（input async / output sync 的教训见 PILOT_LOG 2026-09-07 S12 行）。

## 8. 遗留 backlog（不阻塞推广，按台账跟踪）

- **M3** loading/重复提交拦截：先按指南 §3 条款 8 完成「推断/需确认」业务确认，再固化断言（源码依据：`component-management.vue` 试运行/提交/取消按钮的 `:loading` / `:disabled` 绑定）。
- **M4** 编辑模式 × 脏检查组合态：编辑模式下修改描述后取消应弹确认（现有 E 组用例仅新建模式）。
- **P3**：试运行结果空态（`patchPreview/resources` 为空）、emoji/超长/HTML 注入样例、`'-ab'` 中划线开头、`getComponentDefsBuiltinVars` 失败兜底。
- PILOT_S12 §5「文档性验收」人工项待执行。
