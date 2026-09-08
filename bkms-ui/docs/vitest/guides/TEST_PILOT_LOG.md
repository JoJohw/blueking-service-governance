# 试点与实施经验记录（Pilot Log）

> 定位：实施过程中的问题、调整与结论的**运营记录**，与 `TEST_GUIDELINE.md`（章程）、`TEST_SCENARIOS_ROUTES.md`（枚举评估 + 场景台账）分离——保证前两个文件的"指导意见"纯度不受实施过程记录影响。
>
> 记录规则：
> 1. 试点或场景实施中遇到的任何问题（环境、stub、框架限制、用例脆弱等）都记一行；
> 2. 结论若影响指南规范或方案评分，**必须同步回写对应文件**并在「回写」列标注去向；
> 3. 每个场景收尾时补一行"实施小结"（用例数、耗时、是否一次通过）。

## 记录表

| 日期 | 场景编号 | 问题 | 根因 | 结论 / 规避方式 | 回写去向 |
|---|---|---|---|---|---|
| 2026-09-07 | S12 | bkui-vue FormItem 字段级校验（required/rules blur）promise reject 无 catch，产生 unhandled rejection | 组件库内部缺陷，真实浏览器控制台同样出现 | `vite.config.mts` 开启 `dangerouslyIgnoreUnhandledErrors` 兜底；升级 bkui-vue 后应验证并移除 | 建议反馈组件库 |
| 2026-09-07 | S12 | jest-dom v7 peer 要求 `@testing-library/dom >=10`，与 TL/vue 8 的 dom 9.3.4 冲突 | 生态版本错位 | 选用 jest-dom v6（6.10.0），匹配器实测正常 | — |
| 2026-09-07 | S12 | 空值校验的提示文案不是自定义 message"请输入组件ID"，而是 rules 末条"以字母开头…"（裸文本节点） | bkui-vue 依次执行 required 与自定义 rules，展示末条失败文案 | 断言用三选一正则 + `waitFor`（文案异步渲染） | S12 卡已更新 |
| 2026-09-07 | 全局 | `pnpm install` 对齐 lockfile 后，`deploy-env-store.test.ts` 3 条失败：`stores/space.ts:42` 在 pinia store setup 内调用 `useI18n()`，vue-i18n@11.1.12 抛 "Must be called at the top of a setup function" | 既有代码问题被环境对齐暴露（lockfile 无 vue-i18n 版本漂移，与 S12 改动无关） | 待决策：修 `space.ts` i18n 用法 或 pin vue-i18n 旧版本 | 待决策后回写 |
| 2026-09-07 | S12 | 业务确认：HTTP 错误由 fetch interceptor 统一反馈，业务层仅成功/特殊场景手写 Message | 设计约定（非缺陷） | 「试运行接口失败」按现状行为补用例（已入 19 条），已存 Memory | 已记 Memory |
| 2026-09-07 | S12 | 独立用例评审（子 agent 隔离执行）两次启动均被中止（code=10003），评审未产出 | 子 agent 执行环境问题 | **已完成**：新对话中重跑成功，评审报告 82/100 通过、无阻塞问题 | 结论已回写本表与台账 |
| 2026-09-07 | S12 | 第 2 轮复审：91/100 通过；新发现 Medium——M1 用例「先等 loading 恢复」的完成信号不成立（校验失败在置 loading 前已 return，按钮从未进 loading），消极断言存在首检即过漏报窗口 | 校验失败路径无 DOM 可观察信号 | 按复审修法落地：isValid 改为可观察 vi.fn，消极断言前先等「校验方法被消费」（waitFor calledTimes）；修正中又发现 validateForm 无条件调用 outputIsValid，各分支用 mockClear 独立计数 | PILOT_S12 §3 模板要点 |
| 2026-09-07 | S12 | 评审采纳关闭：M1 子模板校验失败（inputValid 分支）、M2 离开确认 onConfirm 分支、断言补强（编辑成功关闭对称 / 边界末段正向 / scopeWorkspaceIDs 空间隔离）、指南条款 4 白名单回写、vite.config 注释补充 | 评审报告 P1/Medium 项，逐条核实属实 | 已实施，21/21 全绿 | 指南条款 4 / vite.config 注释 / 台账 S12 卡 |
| 2026-09-07 | S12 | ~~新发现业务缺陷~~ **更正：业务代码无缺陷**。探针误判源于 stub 契约偏差——output 模板真实 `isValid()` 为同步返回 boolean（component-output-template.vue:195），stub 误写为 `Promise.resolve()`，Promise 对象恒 truthy 造成"拦不住"假象 | stub 契约与真实 defineExpose 不一致 | stub 已按真实契约修正（input async / output sync），outputValid=false 分支断言已恢复（正确拦截），21/21 全绿 | **经验回写**：写 stub 前必须先读真实子组件的 `defineExpose` 契约（同步/异步），见 PILOT_S12 |
| 2026-09-07 | S12 | 评审 Low 项处置：格式重排类（it 主语 / 边界拆分 / waitFor 顺序）按「黄金法则不为格式买单」砍掉；waitFor 先正后负模式在 M1 落地验证（消极断言首检即过陷阱实证） | 性价比权衡 | waitFor 先正后负已写入用例注释作为样板 | PILOT_S12 §3 |
| 2026-09-07 | S12 | 终审（第 3 轮）92/100 放行：M1 修复核实通过（isValid 可观察 vi.fn + 先等消费信号），实测 21/21 全绿 7.84s；文档体系迁移至 `docs/vitest/`（guides/ 体系文件，pilots/、reviews/ 场景产物分夹） | — | 评审记录归档 `../reviews/TEST_REVIEW_S12.md`；backlog（M3/M4/P3）在评审记录 §7 跟踪 | 台账 S12 卡 / TEST_REVIEW_S12 |
| 2026-09-07 | 列表类共性（S14/S9/S11/S15/S18） | **`@blueking/table`（内部 `BkVxeTable`，基于 vxe-table）在 jsdom 下不渲染表格行**：实测 data 已正确传入组件（日志可见 `data=[{name:'app-a',...}]`），但 `waitFor` 找不到行内元素，5s 超时——vxe 依赖元素尺寸计算，jsdom 中 offsetHeight 恒为 0 | 表格库实现依赖真实布局 | **已于 2026-09-08 解决**：在测试文件内做局部垫片（`HTMLDocument` 全局、固定 `offsetHeight/offsetWidth/clientHeight/clientWidth`、`Element.prototype.scrollTo`、真实回调的 `ResizeObserver`），表格行可正常渲染；S14 已全绿 4/4。**后续列表类场景（S9/S11/S15/S18）直接复用 `../pilots/TEST_PILOT_S14.md` §2 的垫片代码** | PILOT_S14 §2（可复用方案） |
| 2026-09-08 | S9（撤下） | 环境管理列表页表格渲染 **flaky**：同一断言（等待环境名出现）在连续运行中时通过时超时（约 50% 概率）；「新建环境」弹窗在 jsdom 下无法稳定断言打开（弹窗标题未进入可访问树，且打开时依赖空间/APM 拉取） | 已二次排查（2026-09-08）：① 补 `getBoundingClientRect` 垫片（`useElementHeight` 用它测高）**无效**；② 连跑 3 次结果稳定为「空列表用例通过 / 有数据用例超时」，说明**不是抖动而是 vxe 在 S9 上根本不渲染数据行**。对比：S14 行内有 Button（插槽渲染）可查到，S9 name 列为纯字段渲染查不到 | **结论：现有垫片只能覆盖「行内为插槽渲染」的表格，纯字段列在 jsdom 下不可断言**。已采用**方案 A（stub 表格本体 + 垫片并用）**解决：撤下旧用例后重建（初交付 3 条，后补齐至 **7 条**——列表 2 + 删除 5，与场景卡一致），连跑 3 次稳定，变异 2/2 捕获 | PILOT_S9 §1（方案细节）+ skill conventions（stub 模板） |
| 2026-09-08 | S14（验收补充） | 连跑 2 次均 4/4（约 6s/次），稳定性满足指南 §4.2；证实 S9 的 flaky 非公共垫片所致 | — | 表格垫片方案可继续用于后续列表场景，但**每个列表场景都必须做连跑验收** | PILOT_S14 / REVIEW_S14 |
| 2026-09-07 | S3 | 场景族规模超出单夜预算：`app-config` 下 8 个配置模块（ProgramConfig/Lifecycle/HealthProbe/ResourcesForm/UpdateStrategyForm/MetadataConfig/NetworkAccess/DevModeForm）各有独立查看↔编辑多态与校验规则 | 场景族本身粒度大（台账已注明是「场景族而非单个场景」） | 调整实施顺序：先完成小场景（S13 已完成、S6/S5 等），S3 留后续集中攻；顺序决策已登记 ai_unsure.md | ai_unsure.md |
| 2026-09-07 | S13 | 纯路由逻辑场景三坑：① spy `history.back` 拿到 0 次——vue-router 的 back 底层是 `history.go(-1)`；② `smartGoBack` 内 `router.replace(fb)` 未返回 Promise，`await` 拿不到完成，须用 `waitFor` 等 currentRoute 变化；③ 「推导不出上级 → 浏览器后退」分支在真实路由表下不可达（所有路由被 `setupLayouts` 包裹，matched ≥ 2） | ① vue-router 实现；② 源码未返回值；③ 路由表结构 | ① spy 改 `history.go`；② 断言改 `waitFor`；③ 移除该用例 + 用例注释 + `ai_unsure.md` 登记 | PILOT_S13 §2 / 评审记录 §4 |
| 2026-09-08 | 全局 | 审计整改（5 项）：① **space.ts 改用全局 i18n 实例**（store setup 内调用组件级 useI18n 违反 vue-i18n ≥11.1.12 约束），deploy-env-store 3 条失败清零（其中 1 条实为 useLocalStorage pre-flush 落盘时序，用例补 `await nextTick()`）；② 尺寸垫片/表格 stub 收敛为共享模块 `test/scenarios/helpers/vxe-shims.ts`（S9/S14 引用，消除复制漂移）；③ S14 引入表格 stub 补空态断言（`table-empty` 区块，降级口径），空态缺口关闭；④ 指南 §4.2 耗时口径精化（tests 段 <10s，冷启动编译开销不计入，实测数据已登记）；⑤ S9 用例数口径统一（7 条：列表 2 + 删除 5） | 2026-09-08 审计报告 | 全部完成，套件恢复全绿 | 指南 §4.2 / 台账 / 本表 |

