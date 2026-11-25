# 第三方库可视化主题（viz 域）

> 覆盖 G6 拓扑、ECharts 图表、Monaco 编辑器、vxe 表格、BlueKing 业务组件包、Markdown / highlight.js。
> 2026-11-18 合并原 `THIRD-PARTY-THEME-v1/v2.md` 与 `pending.md`，历史见 git。UI 主题体系见 `THEME.md`。
> **核心口径：viz 是独立域，不从 `--bkms-*` 派生。** UI 换品牌色或换主题都不带动图表；图表色由可视化场景决定。

## 速查（执行前先读这一段）

| 事项 | 事实 |
| --- | --- |
| 令牌真源 | `src/styles/theme/tokens/viz.css`（33 个），与 UI 令牌分层，**不复用** `--bkms-*` |
| canvas 库（G6 / ECharts / Monaco） | 必须传**实色**：`getComputedStyle` 解析后注入原生 API，直接传 `var()` 会被解析成透明 |
| DOM 库（vxe / bk 业务包 / markdown / highlight） | 走 `src/styles/theme/manual/lib/**`，一库一文件，变量覆写 + 选择器覆写 |
| 漂移自检 | `node scripts/theme-codemod/scripts/check-lib.mjs`（库升级后必跑，失效即 exit 1） |
| 禁令 | viz 令牌不引用 UI 令牌；不为图表新增 UI 语义令牌 |

> 速查为摘要：与正文冲突时以正文与脚本实现为准。

## 一、为什么独立

图表 / 编辑器 / 语法高亮各有语义：数据分类色必须多项可区分，编辑器界面色要贴合深色基底，语法 token 与外部约定绑定。这些值跟着 UI 品牌色变会误读。

代价是换肤不覆盖 viz；需要时在 `[data-theme='dark']` 给 viz 自己的第二档，不回头引用 UI 令牌。当前只有 light 一档。

## 二、技术选型

不引入新依赖：CSS 自定义属性为唯一颜色源，`getComputedStyle` 解析成实色后交给各库原生 API。

| 库 | 渲染 | 机制 | 注入点 | 能读 CSS 变量 |
| --- | --- | --- | --- | --- |
| G6 5.0.50 | canvas | 配置注入 | `Graph options` 的 node/edge style、minimap options | 否（@antv/g 解析不到，回退透明） |
| ECharts（monitor 包） | canvas | 配置注入 | `customOptions.options(options)` | 否（zrender 直绘） |
| Monaco 0.52 | DOM + canvas | 配置注入 | `defineTheme` + `setTheme` | 否 |
| @blueking/table（vxe 封装） | DOM | 变量覆盖 | `--vxe-ui-*` | 是 |
| date-picker / task-log / ediatable / user-selector / notice / monitor 包 CSS | DOM | CSS 覆写 | `manual/lib/` | 是 |
| github-markdown-css / highlight.js / monaco-editor | DOM | CSS 覆写 | `manual/lib/` | 是 |

结论：「统一实现方式」不成立，「统一颜色源 + 统一取色工具 + 各自最后一公里」成立。

## 三、四层

```
tokens/viz.css          字典层    颜色是什么（全部实色）
viz-theme.ts            桥接层    怎么读成实色（readVizVar / 缓存 / 颜色工具）
各库适配文件             适配层    哪个字段吃哪种颜色
manual/lib/             覆写层    不提供 API 的库直接改 CSS（手写，一库一文件）
```

## 四、字典层（`src/styles/theme/tokens/viz.css`）

33 个令牌，按渲染角色分组，**全部字面实色**：

| 组 | 条目 |
| --- | --- |
| line | `line` `line-active` `line-danger` |
| surface | `bg-page` `bg-card` `bg-active` `bg-subtle` `surface-canvas` `mask` |
| status | `status-healthy` `status-warning` `status-error` `status-unknown` |
| text | `text-title` `text-body` `text-secondary` `text-disabled` `text-inverse` `text-brand` |
| chart | `axis-line` `split-line` `tooltip-surface` `tooltip-border` `legend-text` |
| state | `selection` |
| series | `series-1` … `series-8`（`@viz-locked`） |

规则：

1. 不派生 `--bkms-*`，不注册 uno 类（避免同一语义两套类名）。消费只有两路：CSS `var(--bkms-viz-*)`、JS `readVizVar`。
2. 数据分类色（series）标 `@viz-locked`，任何主题下不漂移；不得因与某个 UI 令牌同值就改成语义色。
3. 业务已定的图表色一律进字典标 `@viz-locked`，禁止在适配层另写一份。
4. canvas 硬约束：解析后必须是实色；禁止 `color-mix` / `currentColor` / 渐变进 canvas 令牌值；半透明由桥接层在 JS 侧生成（`mask` 例外，作为 `boxShadow` 片段允许 8 位 hex）。

## 五、桥接层（`src/common/theme/viz-theme.ts`）

- `readVizVar(name, fallback)`：在 `documentElement` 取计算值并沿 `var()` 链解析；空值或无 document 时返回 fallback（jsdom/SSR 安全）。
- 缓存：Map + `invalidateVizCache()`；**取值失败不缓存**，避免兜底色粘住后续成功读取。
- 工具：`hexToRgba`、`mixHex`、`hexWithAlpha`、`readVizSeries`。
- 刷新契约：不引事件总线；各适配器导出 `refreshXxxViz()`，换肤器按「清缓存 → 各 refresh → 各库重绘」调用。

