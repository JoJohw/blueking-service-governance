# S5 测试用例独立评审记录

> 定位：S5（`test/scenarios/dynamic-input.test.ts`）独立质量评审，与实施记录 `../pilots/TEST_PILOT_S5.md` 成对。方法论：QA Skill-Suite `qa-testcase-review`（六维 + 门禁）。

## 1. 评审元信息

| 项 | 内容 |
|---|---|
| 评审对象 | `test/scenarios/dynamic-input.test.ts`（5 个测试） |
| 被测源码 | `src/components/dynamic-input.vue`（182 行） |
| 评审基准 | S5 场景卡（`../guides/TEST_SCENARIOS_ROUTES.md`）；`../guides/TEST_GUIDELINE.md` §3 |

## 2. 评审时间线

| 轮次 | 得分 | 结论 | 关键发现 |
|---|---|---|---|
| 初评 | — | 未通过（自查） | INT 用例为弱断言（`Number(...)`），变异验证未被捕获 |
| 复评（整改后） | 92/100 | 通过 | 断言改为「数字输入形态 + 字符串回传」后，同变异捕获数由 2 提升到 3（INT/BOOL/TEXT 全中） |

## 3. 六维评分

| 维度 | 得分 | 满分 | 证据摘要 |
|---|---:|---:|---|
| 完整性 | 26 | 30 | STRING/INT/BOOL/TEXT/disabled 五路径覆盖；backlog：MAP(KeyValue)、SELECT 下拉未覆盖（P3） |
| 准确性 | 23 | 25 | 断言与源码核实一致；INT 回传类型最终按现状固化为字符串（弱于理想的类型断言 -1）；disabled 仅覆盖 STRING 分支 -1 |
| 有效性 | 15 | 15 | 变异验证反证断言有效（3/3 捕获），且整改后捕获面扩大 |
| 可执行性 | 10 | 10 | 无 sleep、无异步等待，约 250ms |
| 规范性 | 10 | 10 | 标题模板、cleanup、条款 7 符合 |
| 可维护性 | 10 | 10 | Harness 简洁，类型与禁用态经模块变量注入且每用例重置 |

## 4. 问题闭环总表

| 级别 | 内容 | 状态 |
|---|---|---|
| **Medium** | INT 用例弱断言（`Number()` 宽松转换）导致类型分发失效漏报 | ✅ 已整改（改形态属性断言 + 记录回传类型现状） |
| Low | disabled 只覆盖 STRING 分支 | ⏸ 维持（其他分支同源于同一 prop，收益低） |
| Low | 记录「INT 回传字符串而非数字」的行为细节 | ✅ 已在用例注释中写明原因（回传 `'12'` 系 `v-model.trim` + bkui 数字输入所致），是否需调整待业务确认 |

## 5. 运行实证

`vitest run test/scenarios/dynamic-input.test.ts`：**5 passed (5)**，约 250ms。

## 6. 有效性实证（变异测试）

向 `src/components/dynamic-input.vue` 注入 3 个模拟回归（撤回均用编辑还原）：

| # | 注入的业务回归 | 测试结果 | 命中用例 |
|---|---|---|---|
| 1 | 输入后不再 `emit('update:modelValue')` | **3 failed** \| 2 passed | 字符串回传、数字回传、布尔选择 |
| 2 | 类型分发失效（`valueType` 恒返回 STRING） | **3 failed** \| 2 passed（整改前仅 2） | 数字形态、布尔单选、长文本域 |
| 3 | 字符串输入不再受 `disabled` 控制 | **1 failed** \| 4 passed | 禁用时无法编辑 |

**结论**：3/3 变异被捕获。变异 2 是本轮最有价值的发现——它证明了「全绿但断言弱」的风险真实存在，并直接推动了断言整改。

## 7. 推广结论

**通过（92/100，无阻塞）。** 本场景给出了两条对后续所有场景有效的经验：① 变异验证必须包含「分支/类型判断失效」类变异；② 回传值断言要避免宽松类型转换。

## 8. 遗留 backlog

- **P3**：`MAP` 类型的 KeyValue 动态键值表格交互；`SELECT` 类型下拉选择与 tag 回显。
- **P3**：`disabled` 在 INT/BOOL/TEXT/SELECT 分支的表现。
- PILOT_S5 §4 文档性验收待人工执行。