## 实施小结

| 日期 | 场景编号 | 用例数 | 实际 V 值 | 是否一次通过 | 耗时 | 备注 |
|---|---|---|---|---|---|---|
| 2026-09-07 | S12 | 18（16 条 it，it.each 展开 3 组非法格式） | 15（与预估一致） | 否，4 轮迭代 | 首跑 7.7s；连跑 3 次 7.5~7.9s 全绿 | bkui-vue 真实渲染链在 jsdom 首次验证通过；实践细节见 `../pilots/TEST_PILOT_S12.md` |
| 2026-09-07 | S12 | 21（评审采纳项落地后） | 15（与预估一致） | 评审闭环后 3 轮全绿 | 终审实测 7.84s（tests 4.02s） | 独立评审三轮 82→91→92 放行；详见 `../reviews/TEST_REVIEW_S12.md` |
| 2026-09-07 | S13 | 10（2 组场景） | 9（台账预估 9；补 hasHistory 优先分支 +1，移除不可达路径 −1） | 否，3 轮迭代 | 首跑 16s（tests 224ms，含首次编译 8s）；连跑 3 次稳定 | 纯路由逻辑范式：经 app 取 router、`replaceState` 控制历史、`waitFor` 等跳转；详见 `../pilots/TEST_PILOT_S13.md` 与 `../reviews/TEST_REVIEW_S13.md`（92/100，变异验证 4/4 捕获） |
| 2026-09-07 | S6 | 4 | 4（台账预估 2；补「展示内容」与「删除进行中禁用取消」2 条） | 否，2 轮迭代（cleanup 缺失） | 约 200ms | `defineModel` 弹层组件范式：Harness 承载 v-model + `afterEach(cleanup)`；详见 `../pilots/TEST_PILOT_S6.md` 与 `../reviews/TEST_REVIEW_S6.md`（93/100，变异验证 4/4 捕获） |
| 2026-09-08 | S18 | 3 | 3（镜像仓库禁用构建 / 代码仓库可用 / 点击弹出执行配置） | 否，4 轮迭代（依赖 stub、pinia、vxe 垫片、真实请求） | 约 6.5s/次，连跑 3 次稳定 | **重依赖页面三招**：Proxy 通用 service stub、`createPinia()` 装真实 pinia、`installVxeShims()` 垫片。另发现分类盲区：Node 内部栈错误（如 `Failed to parse URL`）会被误判为组件库缺陷而掩盖 mock 不全；详见 `../pilots/TEST_PILOT_S18.md` 与 `../reviews/TEST_REVIEW_S18.md`（88/100，变异 2/2） |
| 2026-09-08 | S11 | 2 | 2（第 3 条「切换页签」jsdom 下不可行：activeTab 经 useUrlQuerySync 与路由 query 双向同步，mock 路由不回写 → 组件不切换） | 否，2 轮迭代 | 约 3s/次，连跑 3 次稳定 | 类型分发型容器页测法：stub 重型子页为标记文本，只测「按类型决定显示什么」；详见 `../pilots/TEST_PILOT_S11.md` 与 `../reviews/TEST_REVIEW_S11.md`（85/100，变异 2/2） |
| 2026-09-07 | S5 | 5 | 5（台账预估 3；补数字形态、文本域、禁用态） | 否，4 轮迭代（含变异反推的断言整改） | 约 250ms | **变异验证反证断言强度**：INT 用例原用 `Number()` 宽松断言，「类型分发失效」变异漏报，整改后捕获数 2→3。详见 `../pilots/TEST_PILOT_S5.md` 与 `../reviews/TEST_REVIEW_S5.md`（92/100，变异验证 3/3 捕获） |
| 2026-09-08 | S9 | 7（列表 2 + 删除 5，撤下重建） | 7（与台账一致） | 否（vxe 纯字段列不渲染，方案 A：stub 表格 + 垫片并用） | 连跑 3 次稳定，变异 2/2 捕获 | 详见 `../pilots/TEST_PILOT_S9.md` 与 `../reviews/TEST_REVIEW_S9.md`（86/100） |

## 已知环境事实（实施前置认知，非踩坑）

- `vite.config.mts` 已有 bkui-vue alias（主入口与 `lib/` 子路径）与 monaco-editor 极简 stub，仅影响 vitest 不影响构建。
- `test/setup.ts` 已垫片 jsdom 缺失 API（ResizeObserver / PointerEvent 等），新用例直接复用，勿重复垫片。
- `@testing-library/vue`、`@testing-library/user-event`、`@testing-library/jest-dom` 已安装（2026-09-07 试点第一步，版本见 `../pilots/TEST_PILOT_S12.md` §1）。