## 六、ESLint 与报表

- 前缀白名单：`scripts/theme-lint/var-prefix.mjs` 的 `THEME_VAR_PREFIXES` 显式登记 `--bkms-` / `--bkms-viz-` / `--vscode-`（Monaco 主题服务注入的编辑器自身配色），`map.mjs` 与 `plugin.mjs` 同源转发。新增命名空间必须追加一行，不靠前缀包含关系隐式放行。
- `map.mjs`：viz.css 只进 `resolveHex` 的声明表，不进 `nearestVars` 建议池——数字结尾的令牌（如 `--bkms-viz-series-3`）会被当成 family 进建议池。
- `no-hardcoded-color`：canvas 消费方（`topo-theme.ts`、`monitor-chart-bridge.ts`、`echarts-viz.ts`、`monaco-theme.ts`）的 `readVizVar` 兜底色逐行 `eslint-disable-next-line` 放行，不再在 `eslint.config.mjs` 里按目录 / 文件名列表关规则。
- `theme:report`：viz 实色是定义，不计入业务 hex 债务；当前待补档 0、锁定 8。

## 七、各库接入

**G6**：`topo-theme.ts` 导出 `getTopoViz()`，minimap 的 `containerStyle` / `shape()` / `maskStyle` 读字典实色；自定义边的 `stroke` 由 Graph options 注入，不写在 `getKeyStyle`；不注册 G6 主题对象（节点是 DOM、边被 shape 覆盖，收益低成本高）。

**ECharts**：`deploy/echarts-viz.ts` 的 `applyEchartsViz(options)` 注入轴/分隔线/图例/tooltip/标题色，接在 `chart-card-item.vue` 的 `customOptions.options`；8 色 series 运行时从字典读，不在模块顶层写常量。不改依赖包（`ExploreChart` 不透传 theme）。

**Monaco**：`monaco-theme.ts` 以 `vs-dark` 为 base 定义 `bkms-dark`（光标、选中背景、活动行号、滚动条、浮层），`rules` 留空（语法 token 走内置）；`ms-editor.vue` 创建前注册、`vs-dark` 映射到 `bkms-dark`、theme watch 调 `setTheme`；浅色走内置 `vs`。

**vxe**：着色全在 `--vxe-ui-*`，只做变量映射不改源码；颜色变量唯一真源是 `manual/lib/@blueking/vxe.css`（表头、边框、行悬停、斑马纹、底栏、树节点线、校验错误色）；行高、斑马纹残留清除、过滤面板等结构覆写也在同一文件末尾。**Monaco** 的 DOM 浮层（不可编辑提示）在 `manual/lib/monaco.css`，编辑器配色仍走 `monaco-theme.ts`。

**硬编码型包**：`manual/lib/@blueking/` 下按库一文件，只覆写页面实际出现的可视面（底 / 边框 / 文字 / hover / 选中 / 禁用），不做全量替换；圆角与颜色同文件，不再拆 `*-radius.css`。markdown 正文属内容域，直读 `--bkms-*` 跟随 UI 主题；语法 token 保持 `@viz-locked`。

**覆写层结构**：`manual/lib/` 与 `generated/bkui/` 是两个所有权目录——前者手写、生成器不读不写，后者生成器整目录重建。`manual/lib/index.css` 是该域唯一聚合入口，在 `theme/index.css` 静态清单里排在 `generated/bkui/index.css` 之后；两者同处 `bkms-patches` 层，靠清单先后决胜；每条规则带 `.bkms-themed` 前缀。

## 八、已定案

| # | 事项 | 结论 |
| --- | --- | --- |
| V1 | viz 与 UI 令牌关系 | 独立实色，不派生；暗色需求走 `[data-theme='dark']` 第二档 |
| V2 | `markdown.css` 借道 viz 变量 | 改回直读 `--bkms-*`（内容域跟随 UI） |
| V3 | 原 `@viz-pending` 5 项 | 转 viz 自有值，标记清零；现值即初始色板，视觉零变化 |
| P1 | `STATUS_CONFIG.miniColor` | 删字段；五值迁 `topo-theme.ts` 的 `STATUS_FALLBACK` 作 `readVizVar` 兜底 |
| P2 | vxe 表头底变量归属 | 收归 `vxe.css`，避免同名双源 |
| P4 | minimap 遮罩 17.6% → 20% | 保留 `#0000002d`（ΔE00 1.44，不可辨） |
| P8 | 状态块 error `#FEDDDD` | 保留（ΔE00 0.22）；表单校验底另走 `--bkms-bg-danger-soft`，用途不同 |
| P9 | lib 覆写边界 | 只覆写 CSS，不改第三方源码（项目无 patch 机制） |
| P10 | 65 处 `<script>` 台账口径 | 记入 `DECISIONS.md` 踩坑清单，标为已知盲区 |

## 九、验证与遗留

- `node scripts/theme-codemod/scripts/check-lib.mjs`：10 个覆写文件，`--vxe-ui-*` 变量与关键选择器缺失 0。
- `pnpm theme:report`：viz 待补档 0、锁定 8。
- 遗留（非决策，随 dark）：换肤器未接线——`refreshTopoViz()` / `refreshBkmsMonacoTheme()` 零调用，`setTheme` 不重载，`readVizVar` 有模块级缓存、`resource-topology.vue` 的 `topoViz` 是快照。当前单主题不暴露，dark 立项时按第五节刷新契约接。
