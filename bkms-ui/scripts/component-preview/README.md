# 组件预览清单生成器（component-preview）

扫描 `src/` 下的业务组件，自动推导占位样例、叠加业务域插件的手写特例，生成**组件预览清单**与**接口 mock 样例**，供设计师在预览页浏览全仓组件形态。

## 是什么

- **输入**：`src/**/components/**/*.vue`（扫描范围可配）+ `src/api/modules/*.ts`（接口类型）+ `plugins/*.mjs`（手写特例）。
- **输出**：
  - `src/pages/designer/generated/component-catalog.js` —— 组件清单（预览页直接 import）。
  - `src/pages/designer/generated/api-mock.json` —— 接口 mock 样例（预览环境按 url 模板命中返回）。
  - `src/pages/designer/generated/component-catalog.d.ts` —— 手工维护的类型声明（不入生成器产物）。
- **消费方**：预览页 `src/pages/designer/preview/`（设计师看组件形态）；`dev/palette/`（主题色板左侧菜单）。
- **收录标准**：有结构、有状态、可交互的组件；纯图标、一行提示、纯内容展示等无结构组件不收录。

## 生成机制（流水线）

```
扫描 .vue ──> 推导 props/slots 占位 ──> 叠加插件手写特例 ──> 组装条目 ──> 写盘 ──> 基线 diff
   │                │                      │                 │           │
 componentGlobs  props.mjs             plugins/*.mjs      catalog.mjs   │
 + ignoreIds     + slots.mjs           （按固定扩展点）                   │
 + minUsage                                                             │
                                                     component-catalog.js
                                                     api-mock.json
```

1. **扫描**：按 `componentGlobs` 匹配 `.vue` 文件，过滤 `ignoreIds`、剔除引用数不足 `minUsageToInclude`（除非在 `usageExcept`）。
2. **推导**：`internal/props.mjs` 从 `defineProps` / `defineModel` 类型声明推导占位值；`internal/slots.mjs` 提取 slot 结构。
3. **插件叠加**：`plugins/*.mjs` 按固定扩展点（`propOverrides` / `slotOverrides` / `slotCombos` / `previewVariants` / `componentFamily` 等）覆写或增强推导结果。
4. **组装 + 写盘**：`internal/catalog.mjs` 拼成条目（`id` / `props` / `slots` / `family` / `variants` / `usage` / `warnings` / `status`…），写 `component-catalog.js`；`internal/api-mock.mjs` 生成接口 mock。
5. **缓存**：`internal/cache.mjs` 用「internal/ + 配置文件 + 全部引用源文件 + 基线文件」的 mtime 做签名，命中则跳过生成。
6. **基线 diff**：`internal/baseline.mjs` 算每个组件的样例签名，与 `component-baseline.json` 对比，得出 `new` / `changed` / `stable` 三态。

## 目录结构

```
scripts/component-preview/
├── index.mjs                       CLI 入口（日常生成 / --check / --baseline）
├── component-preview.config.mjs    通用配置（扫描、过滤、占位、插件注册）
├── component-baseline.json         基线（入 git，记录每个组件的样例签名）
├── internal/                       核心实现
│   ├── paths.mjs                   路径常量（产物 / 缓存 / 基线 / 源码目录）
│   ├── props.mjs                    props 类型推导 + 枚举 / 数组 / 占位
│   ├── slots.mjs                    slot 结构提取
│   ├── catalog.mjs                  清单组装 + 写盘
│   ├── api-mock.mjs                 接口 mock 样例生成
│   ├── cache.mjs                    缓存签名（mtime 口径）
│   └── baseline.mjs                 基线签名 + 三态判定 + 完整性守卫
└── plugins/                        业务域插件（手写特例，17 个）
```

## 配置参数（component-preview.config.mjs）

| 参数 | 说明 |
|------|------|
| `componentGlobs` | 组件扫描 glob，默认 `['src/**/components/**/*.vue']` |
| `componentIdBase` / `componentIdStripPrefixes` | 组件 id 的基准目录 / 可省略前缀；id = 相对基准目录路径去掉 `.vue` |
| `maxDepth` | 递归展开类型深度上限（防自引用无限递归），默认 8 |
| `genericArraySize` | 泛型数组 `T[]` 的占位条数，默认 6（给够触发「+n」） |
| `minUsageToInclude` | 收录门槛：引用文件数阈值，默认 2 |
| `usageExcept` | 使用次数不足但强制保留的组件 id 集合 |
| `hideSlotStructure` | 不展示「可替换结构」的组件 id 集合 |
| `ignoreIds` | 无论如何都不进清单的组件 id 集合（图标 / 空壳 / 远程依赖等） |
| `warning` | 风险预判：`text` 统一措辞 + `patterns` 命中即打提示（如 iframe、`route.params`） |
| `placeholders` | 各类型占位值：`string` / `number` / `boolean` / `null` / `array` / `object` / `fn`（Symbol） |
| `namedOverrides` | 按属性名覆写占位值（如 `*width` → 120，让尺寸在预览里可见） |
| `plugins` | 业务域插件数组，生成器按固定扩展点消费 |

