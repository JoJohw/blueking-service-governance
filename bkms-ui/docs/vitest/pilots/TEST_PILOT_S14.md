# S14 试点实践记录：应用列表页（含 @blueking/table 阻塞破解）

> 定位：应用列表页（`src/pages/application/application.vue`）的场景级测试实践。**本场景解决了此前登记为共性阻塞的「`@blueking/table` 在 jsdom 下不渲染表格行」问题，解锁了全部列表类场景（S9/S11/S15/S18）。** 滚动记录见 `../guides/TEST_PILOT_LOG.md`，评审见 `../reviews/TEST_REVIEW_S14.md`。

## 1. 被测对象与 mock 边界

| 层 | 处理方式 | 理由 |
|---|---|---|
| `@blueking/table`（Table/TableColumn） | **真实渲染**（关键） | 列表行渲染是核心可感知行为；此前因 jsdom 尺寸问题不可测，本次攻克 |
| bkui-vue（Button/SearchSelect/Select/Radio/Skeleton） | 真实渲染 | 沿用已验证链路 |
| `ApiServerService.ListApps` | `vi.mock` | 隔离请求层 |
| `vue-router`（useRouter/useRoute） | mock | 断言跳转；`useRoute().path` 被持久化存储依赖，必须提供 |
| `~/stores/space`、`~/stores/app-detail` | mock | `app-detail` 需同时提供 `updateAppName` 与 `updateAppID` |
| `vue-i18n` | partial mock + `i18n-t` 组件 stub | 空态文案经 `<i18n-t>` 渲染，需注册直译 stub（见下） |

## 2. 攻克 @blueking/table（关键经验，后续列表类场景直接复用）

vxe-table 依赖真实布局决定是否渲染行，jsdom 中尺寸恒为 0。**在测试文件内做局部垫片**（不污染全局 setup，避免影响既有测试）：

```ts
beforeAll(() => {
  // 1) vxe 的 DOM 工具引用 HTMLDocument，jsdom 未暴露
  (globalThis as Record<string, unknown>).HTMLDocument = Document;
  // 2) 固定元素尺寸，让虚拟滚动认为容器有高度
  const size = (value: number) => ({ configurable: true, get: () => value });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', size(600));
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', size(1200));
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', size(600));
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', size(1200));
  // 3) jsdom 未实现元素滚动 API
  Element.prototype.scrollTo = function scrollTo() {};
  // 4) ResizeObserver 必须真正回调（setup.ts 的空壳不触发）
  globalThis.ResizeObserver = class {
    cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) { this.cb = cb; }
    observe(target: Element) { this.cb([{ target } as ResizeObserverEntry], this as never); }
    unobserve() {}
    disconnect() {}
  } as never;
});
```

**空态文案**：列表空态由 `TableException` 渲染，其文案经 `<i18n-t>` 插值组件输出；需注册 stub 才能断言：

```ts
components: { 'i18n-t': { props: { keypath: { type: String, default: '' } }, template: '<span>{{ keypath }}</span>' } }
```

> 注：即便如此，vxe 的 `#empty` 插槽在 jsdom 下仍未渲染出「暂无数据」文案（本场景以「加载结束 + 无数据行」断言替代，已进 backlog）。

## 3. 迭代记录（多轮到全绿）

| 轮次 | 结果 | 根因 | 修复 |
|---|---|---|---|
| 1（夜间首探） | 0/1 | 表格不渲染行 | 加尺寸垫片 → 前进 |
| 2 | 0/1 | `HTMLDocument is not defined` | 补全局 |
| 3 | 2/3 | `appDetailStore.updateAppID is not a function`、`scrollTo is not a function` | 补 store 方法与滚动垫片 |
| 4 | 3/3 | — | 表格链路打通 |
| 5 | 2/4 | 空态/失败态文案断言失败：失败用例未等加载结束，DOM 仍在骨架屏 | 改为先等待「创建应用」按钮出现（同时也覆盖了「失败后必须退出骨架屏」） |
| 6 | **4/4** | — | — |

## 4. 发现的行为（非测试问题）

- 接口失败时源码有 `.catch()`（置异常态 + 空数据 + 复位 loading），**异常态文案因 vxe 空态插槽未渲染而不可见**，用户看到的是「空表格」而非「数据获取异常 + 刷新」——建议关注（已登记 `ai_unsure.md`）。

## 5. 验收结果（对照指南 §4.2）

- [x] 用例全绿（4/4），单场景约 4.7s（含表格渲染）
- [x] 路径清单 V：台账预估 4，摸底校准 4（有数据 / 空列表 / 加载失败 / 进入详情）
- [x] 规范逐条符合
- [ ] 文档性验收（待人工执行）

## 6. 交付物清单

| 文件 | 变更 |
|---|---|
| `test/scenarios/application-list.test.ts` | 新增，4 个测试（含 @blueking/table 垫片方案） |
| `docs/vitest/pilots/TEST_PILOT_S14.md` | 本文件 |
| `docs/vitest/reviews/TEST_REVIEW_S14.md` | 独立评审记录（含变异实证） |
| `docs/vitest/guides/TEST_SCENARIOS_ROUTES.md` | S14 卡补记录引用行 |
| `docs/vitest/guides/TEST_PILOT_LOG.md` | 更新共性阻塞条目为「已解决」 |
