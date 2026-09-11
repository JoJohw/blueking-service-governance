# Vitest 测试方案评审报告

> **存档，不再更新。** 关键结论见 [`../../guides/TEST_SCENARIOS_ROUTES.md`](../../guides/TEST_SCENARIOS_ROUTES.md) 场景卡；可复用打法见 [`../../guides/TEST_PLAYBOOK.md`](../../guides/TEST_PLAYBOOK.md)。新场景禁止续写本文件。正文内旧相对链接可能失效，以台账「历史」字段为准。

> 评审范围：`bkms-ui/` 下全部 Vitest 配置、3 个指南文件、12 个 pilot/review 文档、21 个测试文件（114 个用例）、辅助模块。
>
> 评审目的：评估同事搭建的 Vitest 交互测试方案的质量，识别优化空间，并给出可操作的改进建议。
>
> 核心目标回顾：用测试用例固定项目内交互复杂的地方，让其他同事可以通过测试快速了解交互，避免改坏功能。

---

## 1. 整体评价

**总体来说，这是一套质量很高、思考非常深入的方案**，尤其在方法论和流程管理上做得远超多数前端项目。但工程实践层面（mock 复用、共享工具、CI 集成、文档轻量化）还有较大优化空间。

**一句话总结：方法论过剩、工程化不足——测试设计理论做到了教科书级别，工程侧需要做减法和标准化。**

---

## 2. 评分总览

| 维度 | 评分 (1-10) | 说明 |
|---|---|---|
| 方法论严谨度 | **9** | 评分体系、V 值量化、变异验证都超出常规水准 |
| 用例质量 | **8.5** | 行为驱动、业务语言、正反边界覆盖到位 |
| 可读性（用例即文档） | **9** | `it` 标题清晰，新同事确实可以通过测试了解交互 |
| 可维护性 | **6** | mock 重复、文档过重、Harness 缺少标准化 |
| 执行稳定性 | **7** | 大部分场景连跑 3 次稳定，但超时问题普遍 |
| 投入产出比 | **6.5** | 文档、评审流程的开销偏高 |

---

## 3. 做得好的地方（值得保留）

### 3.1 方法论体系扎实

方案引入了 McCabe 圈复杂度（V 值）来量化每个场景需要的最少用例数，用 `频率 × 影响 × 复杂度` 三维度评分来决定测什么、不测什么。这不是拍脑袋决定的，是有据可依的——"让其他同事通过测试快速了解交互"这一目标恰好被这套方法论支撑。

### 3.2 `it` 标题的业务语言模板

所有用例标题统一使用 **「当用户____时，应____」** 模板，**这正是"用例即文档"的核心**。新同事跑一遍 `pnpm test:unit`，输出的清单就是一份可执行的功能说明书。例如：

```
✓ 当环境列表加载完成时，应展示环境名称
✓ 当环境列表为空时，应不显示任何环境
✓ 当用户点击某环境的删除时，应打开删除确认弹窗
✓ 当用户输入的名称与环境不一致时，删除应被禁用
✓ 当用户输入正确名称并确认删除时，应删除成功并刷新列表
```

### 3.3 测行为不测实现的原则执行到位

用例用 `getByRole`、`getByText`、`getByPlaceholderText` 等用户可感知的选择器查询，断言的是用户看到的文本、按钮状态、弹窗出现/消失，而不是 `wrapper.vm.xxx`。这让测试在内部重构时不需要改——**直接达成"避免改坏功能"的目标**。

### 3.4 API mock 隔离策略成熟

`MockedApiError` 哨兵 + `setup.ts` 里的错误分类器是个亮点设计——区分"预期的 unhandled rejection"和"意外的 bug"，而不是简单地全部忽略。分类逻辑：

- 显式哨兵 `MockedApiError` → 预期（测试主动模拟的接口失败）
- 栈帧含 `test/` 或 `src/` → 非预期（我们代码的 bug）
- 纯组件库内部栈 → 预期（组件库已知缺陷）
- 默认 fail-closed：无法归为预期的一律计入非预期，`afterAll` 抛错让 CI 变红

### 3.5 vxe-table 的 jsdom 垫片方案

