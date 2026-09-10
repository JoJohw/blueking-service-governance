# S3 试点实践记录：配置编辑保存（多态切换）

> 定位：应用配置（`src/pages/application/detail/app-config/`）下配置子模块「查看态 ↔ 编辑态」多态切换与保存的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S3.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| `components/resources-form.vue` | 真实渲染 | 通用模板的代表实现：查看态 FieldItem / 编辑态 Form.FormItem + 操作按钮 |
| `use-app-spec-section.ts` | 真实执行（未 mock） | 多态切换的全部判定逻辑都在此（handleEdit 存快照 / handleCancelEdit 回滚 / handleSave 环境分派），mock 掉就失去了场景意义 |
| `AppSpecService` | 逐方法 mock（6 个方法） | 断言默认环境/普通环境两条写入路径与删除覆盖 |
| `bkui-vue` | 真实渲染（仅 Message 替换） | 表单校验、Select/Input、Button 均为可感知行为载体 |
| `useGPAConfigPolling` | mock 为「未启用」 | 自动扩缩容含轮询，非本场景判定分支 |

## 2. 关键踩坑（已回写 PILOT_LOG）

1. **数据加载由父容器驱动**：`loadEnvData` 不在组件内自触发，`resources-form.vue:593` 只 `defineExpose({ handleEnvChange, loading })`——独立渲染必须用 harness 持有 ref 调 `handleEnvChange(env)`（与 S1 的 step harness 同口径）。
2. **实例数校验在 UI 上不可达**：bkui 数字输入的 `:min="1"` 会把清空/输入 0 夹回 1，`实例数不能小于1` 无法触发；反向路径改用「保存接口失败 → 停留编辑态且不提示成功」，并判 N/A-A（反证：同类无 min 兜底的校验分支 S1/S12 均可测出）。
3. **FormItem label 无 aria 关联**：`getByRole('spinbutton', { name: /实例数/ })` 查不到，编辑态唯一 number 输入框即实例数。
4. 页面链路触碰 `@blueking/table` 的 DOM 工具（`HTMLDocument`），需装共享垫片 `installVxeShims()`。
5. mock 调用计数跨用例累积，`setDefault` 在相邻用例的调用会污染负断言 → `beforeEach(vi.clearAllMocks)`。

## 3. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 0/6 | 数据未加载（父容器驱动） | harness 驱动 handleEnvChange |
| 2 | 0/6 | 缺 vxe 垫片（HTMLDocument 未定义） | `installVxeShims()` |
| 3 | 3/6 | spinbutton 定位带 name；mock 计数跨用例 | 唯一 spinbutton + clearAllMocks |
| 4 | 5/6 | 实例数受 min 兜底，无法构造非法值 | 反向路径改为保存失败 |
| 5 | 6/6 | — | 全绿 |

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（6/6），连跑 3 次稳定（约 5.7~7.0s/次）
- [x] V = 6（台账 V=3，摸底校准：进入编辑态/取消回滚/保存失败/默认环境保存/普通环境保存/恢复默认配置）
- [x] 变异验证 4/4 捕获（见评审 §6）
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/app-config-resources.test.ts` | 新增，6 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S3.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S3.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S3 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |

## 6. 遗留项

- **P2**：其余配置子模块（健康探针、生命周期、更新策略、元数据、网络访问、程序配置）——复核确认**并非同构**：仅 `update-strategy-form.vue` 复用 `useAppSpecSection`，`health-probe.vue` 等各有自己的编辑态实现，需按子件分别设计用例。
- **P2**：字段级「已修改」标识与重置单字段（ResetIcon）、环境切换时的脏离开确认。
- **P2**：app-config/index.vue 的 Tab 与 URL query 同步（`useUrlQuerySync`）。
