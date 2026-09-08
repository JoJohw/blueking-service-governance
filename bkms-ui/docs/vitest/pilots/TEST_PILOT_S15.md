# S15 试点实践记录：Helm 部署与预览回滚

> 定位：Helm 部署容器页 + 部署/更新侧滑 + 部署历史 + 回滚弹窗（`src/pages/application/detail/helm-deploy/`）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S15.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue（Form/Select/Button/Dialog/Sideslider/Tab） | 真实渲染 | 校验拦截、Select 下拉、两步流转是核心可感知行为 |
| DeployService / EnvService / ImagesService / AppConfigFilesService / HelmChartsService | 逐方法 mock（vi.hoisted） | 断言需精确到方法与参数 |
| `@blueking/table`（deploy-history 表格） | stub 表格本体 + 垫片并用 | 列均为插槽渲染，stub 后行内操作仍为真实行为（S9/S14 方案） |
| `MsEditor`（monaco diff） | stub 为标题标记 | diff 内容非判定分支；monaco 极简 stub 未验证 diff 模式 |
| `env-undefined-tips.vue` | 契约 stub | 本体用 `i18n-t` 插值组件直译不可行；stub 严格对齐真实契约——取消/仍部署均先置 isShow=false 再 emit（env-undefined-tips.vue:207-220） |
| `preview-rollback.vue` | deploy-history 场景内 stub / 独立 describe 真实渲染（`vi.importActual`） | 回滚确认行为单独验证 |
| index.vue 重型子件（EnvSelectPanel/ResourceTopology/deploy-history） | 契约 stub | EnvSelectPanel mounted 自动 emit 环境（对齐真实「自动选首环境」效果），deploy-history 的回滚链路在独立 describe 真实渲染 |
| `vue-i18n` | useI18n 直译 + `{0}` 插值 + 模板 `$t` 直译 | `textMap` 用了 `t('下一步：{0}', [...])` 插值，直译 mock 需处理参数 |

## 2. 关键踩坑（回写 PILOT_LOG）

1. **文件级 `vi.mock` 是全文件生效的**：同一组件路径既要给 index 场景做 stub、又要在其他用例渲染真实组件时，直接渲染的用例会拿到 stub。解法：`vi.importActual` 按需取真实组件。
2. **bkui Dialog/Sideslider 显隐由内部 `setTimeout` 置位**（modal/index.js:397-406）：isShow false→true 后 wrapper 延迟才可见，立即 `getBy*` 会失败——查询一律 `findBy*`。
3. **bkui-vue FormItem 默认错误文案走 `form-error-tips` tooltip**（v-bk-tooltips 指令），jsdom 下 tooltip 内容不可断言；以 `is-error` 态为拦截信号（注意侧滑 teleport 到 body，需 `document.body` 级查询）。
4. **`use-helm-deploy.ts` 导出模块级单例 ref**（deployHistoryList/chartList/latestDeployStatus）：测试间状态泄漏，beforeEach 必须手动重置。
5. bkui 未装语言包时 FormItem 默认提示为 `verify error`（en locale 的 verifyError）。

## 3. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | 1/7 | 文件级 mock 让直接渲染的组件全变 stub；isShow 切换后 wrapper 延迟可见；i18n 插值 | `vi.importActual` + `findBy*` + 插值直译 |
| 2 | 3/7 | `previewHelmDeploy` 未配返回值（undefined 解构报错被 catch 吞掉） | 补 mockResolvedValue；`toHaveBeenCalledWith` 补第二参数 |
| 3 | 5/7 | 错误文案走 tooltip 不可断言 | 改断言 `is-error` 态（body 级查询） |
| 4 | 7/7 | — | 全绿 |

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（7/7），连跑 3 次稳定（约 5.5~7.5s/次）
- [x] V = 7（台账预估 4~5，摸底校准：更新禁用/校验拦截/正向部署/预检仍部署/预检取消/回滚入口/回滚确认）
- [x] 变异验证 4/4 捕获，且每变异仅命中 1 条对应用例（见评审记录 §6）
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/helm-deploy.test.ts` | 新增，7 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S15.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S15.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S15 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |

## 6. 遗留项

- **P2**：移除部署确认（InfoBox 命令式弹窗 + deleteHelmDeploy）。
- **P2**：查看 Values 侧滑（row.values 渲染进 MsEditor）。
- **P2**：生产环境「仅支持部署已晋级 Tag」分支与去晋级/去构建跳转。
- **P2**：脏离开确认（useLeaveConfirm confirmBox 分支）与部署历史搜索/分页。