vxe-table 这种依赖真实布局的组件在 jsdom 里几乎不可用，方案用 `installVxeShims()` + `TableStub` 的组合方案来解决，并且抽成了共享模块 `test/scenarios/helpers/vxe-shims.ts`，后续场景可以直接复用。这个方案在 S14 验证后成功推广到了 S2/S9/S15/S18 等 6 个场景。不过 S15 的 `helm-deploy.test.ts` 在文件内重新内联定义了 `TableStub`/`TableColumnStub`，没有复用共享模块，属于可进一步收敛的冗余。

### 3.6 非目标的明确界定

明确说了不追求覆盖率、不测样式、不测纯展示组件、不做 E2E——避免了过度测试的陷阱。

### 3.7 质量趋势向好

评审得分从 S12 的 82 分（三轮磨合）提升到 S16 的 91 分（一次通过），边际成本在递减。S12 试点沉淀的模式（Harness、消极断言、变异验证等）在后续场景中被有效复用。S15（Helm 部署）延续了 88 分的稳定水准，并沉淀了两条新打法（`vi.importActual` 双态组件 + bkui 弹层时序处理）。

```
得分分布（终审）：
S2:  80 ← 最低，标注「部分完成」
S11: 85
S9:  90（初评 86，补缺口后提升）
S14/S15/S17/S18: 88
S5/S12/S13/S16: 91~93 ← 最高档
S6:  93
```

---

## 4. 需要优化的地方

### 4.1 文档体系过重，维护成本高

当前文档结构：

```
guides/TEST_GUIDELINE.md          ← 章程（112 行）
guides/TEST_SCENARIOS_ROUTES.md   ← 全量台账（330+ 行）
guides/TEST_PILOT_LOG.md          ← 运营日志（50+ 行）
pilots/TEST_PILOT_SXX.md          ← 每场景一份（12 个）
reviews/TEST_REVIEW_SXX.md        ← 每场景一份（12 个）
```

目前 12 个场景就产出了 **32 个文档文件**（含本评审 + 优化计划）。当场景扩展到全部 16 个（S1~S18），文档数量会超过 50 个。**维护文档的时间可能超过写测试本身**。评审报告里甚至有"三轮评审 82→91→92 放行"这样的过程——对于组件级测试来说，这个流程太重了。

**优化建议**：

- **精简到两层**：保留 `TEST_GUIDELINE.md`（规范）+ `TEST_SCENARIOS_ROUTES.md`（台账），pilot 和 review 的关键结论直接写在台账的场景卡里，不再单独建文件
- 实施经验和可复用模式，直接写在测试文件头部的 JSDoc 注释里——跟着代码走，新同事看代码时自然能看到

### 4.2 mock 样板代码大量重复

几乎每个测试文件都重复以下 mock 模板：

```typescript
// 几乎每个文件都有这一套
vi.mock('vue-i18n', async importOriginal => ({
  ...(await importOriginal<object>()),
  useI18n: () => ({ t: (s: string) => s, te: () => true }),
}));

vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ push: vi.fn(), ... }),
  useRoute: () => ({ path: '...', params: { space: 'ws-1' }, ... }),
}));

vi.mock('~/stores/space', () => ({
  useSpaceStore: () => ({ currentSpace: 'ws-1' }),
}));
```

**优化建议**：提取共享 mock 工厂到 `test/helpers/` 目录：

```typescript
// test/helpers/common-mocks.ts

/** i18n 直译 mock（vi.mock 提升后在模块顶层执行） */
export function mockI18nDirectTranslation() {
  vi.mock('vue-i18n', async importOriginal => ({
    ...(await importOriginal<object>()),
    useI18n: () => ({ t: (s: string) => s, te: () => true }),
  }));
}

/** 创建通用路由 mock，支持覆盖默认值 */
export function mockRoute(overrides?: Partial<RouteLocationNormalized>) {
  const defaults = {
    path: '/ws-1/app',
    params: { space: 'ws-1' },
    query: {},
    meta: {},
    matched: [],
  };
  vi.mock('vue-router', async importOriginal => ({
    ...(await importOriginal<object>()),
    useRoute: () => ({ ...defaults, ...overrides }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  }));
}

/** $t 直译插件（用于 render 的 global.plugins） */
export const i18nStub = {
  install(app) {
    app.config.globalProperties.$t = (s: string) => s;
  },
};

/** i18n-t 组件 stub（直译 keypath） */
export const i18nTStub = {
  props: { keypath: { type: String, default: '' } },
  template: '<span>{{ keypath }}</span>',
};
```

