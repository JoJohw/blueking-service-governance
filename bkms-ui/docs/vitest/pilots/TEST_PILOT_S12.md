# S12 试点实践记录：组件新建/编辑向导

> 定位：第一个场景级测试（S12）的**完整实践过程**——依赖选型依据、实现模板、踩坑记录与验收结果，供后续场景（S3/S13 等）直接复用。滚动式问题记录见 `../guides/TEST_PILOT_LOG.md`，独立评审记录见 `../reviews/TEST_REVIEW_S12.md`。场景级用例统一放在 `test/scenarios/`（一个场景族一个文件，文件名不带 S 编号，编号映射见台账）。
>
> 试点选定理由（业务负责人指定）：① 业务负责人即开发者，期望行为可快速人工校准，试点结论判定成本低；② 技术风险覆盖面完整：双模式 × 双步骤 × 三级校验链 × 脏检查离开确认 × 可引用变量面板，bkui-vue 渲染链、testing-library、userEvent、vi.mock、多态断言全部覆盖；③ 其写法可反哺 S3/S13。

## 1. 新增依赖（为什么要引入）

本次 PR 属于纯测试基础设施改动，零业务代码变更，不影响生产运行时（三个包均为 devDependencies，仅 `pnpm test:unit` 使用，不进构建产物）。

| 包 | 版本 | 用途 | 为什么必须有 |
|---|---|---|---|
| `@testing-library/vue` | ^8.1.0 | 以**用户视角**渲染组件：`render()` 挂载真实 DOM，`screen.getByRole/getByText/findBy*` 查询 | 已有 `@vue/test-utils` 是开发者视角（`wrapper.vm` 直达内部状态），容易诱导断言实现细节；testing-library 从机制上禁止摸内部状态，是指南 §3 条款 3/4 的落地工具。其内部即封装 test-utils 的 mount，二者不冲突 |
| `@testing-library/user-event` | ^14.6.7 | 模拟真实用户交互，完整走浏览器事件链（focus → keydown → input → change → blur） | `trigger('click')` 不产生焦点转移，而 S12 的组件 ID 校验是 **blur 触发**——没有它，"输入非法值 → 校验提示"这条真实路径根本测不到 |
| `@testing-library/jest-dom` | ^6.10.0 | 语义化 DOM 断言：`toBeDisabled()` / `toHaveTextContent()` / `toBeChecked()` 等 | 原生断言只能 `html().toContain('disabled')`，脆弱且不可读；注册一次（`test/setup.ts`）全项目共享 |

**版本选型依据**：

- `@testing-library/jest-dom` 取 **v6 而非 v7**：v7 的 peer 要求 `@testing-library/dom >=10`，而 TL/vue 8 依赖 dom 9.3.4；实测 v6 匹配器功能完整，peer 偏差最小。
- jsdom 维持 **^26.1.0**：jsdom 27+ 要求 Node 22+，与仓库 Node ≥18 基线冲突（CR 结论），故不升级。
- Node 版本：仓库无 `.nvmrc`/`engines` 声明，构建镜像为 `node:23-alpine`（Dockerfile）；本地实测 **Node 20.20.2 + pnpm 10.33.4** 全部用例通过（满足 jsdom 26 的 `>=18`）。

## 2. 被测对象与 mock 边界

被测：`src/pages/marketplace/component-management.vue`（531 行）。

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue 组件（Sideslider/Form/Input/Radio/Button） | **真实渲染** | 本试点的核心验证目标：bkui-vue 渲染链在 jsdom 下可用（此前仅 alias 修复了加载链，无渲染先例） |
| bkui-vue 命令式 API（`Message`/`InfoBox`） | partial mock | 断言调用参数比查 toast DOM 稳定；`InfoBox` 可控触发 onConfirm/onCancel |
| `ComponentDefsService`（api/v1） | 精确 mock 4 个方法 | 隔离请求层 |
| `useSpaceStore` | 模块级 mock | 隔离 store 链 |
| 输入/输出模板、RefVarPanel、PatchPreviewCard、ResourceCard | stub（保留契约方法 + 插槽透传） | params-table 依赖 `@blueking/ediatable` 渲染链，留待二阶段单独验证 |
| CollapsibleAsideLayout / ToggleCard | stub（保留 main/aside 插槽与 isCollapsed 显隐契约） | 断言面板开合的 DOM 依据 |
| vue-i18n | partial mock（`useI18n` 直译 + `$t` 直译插件） | i18n 不在测试范围 |

**可复用模式**（后续场景直接抄）：

1. **Harness 驱动**：被测组件通过 `defineExpose({ open, close })` 暴露命令式入口，用包装组件捕获并转存到模块级变量，再驱动弹层（`render()` 拿不到 vm）。
2. **`vi.hoisted`**：所有需要在 `vi.mock` 工厂中引用的可变 mock（函数/动态返回值）放进 `vi.hoisted`。
3. **异步等待**：`findBy*` 等待渲染、`waitFor` 等待副作用，禁止固定 sleep（仅快照时序处用了一次 20ms 兜底，见踩坑 3）。