## 插件与扩展点

插件放在 `plugins/*.mjs`，每个插件导出一组**固定扩展点**，生成器按需消费。常见扩展点：

| 扩展点 | 作用 | 示例插件 |
|--------|------|----------|
| `propOverrides` | 整字段覆写某个组件的 props（手写样例主力） | `tab` / `key-value` / `instance-log` |
| `slotOverrides` | 覆写 slot 内容 | `overflow-ctrl` |
| `slotCombos` | 多 slot 组合态 | `scroll-layout` |
| `previewVariants` | 预览变体（如溢出/不溢出两组） | `overflow-ctrl` |
| `componentFamily` | 组件族：wrapper + 单元 + 预设 | `skeleton` |
| `enumOverrides` | 枚举候选（作用于类型推导路径） | `env-selector` |
| `transformArrayItems` / `transformSamples` | 变换数组/接口样例 | `env-selector` |
| `disabledFn` | 禁用某条样例 | `component-defs` |
| `containerWidth` / `fillHeight` / `fillWidth` / `heightProp` | 预览容器布局 | `fill-width-shells` / `full-height-shells` |
| `visibilityProp` / `needsFormContext` | 弹窗可见性 / 表单上下文元信息 | `catalog.mjs` 内部计算 |

## CLI

| 命令 | 作用 |
|------|------|
| `node scripts/component-preview/index.mjs` | 日常生成（写 catalog / api-mock / 缓存 + 告警） |
| `node scripts/component-preview/index.mjs --check` | 只读检查 diff/status，不写任何产物 |
| `node scripts/component-preview/index.mjs --baseline` | 首次建全量基线 |
| `node scripts/component-preview/index.mjs --baseline --only <id>` | 增量确认单个 catalog 内组件 |
| `node scripts/component-preview/index.mjs --baseline --prune` | 清理 removed 条目（完整性守卫不通过会拒绝） |
| `node scripts/component-preview/index.mjs --baseline --force --yes` | 非首次全量写回（清空所有待确认） |

## 基线与状态（new / changed / stable）

基线 `component-baseline.json` 记录每个组件的**样例签名**——取**覆盖前** `analyzedProps` + slots 的 hash（与插件手写无关）。

- **`new`**：新组件首次入清单。
- **`changed`**：组件 props/slots 变了，样例可能过期，需人工确认（`--baseline --only <id>`）。
- **`stable`**：一致。
- **`removedIds`**：组件被删 / 改名，用 `--baseline --prune` 清理。
- **完整性守卫**：条目数相对基线骤降 >10% 时，判定目录可能不完整（扫描路径 / glob 改错 / 解析失败），`--prune` 会拒绝执行。

签名取覆盖前的含义：能抓「组件变了」，抓不到「手写样例本身写错」——后者由 `scripts/test/component-preview-catalog.test.mjs` 的跨字段引用断言兜底（如 `tab` 的 `active ∈ tabs[].name`）。

## 测试

`pnpm test:scripts` 全量跑脚本测试，覆盖：

- `component-preview-baseline.test.mjs` —— 签名确定性、Symbol 哨兵、三态判定、removedIds、incomplete 阈值、完整性守卫三路降级、CLI 写回决策。
- `component-preview-consumer.test.mjs` —— 消费端对齐护栏（`ComponentCatalogEntry` 全量 key − `NOT_PICKED` ⊆ `previewItems` pick）。
- `component-preview-catalog.test.mjs` —— 清单 id 命中文件、slot 命中真实 slot、手写样例跨字段引用。
- `component-preview-cli.test.mjs` —— CLI 参数解析与校验。

## 已知局限与设计取舍

- **非枚举的具体数组只推导 1 条**：`interface[]` / `TypeAlias[]` 型 prop（无枚举驱动）只给 1 条占位，想看多条需在插件里手写 `propOverrides`（自动展开多条曾评估为收益/成本比低、已摘出不进主线）。
- **完整性守卫是启发式**：条目数骤降 >10% 才判定目录不完整；小规模减员（如 glob 改错只少扫 1~2 个组件）仍会静默漏过。
- **基线损坏按 stable 兜底**：基线读取异常时不误标全量 new，全部降级为 stable、仅 warn 一行（fail-safe）。

## 进一步阅读

- 开发者同步样例流程：`.agents/skills/component-preview-sync/SKILL.md`。
- 设计师维护规范：`.agents/skills/component-preview-designer/SKILL.md`。