> ⚠️ 注意：`vi.mock` 有 hoisting 特性，提取为函数后仍需确保在模块顶层调用。可以用 `vi.hoisted` 结合工厂函数来实现。

### 4.3 Harness 包装模式可以标准化

多个测试文件都手写了 Harness 组件来驱动被测组件（通过 `defineComponent` + `ref` + `h()`），但模式各不相同：

- `component-management.test.ts` —— 通过 `ref` 暴露 `open/close`
- `delete-confirm.test.ts` —— 通过 `ref` 控制 `isShow`
- `dynamic-input.test.ts` —— 通过 `ref` 双向绑定 `v-model`

**优化建议**：可以提取通用 Harness 工厂函数：

```typescript
// test/helpers/harness.ts

/** 创建 v-model 双向绑定的 Harness 包装 */
export function createModelHarness<T>(
  Component: any,
  defaultProps: Record<string, any> = {},
) {
  const emitted = ref<T>();
  const Harness = defineComponent({
    setup() {
      const value = ref(defaultProps.modelValue);
      return () =>
        h(Component, {
          ...defaultProps,
          modelValue: value.value,
          'onUpdate:modelValue': (v: T) => {
            value.value = v;
            emitted.value = v;
          },
        });
    },
  });
  return { Harness, emitted };
}
```

### 4.4 超时放宽过于普遍

很多文件都直接 `vi.setConfig({ testTimeout: 15_000 })`（6 个文件，含新增的 S15），这暗示了系统性的冷启动编译成本过高问题。

**优化建议**：

- 在 `vite.config.mts` 的 `test` 段**全局设置** `testTimeout: 15000`，而不是在每个文件里重复
- 如果 Vitest 版本支持，考虑开启 `poolOptions.threads.useAtomics` 或 `pool: 'forks'` 来减少冷启动时间
- 长远来看，可以把 `test/scenarios/` 独立为一个 workspace，与轻量级的 `test/*.test.ts` 分开跑

### 4.5 某些场景降级过多，测试价值打折

一些场景由于 jsdom 限制做了大幅降级：

| 场景 | 降级情况 | 影响 |
|---|---|---|
| S11 制品管理 | 3 条路径只覆盖了 2 条，页签切换因 `useUrlQuerySync` 不可测 | 测试只验证分发，不验证内容切换 |
| S9 环境管理 | 纯字段列不渲染，整个表格被 stub | 只验证"数据传给了 Table"，不验证"用户能看到数据" |
| S14 应用列表 | 表格也是 stub 的 | 同上 |
| S4 可编辑表格 | PopConfirm 浮层不渲染 | 删除确认流程无法测试 |

**优化建议**：

- 对于这类强依赖真实 DOM 的场景（vxe-table 渲染、Tab 页签切换等），标注为 **E2E 候选**，在 Playwright/Cypress 中覆盖
- 在 `TEST_SCENARIOS_ROUTES.md` 台账里标注每个场景的"降级程度"和"E2E 补充计划"，让团队清楚哪些交互实际上没有被自动化保护

### 4.6 `anyService` Proxy mock 模式存在盲区

```typescript
anyService: () =>
  new Proxy({} as Record<string, unknown>, {
    get: () => vi.fn().mockResolvedValue({ list: [], total: 0 }),
  }),
```

这个模式很方便，但它会**无声地吞掉任何未预期的 API 调用**——如果代码中调用了一个新的 API 方法，测试不会报错，而是默默返回空数据。这违背了"fail-fast"原则。

**优化建议**：

- 在 `anyService` 的 proxy `get` 中加 warning 日志，或者在 `afterEach` 里检查是否有非预期的调用
- 对核心 API 方法显式 mock（知道它会被调用），只对"不关心的辅助接口"用 proxy 兜底

### 4.7 缺少 CI 集成和自动化守护

当前 `package.json` 里 `test:unit` 只是 `vitest`（watch mode），没有看到 CI 配置。如果没有 CI 自动跑测试，再好的测试也会逐渐 rot。

**优化建议**：