## 3. 迭代记录（4 轮到全绿）

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 13/18 | ① 断言参数不匹配：`previewComponentDef(payload, { needRes: true })` 是两参调用，`toHaveBeenCalledWith` 要求全参；② 编辑模式 name 输入框 disabled，`fillName` 抛错 | 参数断言补第二参；`gotoStep2` 按 mode 跳过填写 |
| 2 | 15/18 | ① 空值校验文案非自定义 message（bkui-vue 依次执行 required 与 rules，展示末条格式提示）；② D9/D11 断言写错：提交失败停在步骤 2，弹层内没有"试运行"按钮 | 文案断言改为三选一正则 + waitFor；改断言"上一步"按钮仍在 |
| 3 | 17/18 | 空值文案仍未匹配：`bk-form-error` 内是**裸文本节点**且内容为"以字母开头…"（DOM dump 证实） | 正则补全三种文案 |
| 4 | **18/18** | — | — |
| 5 | **19/19** | 评审前置：确认业务 error 约定（HTTP 错误由 fetch interceptor 统一反馈，业务层仅成功/特殊场景手写 Message）后，按现状行为补「试运行接口失败」用例（不停留预览、按钮恢复可用、不断言组件级提示） | 记入 Memory 与 PILOT_LOG |
| 6 | 21 通过 | 独立评审（82/100）+ 第 2 轮复审（91/100）采纳项落地：M1/M2 用例、断言补强、指南条款 4 白名单、stub 契约修正（input async / output sync，写 stub 前先读真实 defineExpose 契约） | 模板要点见 §7 |
| 7 | **21/21** | 复审 Medium「M1 消极断言首检即过」修复：校验方法改为可观察 `vi.fn`，消极断言前先 `waitFor(isValid 被消费)`（校验失败无 DOM 信号，stub 消费点是唯一可靠完成信号）；注意 `validateForm` 无条件调用两侧 isValid，多分支用 `mockClear` 独立计数 | 消极断言标准写法定型，供 S3/S13 复用 |

## 7. 消极断言标准写法（S3/S13 直接复用）

```ts
// 错误写法：waitFor(未被调用) 首检即过，回归 bug 晚到的调用会漏报
await waitFor(() => expect(mock.someFn).not.toHaveBeenCalled());
// 标准写法：先等「校验/处理逻辑已真实消费」的正向信号（stub 可观察调用），
// 再断言未被调用——此后 waitFor 轮询可捕获任何晚到的调用
await waitFor(() => expect(mock.guardFn).toHaveBeenCalledTimes(1));
await waitFor(() => expect(mock.someFn).not.toHaveBeenCalled());
```

要点：① 被等待的 guard 必须是真实消费点（vi.fn 暴露的校验/处理方法）；② 多分支场景各分支 `mockClear` 后独立计数；③ 若 UI 有正向信号（提示/状态变化）优先等 UI 信号。

## 4. 发现的问题（非测试问题）

1. **bkui-vue FormItem 字段级校验存在 unhandled rejection**（required / rules blur 的 promise reject 无 catch）。真实浏览器控制台同样会出现，属组件库缺陷。临时兜底：`vite.config.mts` 开启 `dangerouslyIgnoreUnhandledErrors`（已注释原因与移除条件）。**建议向组件库反馈，升级后应移除该开关**。
2. **`deploy-env-store.test.ts` 3 条失败**：`pnpm install` 使 node_modules 与 lockfile 对齐后暴露的**既有问题**——`src/stores/space.ts:42` 在 pinia store setup 内调用 `useI18n()`，vue-i18n@11.1.12 会抛 "Must be called at the top of a `setup` function"。lockfile 中 vue-i18n 版本无漂移（git diff 证实），与本次改动无因果关系。处理建议（需单独决策）：调整 `space.ts` 的 i18n 用法，或 pin vue-i18n 旧版本。

## 5. 验收结果（对照指南 §4.2）

- [x] 三件套安装完成；S12 用例全绿；连跑 3 次稳定无 flaky（`18 passed` × 3，Duration 7.5~7.9s，纯测试 3.4~3.8s）
- [x] 路径清单先行审批（V=15 → 16 条 it / it.each 展开 18 个测试），用例与清单一一对应
- [x] 指南 §3 规范 8 条逐条符合（业务语言标题 / role·text 查询 / userEvent / vi.mock 隔离 / 正反+边界 / 推断标注）
- [x] 单场景耗时 < 10s
- [ ] 文档性验收：用例标题清单交一位不熟悉该模块的同事阅读复述（待人工执行）
- [x] 连带覆盖说明：创建流程子组件随 S1/S18、删除应用弹窗随 S6 的归并策略在试点中未出现反例

## 6. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/component-management.test.ts` | 新增，21 个测试（6 组场景，含评审采纳项 M1/M2 与断言补强） |
| `test/setup.ts` | 注册 jest-dom 匹配器（一行） |
| `vite.config.mts` | `dangerouslyIgnoreUnhandledErrors: true`（含移除条件注释） |
| `package.json` / `pnpm-lock.yaml` | +3 devDependencies |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 问题与小结回写 |
