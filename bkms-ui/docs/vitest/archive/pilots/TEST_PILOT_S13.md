# S13 试点实践记录：路由智能返回 + 空间权限守卫

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：第二个场景级测试（S13）的**完整实践过程**，供后续场景复用。滚动式问题记录见 `../../guides/TEST_PILOT_LOG.md`，独立评审记录见 `../reviews/TEST_REVIEW_S13.md`。

## 1. 被测对象与 mock 边界

被测：`src/modules/router.ts`（`install` 内的 `smartGoBack` 与 `beforeEach` 守卫，共两组用户可感知行为）。

| 层 | 处理方式 | 理由 |
|---|---|---|
| vue-router | **真实实例** | 被测逻辑即 router 行为（覆写 back、守卫跳转），必须跑真实导航 |
| 全量路由表 + `virtual:generated-layouts` | **真实加载** | 智能返回的「上级路由推导」依赖真实 matched 结构，不能自造简化路由表 |
| 页面组件（40+） | 真实 import | 实测可加载、无顶层副作用，故不 stub（省 40 个 mock） |
| `~/stores/space` | `vi.hoisted` mock | 隔离空间列表与状态枚举；动态值（list）用模块变量承载 |

**可复用模式**（后续纯逻辑场景直接抄）：

1. **取 router 实例**：`install` 内部自建 router，需经 app 取——`installRouter({ app } as never)` 后读 `app.config.globalProperties.$router`。
2. **控制浏览历史**：`window.history.replaceState({ back }, '', location.href)`——`back` 非空即视为有浏览历史，这是 `smartGoBack` 的唯一判据。
3. **浏览器后退断言**：vue-router 的 `back` 底层走 `history.go(-1)`，**不是** `history.back()`；spy 目标别选错。
4. **等待跳转完成**：`smartGoBack` 内部 `router.replace(fb)` 未返回 Promise，断言前必须用 `waitFor` 等 `currentRoute` 变化。

## 2. 迭代记录（3 轮到全绿）

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 4/10 | ① spy `history.back` 拿到 0 次调用：vue-router 的 back = `go(-1)`；② 三组跳转断言失败：`router.replace` 未返回 Promise，`await` 拿不到完成；③ 空列表用例期望 fetch 1 次，实际 3 次 | spy 改为 `history.go` 并断言 `toHaveBeenCalledWith(-1)`；断言改 `waitFor` 等路由变化；拉取次数改为 `toHaveBeenCalled()`（一次导航可能多次触发守卫，次数是实现细节） |
| 2 | 9/10 | 「推导不出上级 → 退回浏览器后退」用例失败：`resolveParent` 只有在 `matched.length < 2`（router.ts:303）或「父级记录无 name 且无默认子路由」（:311-316）时才返回 undefined，真实路由表未覆盖到后者 | 移除该用例（V 回归台账的 9），原因写入用例文件注释 |
| 3 | **10/10** | 评审补 `hasHistory` 优先于 fallback 的分支（原路径清单未列，源码 `if (hasHistory)` 早于 fallback 判断） | 新增 1 条用例，连跑 3 次稳定 |

## 3. 发现的问题（非测试问题）

1. **`smartGoBack` 的退化分支（`resolveParent` 返回 undefined → 退回浏览器后退）未覆盖**：触发条件是「父级路由记录无 name 且无默认子路由」（router.ts:311-316），真实路由表下需专门构造该场景。属防御性代码，暂不判定为缺陷。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿；连跑 3 次稳定无 flaky（10 passed × 2 次明确记录，第三次同批通过）
- [x] 路径清单先行（V = 台账预估 9 → 摸底校准 10，含补录分支；1 条不可达路径已留痕）
- [x] 指南 §3 规范逐条对照：条款 4/5（DOM 查询与 user-event）对本场景**不适用**（纯路由逻辑，无可交互 DOM），已在评审记录标注；条款 3/7/8 符合
- [x] 单场景耗时：tests 约 220ms（含编译 16s，纯路由无渲染）
- [ ] 文档性验收：用例标题清单交一位不熟悉该模块的同事阅读复述（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/router-guards.test.ts` | 新增，10 个测试（2 组场景） |
| `docs/vitest/pilots/TEST_PILOT_S13.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S13.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S13 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结与踩坑行 |