- 添加 `"test:ci": "vitest run --reporter=verbose"` 脚本
- 在 CI pipeline 中加入测试步骤，确保 PR 合入前测试必须全绿
- 考虑加入 `--coverage` 并设置最低阈值（只针对已入选的场景文件，不追求全局覆盖率）

### 4.8 没有充分利用 Vitest 的高级特性

- **`vi.stubGlobal`**：可以代替手动 patch `globalThis` 的方式（`instance-watch.test.ts` 已使用，但场景测试未采用）
- **`test.sequential`**：有些场景里的用例有隐含的顺序依赖（如边界测试在同一个 `it` 里做了多个上一步/下一步），可以考虑拆分
- **Snapshot testing**：对于复杂组件的渲染结果，可以配合使用 inline snapshot 来辅助验证

### 4.9 测试风格不统一

项目中存在两套测试风格并行：

- `test/component.test.ts`、`test/height-chain.test.ts` 使用 **`@vue/test-utils`**（`mount`/`shallowMount`）
- `test/scenarios/*.test.ts` 使用 **`@testing-library/vue`**（`render`/`screen`/`userEvent`）

这会让新同事困惑"我该用哪套？"

**优化建议**：在 `TEST_GUIDELINE.md` 中明确约定——**场景测试统一用 Testing Library，纯逻辑/契约测试可用 test-utils**。

### 4.10 `installVxeShims()` 重复调用

`build-management.test.ts`、`deploy-management.test.ts` 都在**模块顶层和 `beforeAll` 各调用了一次** `installVxeShims()`——冗余的，应该只保留 `beforeAll` 里的一次。新增的 `helm-deploy.test.ts` 也在顶层调用了一次（无 `beforeAll`），风格不统一。

---

## 5. 核心路径覆盖缺口

评审文档显示，部分场景**只覆盖了入口/分发，核心"提交→结果反馈"流程还没有写**：

| 场景 | 已覆盖 | 未覆盖的核心路径（Backlog） | 优先级 |
|---|---|---|---|
| S2 部署 | 类型分发（2 条） | 提交部署成功/失败/加载中 | **P1** |
| S11 制品 | 类型分发（2 条） | 上传、页签切换 | P2 |
| S15 Helm 部署 | ✅ 校验拦截 + 部署成功 + 预检分支 + 回滚（7 条） | 移除部署确认、查看 Values、生产环境晋级约束 | P2 |
| S16 环境变量 | 表单校验（4 条） | 提交成功/失败 | P2 |
| S17 集群组件 | 展开/侧滑（3 条） | 安装提交 | P2 |
| S18 构建 | 入口分发（3 条） | 构建提交成功/失败 | P2 |
| S4 可编辑表格 | 只读/编辑态（2 条） | 新增行/删除/key 重复校验 | P2 |

**目前 114 个用例中，真正覆盖"提交→结果反馈"这一最关键交互的有 S12（组件向导）、S9（环境删除）和 S15（Helm 部署与回滚）。** S15 是目前覆盖最完整的场景之一（V=7，含校验拦截、正向部署、预检弹窗双分支、回滚入口约束和回滚确认），值得作为"完整覆盖提交路径"的范例推广到 S2/S16/S17/S18。

---

## 6. 文档性验收状态

方案定义的验收标准中有一条：**"把用例标题清单给一位不熟悉该模块的同事看，能复述出该功能的交互行为，即算'用例即文档'达成"**。

当前状态：**12/12 场景均标注为"待人工执行"**（含新增的 S15）。

这恰好是做测试的核心目标，建议**最优先安排这一步**——比写新用例更重要。

---

## 7. 是否有更好的方案？

同事的方案在**组件级交互测试**这个定位上是正确的，但可以补充以下两个层次来形成完整的测试金字塔：

### 7.1 补充层 1：纯逻辑单元测试（更快更稳）

项目中的 store、composable、工具函数（如 `smartGoBack` 的核心逻辑）可以用**纯函数单测**覆盖，不需要 DOM、不需要组件渲染。这类测试：

- 执行速度极快（<50ms）
- 100% 确定性，零 flaky
- 维护成本极低

目前 `router-guards.test.ts` 已经是这个思路了（不涉及 DOM），`instance-watch.test.ts`（25 条用例）和 `deploy-env-store.test.ts` 也是纯逻辑测试。但其他场景中的逻辑分支（如表单校验规则、状态计算）也可以抽出来单独测。

