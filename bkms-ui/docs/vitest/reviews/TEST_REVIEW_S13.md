# S13 测试用例独立评审记录

> 定位：S13 场景级测试用例（`test/scenarios/router-guards.test.ts`）的独立质量评审记录，与实施记录 `../pilots/TEST_PILOT_S13.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维评分 + 结论门禁）。**特殊说明**：本场景为纯路由逻辑（无 DOM 交互），指南 §3 条款 4（DOM 查询）、条款 5（user-event 交互）不适用，用户可感知结果 = 最终停留路由 + 浏览器历史行为。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/router-guards.test.ts`（10 个测试） |
| 被测源码 | `src/modules/router.ts`（`smartGoBack` 324-339 行、`beforeEach` 346-376 行、`resolveParent` 301-317 行） |
| 评审基准 | S13 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |
| 评分方法 | 六维模型（完整性 30 / 准确性 25 / 有效性 15 / 可执行性 10 / 规范性 10 / 可维护性 10） |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评（含自整改） | 92/100 | 通过 | 补 `hasHistory` 优先于 fallback 的分支（原路径清单遗漏，源码 `if (hasHistory)` 早于 fallback 判断，属真实可感知行为）；承认 1 条路径不可达并留痕 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 26 | 30 | 智能返回 5 分支（含不可达 1 条留痕）+ 守卫 5 分支全覆盖；backlog：空间状态枚举其他值、`to.params.space` 异常形态未覆盖（P3） |
| 准确性 | 24 | 25 | 断言逐一对照源码（403 的 `redirect`/`workspaceID`、404、`go(-1)`）核实一致；空列表用例的 fetch 次数弱断言 -1（多次触发是实现细节，已注释） |
| 有效性 | 14 | 15 | 反向断言充分（403/404 拦截、不跳 fallback）；`waitFor` 等异步跳转；无消极断言 |
| 可执行性 | 9 | 10 | 每用例新建 app+router 独立隔离；无 sleep；首次编译 8s 使总时长 16s（工程侧可优化，非用例问题） |
| 规范性 | 10 | 10 | 标题模板、正反+边界、推断标注均符合；条款 4/5 不适用已标注；不可达分支取舍登记 `ai_unsure.md` |
| 可维护性 | 9 | 10 | `setup`/`setHistory`/`spyBrowserBack` 三个辅助函数收敛样板；不可达分支移除原因写在用例文件注释 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Medium | 补 `hasHistory` 优先于 fallback 的分支用例 | ✅ 已补（第 6 条） |
| Medium | 「推导不出上级 → 浏览器后退」路径不可达，不做无效用例 | ✅ 移除 + 用例文件注释 + ai_unsure 登记 |
| Low | 空列表用例的 fetch 次数断言弱化为「确实调用过」 | ✅ 已改并注释原因 |
| Low | spy 目标由 `history.back` 修正为 `history.go(-1)` | ✅ |
| Low | `router.replace` 无返回值，断言改用 `waitFor` | ✅ |

## 5. 运行实证

- `vitest run test/scenarios/router-guards.test.ts`：**10 passed (10)**，tests 约 220ms；连跑 3 次稳定无 flaky。
- 运行期仅有 bkui-vue 的 source map 缺失告警（已知噪音）与 vue-router 的 `Discarded invalid param(s)` 告警（用例以 path 直接导航触发，不影响断言）。

## 6. 有效性实证（变异测试）

向 `src/modules/router.ts` 注入 4 个模拟回归，逐个验证（撤回均用编辑还原，不用 git 命令）：

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | `smartGoBack` 忽略浏览历史（`hasHistory` 恒 false） | **2 failed** \| 8 passed | 「有浏览历史时点击返回」「有历史且指定 fallback 时优先后退」 |
| 2 | 守卫删除 404 分支（未就绪也放行） | **1 failed** \| 9 passed | 「空间尚未就绪时，应跳转 404」 |
| 3 | 403 跳转丢弃 `redirect`/`workspaceID` | **1 failed** \| 9 passed | 「无权访问空间时，应跳转 403 并携带回跳地址与空间 ID」 |
| 4 | `resolveParent` 忽略默认子路由推导 | **1 failed** \| 9 passed | 「上级路由无名称时，应回退到它的默认子路由」 |

**结论**：4/4 变异全部被捕获，且每个变异只打挂对应保护网用例（1~2 条），无误报，用例指向明确。

## 7. 推广结论

**通过（92/100，无阻塞问题）。** S13 沉淀了「纯路由/纯逻辑场景」的测试范式（经 app 取 router、replaceState 控制历史、`waitFor` 等跳转），可与 S12 的 DOM 交互范式并列作为两套模板供后续场景选用。

## 8. 遗留 backlog（不阻塞）

- **P3**：空间状态枚举的其他取值（如禁用/删除中）边界、`to.params.space` 为数组或空串的守卫行为。
- **P3**：`smartGoBack` 退化分支是否保留（当前不可达，需业务确认是否属预期防御）。
- PILOT_S13 §4「文档性验收」人工项待执行。
