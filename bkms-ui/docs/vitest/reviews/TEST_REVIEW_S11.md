# S11 测试用例独立评审记录

> 定位：S11（`test/scenarios/artifact-management.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S11.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/artifact-management.test.ts`（2 个测试） |
| 被测源码 | `src/pages/application/detail/artifact/index.vue` |
| 评审基准 | S11 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评（含自整改） | 85/100 | 通过 | 「切换页签」在 jsdom 下不可行（URL 同步不回写），移除该用例并登记 |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 22 | 30 | 覆盖「Helm-like 双页签 / 非 Helm-like 无页签」；未覆盖：页签切换、两个子页自身的交互（容器镜像列表、Helm Chart 上传/部署） |
| 准确性 | 23 | 25 | 断言与源码核实一致（`isHelmLikeAppType` 判定、默认第一个页签）；重型子页为 stub -2 |
| 有效性 | 14 | 15 | 变异 2/2 捕获；反向断言（非 Helm-like 查不到页签）充分 |
| 可执行性 | 10 | 10 | 约 3s/次，连跑 3 次稳定，无 sleep |
| 规范性 | 10 | 10 | 标题模板、cleanup、stub 注释说明被替换的是子页自身交互 |
| 可维护性 | 6 | 10 | 用例数偏少（2 条），子页 stub 使场景价值受限；未覆盖路径以注释形式留在文件内 -4 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| Medium | 「切换页签」用例在 jsdom 下无法通过（`useUrlQuerySync` 依赖真实路由回写） | ⏸ 移除 + 登记 backlog（P2），待专项处理 |

## 5. 运行实证

`vitest run test/scenarios/artifact-management.test.ts`：**2 passed (2)**，连跑 3 次稳定（约 3s/次）。

## 6. 有效性实证（变异测试）

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | 非 Helm-like 也显示页签（`v-if="true"`） | **1 failed** \| 1 passed | 非 Helm-like 不应显示页签 |
| 2 | 默认落在第二个页签 | **1 failed** \| 1 passed | Helm-like 默认展示容器镜像 |

**结论**：2/2 变异被捕获。

## 7. 推广结论

**通过（85/100，无阻塞）。** 本场景验证了「类型分发型容器页」的轻量测法（stub 重子页 + 测分发判定），但场景本体偏薄——真正的制品行为在子页里，建议后续把 `container-image` / `helm-chart` 各自单独立项（可能需要新的 S 编号或在 S11 下分子场景）。

## 8. 遗留项（按 N/A 判定标准）

**真缺口**：

- **P2**：页签切换交互（需解决 `useUrlQuerySync` 在 mock 路由下的回写）。
- **P2**：`container-image`（镜像列表/拉取）、`helm-chart`（Chart 上传/版本/部署）两个子页的交互，当前为 stub。

**N/A**：

- **N/A-B（stub 代价）**：两个子页内的表格/上传控件行为，stub 后不可测。

**其他**：PILOT_S11 §4 文档性验收待人工执行。
