# S16 试点实践记录：公共环境变量管理

> 定位：公共环境变量管理（核心交互为 `env-var-form-dialog.vue` 新建/编辑表单弹窗）的场景级测试实践。滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S16.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| bkui-vue（Dialog/Form/Input/Radio/Switcher） | 真实渲染 | 表单校验、作用域联动、模式差异都是核心可感知行为 |
| `EnvvarsService` | Proxy 通用 stub | 接口依赖多，逐个 mock 成本高 |
| `SensitiveValueInput` | 不 stub（默认不渲染） | 仅 `isSensitive=true` 时渲染，本轮用例用默认态 |
| `vue-i18n` | 直译 | 文案不在测试范围 |

## 2. 迭代记录

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1 | **4/4** | — | 一次通过 |

## 3. 可复用模式

- **弹窗表单类场景的通用测法**：直接渲染弹窗组件本体（而不是先打开外层 Sideslider），props 传 `isShow=true` + `editData`（null 即新建），用 `editData` 有无来切换新建/编辑模式——这是本类页面最主要的判定分支。
- 校验拦截类断言：输入非法值 → 点确定 → `waitFor` 等**校验文案**出现，并断言成功回调未触发（双断言，避免只测到一半）。

## 4. 验收结果（对照指南 §4.2）

- [x] 用例全绿（4/4），连跑 3 次稳定（约 4.2s/次）
- [x] V = 4（新建标题与可选作用域 / 编辑标题与作用域只读 / Key 非法拦截 / 指定环境类型展开选项）
- [x] 变异验证 3/3 捕获
- [ ] 文档性验收（待人工执行）

## 5. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/public-env-var-form.test.ts` | 新增，4 个测试 |
| `docs/vitest/pilots/TEST_PILOT_S16.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S16.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S16 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 补实施小结 |
