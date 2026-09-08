# S18 测试用例独立评审记录

> 定位：S18（`test/scenarios/build-management.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S18.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/build-management.test.ts`（3 个测试） |
| 被测源码 | `src/pages/application/detail/app-build/build-management.vue`（`isImageRegistry`、`showPopConfirm`） |
| 评审基准 | S18 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评（含自整改） | 88/100 | 通过 | 补齐 Proxy service stub、pinia、vxe 垫片；消除「真实请求」噪音 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 24 | 30 | 覆盖构建入口三路径；未覆盖：执行构建成功/失败、构建历史列表交互、构建配置弹窗 |
| 准确性 | 23 | 25 | 断言与源码核实一致（`sourceType === 'imageRegistry'`、按钮禁用）；Proxy stub 返回值粗放 -1；RepoRefSelect 为 stub -1 |
| 有效性 | 15 | 15 | 变异 2/2 捕获，各打挂对应用例 |
| 可执行性 | 9 | 10 | 连跑 3 次稳定（约 6.5s/次）；依赖 pinia + vxe 垫片 + 放宽超时 -1 |
| 规范性 | 9 | 10 | 标题模板、cleanup 符合；`vi.setConfig` 超时与 Proxy stub 均有注释说明 -1 |
| 可维护性 | 8 | 10 | Proxy stub 隐蔽了真实依赖，后续排查成本略高 -2 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Medium | 依赖 service 未 mock 导致 0/3 | ✅ Proxy 通用 stub |
| Medium | 无 active Pinia / 列表页超时 | ✅ 装 pinia + vxe 垫片 + 放宽超时 |
| **Medium** | 页面发起**真实请求**（`Failed to parse URL`）被分类器归为「预期」而掩盖 | ✅ 补 `ApiServerService` mock；并记录「这类错误栈在 Node 内部，易掩盖 mock 不全」 |

## 5. 运行实证

`vitest run test/scenarios/build-management.test.ts`：**3 passed (3)**，连跑 3 次稳定（6.4~7.0s/次），无 unhandled 噪音。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | 镜像仓库来源不再禁用「执行构建」 | **1 failed** \| 2 passed | 镜像来源为镜像仓库时执行构建应禁用 |
| 2 | 点击「执行构建」不再弹出配置 | **1 failed** \| 2 passed | 点击后应弹出执行配置 |

**结论**：2/2 变异被捕获。

## 7. 推广结论

**通过（88/100，无阻塞）。** 本场景沉淀了两条对重依赖页面有效的经验：Proxy 通用 service stub、用真实 pinia 替代逐个 mock store。同时暴露了分类器的一个盲区（Node 内部栈错误易被误判为组件库缺陷），已记入 PILOT_LOG。

## 8. 遗留项

**真缺口**：

- **P2**：执行构建的提交成功/失败路径（含版本号校验）。
- **P3**：构建历史列表（分页/状态/日志）、构建配置弹窗。

**N/A**：

- **N/A-B（stub 代价）**：RepoRefSelect 的分支选择交互。

**其他**：PILOT_S18 §4 文档性验收待人工执行。
