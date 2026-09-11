# S14 测试用例独立评审记录

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 定位：S14（`test/scenarios/application-list.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S14.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/application-list.test.ts`（4 个测试） |
| 被测源码 | `src/pages/application/application.vue`（`handleGetAppList`、`handleShowAppDetail` 等） |
| 评审基准 | S14 场景卡（`../../guides/TEST_SCENARIOS_ROUTES.md`）；`../../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评（含自整改） | 88/100 | 通过 | 修正「失败态断言先等加载结束」（原断言在骨架屏阶段即通过，属弱断言）；攻克 `@blueking/table` 阻塞 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 24 | 30 | 有数据/空列表/加载失败/进入详情四路径覆盖；backlog：搜索筛选、排序、视图模式切换、分页未覆盖（均属列表交互，P2~P3） |
| 准确性 | 23 | 25 | 断言与源码核实一致（`.catch` 复位 loading、点击走 router.push）；空态文案因 vxe 空态插槽未渲染而降级断言 -2 |
| 有效性 | 14 | 15 | 变异 2/2 捕获；失败态用例同时覆盖「加载必须复位」 |
| 可执行性 | 8 | 10 | 表格页面单场景约 4.7s（可接受）；依赖 4 处环境垫片，跨场景复用成本 -2 |
| 规范性 | 10 | 10 | 标题模板、cleanup、条款 7 符合；垫片集中在本文件并有注释 |
| 可维护性 | 9 | 10 | 垫片集中 `beforeAll`，后续可提取为共享 helper（-1） |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| **Medium** | 空态/失败态断言在骨架屏阶段即通过（弱断言） | ✅ 改为先等待加载结束（「创建应用」按钮出现）再断言，并新增 loading 复位保护 |
| Medium | 表格 `#empty` 文案在 jsdom 下不可见 | ⏸ 降级断言 + 记入 backlog（P3） |
| Low | 环境垫片 4 处写在单文件内 | ⏸ 维持（后续列表场景复用时再提取共享 helper） |

## 5. 运行实证

`vitest run test/scenarios/application-list.test.ts`：**4 passed (4)**，约 4.7s。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | 接口失败后异常抛出（`isLoading` 不复位） | **1 failed** \| 3 passed | 加载失败时应结束加载状态 |
| 2 | 丢弃接口返回的应用数据（`return []`） | **2 failed** \| 2 passed | 展示应用名称、点击应用进详情 |

**结论**：2/2 变异被捕获；变异 1 验证了「失败后必须退出骨架屏」这条用户可感知契约确实有保护。

## 7. 推广结论

**通过（88/100，无阻塞）。** 最大价值不在本场景本身，而在于**攻克了 `@blueking/table` 的 jsdom 渲染阻塞**——方案已完整记录在 `../pilots/TEST_PILOT_S14.md` §2，S9/S11/S15/S18 可直接复用，预计每个列表场景可节省 30 分钟以上摸索成本。

## 8. 遗留 backlog

- **P2**：搜索筛选（SearchSelect）、排序切换、列表/全局视图切换、分页——均为列表页高频交互。
- **P3**：表格 `#empty` 空态文案在 jsdom 下未渲染，异常态（数据获取异常 + 刷新）不可断言。
- **P3**：`delete-app-dialog.vue` 等删除入口的连带用例（依赖列表行渲染，现已具备条件）。
- PILOT_S14 §5 文档性验收待人工执行。
