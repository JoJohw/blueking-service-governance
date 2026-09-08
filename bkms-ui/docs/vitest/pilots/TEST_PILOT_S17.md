# S17 试点实践记录：集群组件安装与配置

> 定位：集群组件列表（核心交互为 `cluster-components.vue` 分组列表 + 安装侧滑入口）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S17.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue（Button/Exception/Loading/Switcher） | 真实渲染 | 空态、分组收起/展开是核心可感知行为 |
| `ClusterAddonService` / `PortPoolService` | 逐方法 mock | 仅消费 `listClusterAddons` / `listPortPools`，逐方法 mock 成本低于 Proxy stub |
| `install-sideslider.vue` | stub 为按 `visible` 渲染标题的占位组件 | 侧滑内含按 addon schema 动态渲染的 ComponentsConfig 表单（较重）；stub 契约与真实组件的 `v-model:visible` 一致，仅验证「点击安装 → 父组件置真 → 侧滑可见」，侧滑内动态表单由 ComponentsConfig 单测负责 |
| `vue-i18n` | useI18n 直译 + 模板 `$t` 直译 | 文案不在测试范围（`i18nStub` 插件与 component-management 同模式） |
| `Message` / `InfoBox` | mock | 命令式 API，避免 jsdom 下弹窗副作用 |
| `vue-router` | mock `useRouter` | 页面仅消费 query 与跳转 |

## 2. 列表形态的特殊性

本页列表是**自定义 div 分组结构（非 vxe 表格）**，不需要 `vxe-shims` 垫片；jsdom 下正常渲染。分组收起/展开为真实行为，点击 `.cursor-pointer` 分组头部后组件名与「安装」入口才出现。

## 3. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 0/3 | i18n 注入路径不存在，模块解析失败 | 定位后确认 `i18n-setup` 模块不存在，改用 component-management 已验证的 `$t` 直译插件 + `useI18n` mock 组合 |
| 2 | 1/3 | 分组头无语义化定位手段 | 用 `.cursor-pointer` 类定位分组头部，先 `findByText(/必选组件/)` 等列表加载完成 |
| 3 | 3/3 | — | 全绿 |

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（3/3），连跑 3 次稳定（约 4.2~6s/次）
- [x] V = 3（暂无组件空态 / 分组收起态与展开后组件名+安装入口 / 点击安装弹出侧滑）
- [x] 变异验证 3/3 捕获（见评审记录 §6）
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/cluster-components.test.ts` | 新增，3 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S17.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S17.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S17 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |

## 6. 遗留项

- **P2**：安装侧滑内表单提交流程（填写配置 → 确认安装 → 列表状态刷新）——侧滑本体被 stub，需在 ComponentsConfig 单测或场景深化中覆盖。
- **P2**：可选组件分组、组件更新（isUpdateMode）入口分支。
- 路由挂载点（台账备注）待确认。