### 7.2 补充层 2：关键路径 E2E（解决 jsdom 盲区）

对于 jsdom 打折严重的场景（vxe-table、Tab 切换、浮层定位），用 Playwright 做 3~5 个冒烟级 E2E 测试。项目里已经有 `e2e/tests/` 目录和 3 个 `.spec.ts` 文件，说明基础设施已经存在，只是没有与 Vitest 方案联动起来。

### 7.3 完整的测试金字塔（建议目标）

```
        ╱╲
       ╱ E2E ╲        ← 3~5 个关键路径（Playwright）
      ╱────────╲          解决 jsdom 盲区
     ╱ 场景交互  ╲     ← 当前方案主力（Vitest + Testing Library）
    ╱──────────────╲      覆盖复杂交互分支
   ╱  纯逻辑单元    ╲  ← store/composable/工具函数
  ╱──────────────────╲    快速、稳定、零 flaky
```

---

## 8. 优先行动建议（Top 3）

| 优先级 | 行动 | 投入 | 收益 |
|---|---|---|---|
| **🔴 P0** | **执行文档性验收**——把现有用例标题清单拿给不熟悉的同事看，验证"用例即文档"是否真的成立 | 极低（半天） | 立刻验证方案核心价值 |
| **🟠 P1** | **补核心提交路径**——以 S15 为范例，优先给 S2/S16/S17/S18 补上"提交成功/失败"用例 | 中（2~3 天） | 补上最易被改坏的交互保护 |
| **🟡 P2** | **抽共享 mock 工厂 + 文档减重**——消除 15 个文件里的重复 mock 代码，pilot/review 精简到台账 | 中（1~2 天） | 显著降低后续开发和维护成本 |

---

## 9. 跨场景共性问题汇总

| 类别 | 具体表现 | 出现场景 |
|---|---|---|
| jsdom / vxe 渲染 | 纯 field 列无 DOM、尺寸为 0、HTMLDocument 缺失 | S2、S9、S14、S15、S18 |
| Mock 不全 | 真实 HTTP 请求、`Failed to parse URL` 被分类器掩盖 | S2、S18 |
| 弱断言 | 骨架屏阶段即通过、宽松类型转换、消极断言首检即过 | S5、S12、S14 |
| 覆盖偏薄 | 只测分发/入口，主路径（提交/失败/列表交互）未覆盖 | S2、S11、S17、S18 |
| jsdom 不可达 | URL 同步不回写、Dialog 过渡节点不移除、bkui tooltip 内容不可断言 | S11、S9、S15 |
| 组件库缺陷 | bkui-vue FormItem unhandled rejection、数字框无 role、弹层 setTimeout 延迟显隐 | S12、S5、S15 |
| 模块级单例泄漏 | `use-helm-deploy.ts` 导出模块级 ref，测试间状态泄漏需手动重置 | S15 |
| 文档性验收 | **全部 12 个场景**均待人工执行 | 全部 |

---

## 10. 反复复用的优秀模式（值得沉淀为团队规范）

1. **`afterEach(cleanup)`** — S6 起成为渲染型场景标配
2. **Harness 包装** — `defineModel` / `defineExpose` 命令式组件
3. **`vi.hoisted`** — mock 工厂内可变引用
4. **vxe 垫片 + 表格 stub** — `installVxeShims()` + `TableStub`
5. **Proxy 通用 service stub** — 依赖面广的页面
6. **弹窗直接渲染 + `editData`** — 表单类测试标准打法
7. **变异验证** — 每个场景必做，针对分支/类型失效
8. **消极断言标准写法** — 先等 `vi.fn` 消费信号再 `not.toHaveBeenCalled`
9. **真实 pinia** — `createPinia()` 比逐个 mock store 省事
10. **i18n partial mock** — `useI18n` 直译 + `$t` 插件 + `i18n-t` stub
11. **`vi.importActual` 双态组件** — 同路径既做 stub（容器场景）又真实渲染（子件场景）（S15 沉淀）
12. **bkui 弹层 `findBy*` + `is-error` 态信号** — Dialog/Sideslider 的 isShow 经 setTimeout 置位，Form 错误文案走 tooltip 时以 CSS 错误态为断言信号（S15 沉淀）
