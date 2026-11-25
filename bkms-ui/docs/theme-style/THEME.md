# 主题体系（UI 主题色 + 多主题地基）

> 本文件是 UI 主题体系的**架构与规约**指南：分层模型、覆写规约、操作步骤、现状快照。
> 2026-11-18 合并原 `THEME.md` / `THEME_STEPS.md` / `THEME-RECAP-v1.md`，历史版本见 git。
> 可视化域（G6 / ECharts / Monaco / vxe / 第三方包）见同目录 `THIRD-PARTY-THEME.md`；决策与踩坑见 `DECISIONS.md`。

## 速查（执行前先读这一段）

| 事项 | 事实 |
| --- | --- |
| 色值真源 | `src/styles/theme/tokens/color.css`：`@layer scale` 区可写 hex，`@layer semantic` 区只写 `var()` |
| 生成产物 | `src/styles/theme/generated/bkui/**` 生成器独占，**禁止手改**；重跑 `pnpm theme:gen` |
| 手写层 | `manual/bkui.css`（bkui 差异）、`manual/lib/**`（第三方库）、`manual/ua.css`、`manual/boost.css` |
| 工具链纪律与命令 | [`scripts/theme-codemod/README.md`](../../scripts/theme-codemod/README.md) |
| 禁令 | 业务层不写 hex（stylelint `color-no-hex` + eslint `theme/no-hardcoded-color` 均 error）；覆写内不写裸 hex（原值只进注释）；`@layer semantic` 不再新增条目 |
| 校验 | `node scripts/theme-codemod/scripts/check-overrides.mjs`、`.../check-lib.mjs`；产物闸门 `pnpm theme:gen && git diff --exit-code src/styles/theme/generated` |
| 决策与踩坑 | [`DECISIONS.md`](./DECISIONS.md)（评审 / 排查时查，日常执行不用读） |

> 速查为摘要：与正文冲突时以正文与脚本实现为准。

## 一、范围

本期 = 需求单「颜色映射」一块 + 多主题令牌地基。圆角已进语义令牌维度；shadow 走语义变量。
运行时第二主题只留扩展位（`themes/` + `[data-theme]`），dark 未做。

## 二、为什么是 class 覆写

| | 编译期替换（已退役） | class 覆写（现行） |
| --- | --- | --- |
| 替换粒度 | 按值：`#3a84ff` 确认后库内 59 处一刀切 | 按选择器：同一色值，按钮 hover 改、图例不改 |
| 与设计流程契合 | 要求值级全量确认 | 支持"确认一批、覆盖一批"的条目级渐进 |
| 失效形态 | 值匹配，抗选择器漂移 | 选择器匹配，库升级改选择器即静默失效，必须配自检 |
| 可见性 | 构建期魔法 | 普通 CSS，devtools 直接看命中 |
| 构建依赖 | postcss 插件 + Vite 管线 | 无 |

## 三、分层模型

```
tokens/color.css         原子色阶 + 语义层     唯一写色值处，:root，uno 注册真源
tokens/radius.css        圆角语义档
variables.css            变量桥接入口          → bridge/bkui.css（bkui.ts 加载，无层）
bridge/bkui.css          组件库变量重指向      :root 同名变量，必须压过组件库
generated/bkui/          class 覆写（生成）    组件库写死 hex 的选择器级覆盖，禁止手改
manual/bkui.css          class 覆写（手写）    生成器表达不了的差异与多态修正
manual/lib/              第三方库覆写          见 THIRD-PARTY-THEME.md
manual/ua.css            浏览器默认底色兜底    全项目唯一 UA 规则，:where() 零特异性
manual/boost.css         !important 专用层     bkms-boost，压过组件库 !important
themes/                  第二主题扩展位        [data-theme] 时启用
```

职责：组件库变量定义值 → `bridge/bkui.css` 重声明；组件规则字面量 → `generated/bkui/` 复刻选择器整值重写；规范与生成值不一致 → `manual/bkui.css` 写差异；业务代码 hex → 已由 codemod 替换为 `var(--bkms-*)`。

## 四、目录结构与引入顺序

```
src/styles/theme/
├── index.css          # 静态清单：tokens → themes → generated/bkui → manual/lib → manual/bkui → manual/ua → manual/boost
├── variables.css      # 变量桥接聚合（bkui.ts 加载）
├── bridge/bkui.css    # bkui 域变量重声明（手写）
├── tokens/            # color.css / radius.css / viz.css
├── themes/index.css   # 第二主题占位
├── generated/bkui/    # 生成器独占：41 组件 + radius.css + index.css
└── manual/            # 手写独占：bkui.css / ua.css / boost.css / lib(12)
```

1. `main.ts` 末尾 `import '~/styles/theme/index.css'`——`--bkms-*` 最早有定义。
2. `modules/bkui.ts`：`style.variable.css` **紧接其后** import `theme/variables.css`——ES module 保证桥接后于组件库样式。
3. `main.ts` 启动 `document.body.classList.add('bkms-themed')`——覆写作用域运行时挂载。
4. 层序由 `index.html` 的 `@layer` 声明决定，跨层胜负与 import 先后无关；清单先后只决定同层（`bkms-patches`）内的覆盖顺序。

## 五、覆写层规约

- **层序**：`index.html` 声明 `bkms-boost, bkms-reset, bkms-vendor, bkms-patches`，`scripts/postcss-layer-css.mjs` 按来源文件路径入层。普通声明强度：无层（uno / app.css）> `bkms-patches` > `bkms-vendor` > `bkms-reset` > `bkms-boost`；`!important` 反序（boost 最强）。`generated/` 与 `manual/` 同层，靠 `theme/index.css` 清单先后决胜；`tokens/`、`themes/`、`variables.css` 必须保持无层，否则 `:root` 会反压 `[data-theme]`。
- **作用域**：`generated/bkui/` 与 `manual/bkui.css` 的选择器统一加 `.bkms-themed ` 前缀，specificity (0,2,0) > 库内 (0,1,0)，同层覆盖**不用 `!important`**。挂 `body` 是为了让 teleport 到 body 的弹层天然在作用域内。
- **值策略**：已确认值写 `var(--bkms-*)`；待确认值用库内原色占位并打 `pending`；命中令牌值的声明原值生成。
- **选择器纪律**：逐字复刻（含伪类、`:not()`、组合器），扁平书写。
- **整值重写**：渐变/阴影里的 hex 不能局部替换；8 位 hex 默认 `color-mix(in srgb, var(--bkms-*) N%, transparent)`，令牌自带 alpha 时直接 `var()`（由上一轮同一行声明的写法继承）。
- **原值注释**：每条覆写行尾保留原 hex，供 review 与漂移自检比对。
- **文件组织**：生成域按组件一文件（41 个组件域 + `index.css` + `radius.css`，文件内分区注释）；手写域按库一文件（`manual/bkui.css` 单文件 + `manual/lib/` 一库一文件），颜色/圆角/形态不再按属性拆分文件。
- **业务侧覆盖**：业务 scoped 编译后为 `[data-v] + n 类`，而覆写层普遍是 3~5 类（多出 `.bkms-themed` 一级）。业务要改颜色时，`:deep()` 内至少带 2 个类并参考该组件既有覆写规则的层级，必要时用 `!important`（存量先例：`custom-filter.vue`、`env-select-panel.vue`）。

## 六、质量基建

- **stylelint**：`generated/**`、`manual/lib/**`、`manual/{ua,boost}.css` 豁免形态类规则（`no-descending-specificity` / `no-duplicate-selectors` / `selector-class-pattern` / `selector-pseudo-element-colon-notation` / `selector-attribute-quotes` / `order/properties-order`）；`manual/bkui.css` 是手写层，只豁免同一批形态类规则，圆角多值（`declaration-property-value-disallowed-list`）照常生效；`color-no-hex` / `function-disallowed-list` 已于存量清零后升为 error（仅 `src/styles/theme/**` 定义层与 palette 骨架豁免）。
- **漂移自检**：`check-overrides.mjs` 校验每条选择器仍存在于 bkui dist css 且原 hex 仍在，库升级后必跑。解析前需先剥文件头注释（首条规则 prelude 混有注释）。
- **工具链**：`pnpm theme:report`（lint 报告 + viz 待补档）、`node scripts/theme-codemod/scripts/check-lib.mjs`（第三方包变量/选择器漂移）、`pnpm theme:designer`（palette 预览）。
- **生成器（单源）**：`gen-overrides/color.mjs` 抽取 bkui dist 中「prop 非 `--` 且 value 含 hex」的 declaration；映射真源是**既往产物**——重跑前扫 `generated/bkui/*.css` 的「令牌 + 行尾原值注释」，按「声明」（`media::selector::prop`）建 hex→token 索引，同 hex 在不同组件/不同声明可各走各的语义；单文件内无法判定的冲突进 `reports/gen-summary.md` 的「同一 hex 多语义」清单，未收录值按原值占位。**手写层（`manual/`）不参与建索引**。产物里学不到、且会真正生成的少数 hex（注释缺原值而无法继承的声明）登记在 `config/overrides.mjs` 的 `HEX_TOKENS`；未使用组件的规则按组件自有 CSS 判定后直接跳过，不生成也不需要映射。报表的「未归属 rules」「未收录 hex」「覆写内按原值占位」长期应为 0；非 0 说明出现在用组件的新选择器或映射退化。每次重跑清掉 `generated/bkui/` 下非白名单产物（仅保留 `radius.css`），不删目录。`gen-overrides/radius.mjs` 按 `config/radius-components.json` 白名单从 `dist/style.css` 复刻 `border-radius` 规则生成 `radius.css`（多值统一成整体语义 + 逻辑角清零，`!important` 原样保留），组件族给默认 token，`rules[].match` 按选择器正则对后代换档（椭圆角标 `full`、1px 细条 `indicator`、标签 `tag`、浮层 `overlay`）；每次重跑同步产出 `reports/radius-summary.md` 台账（原值 → token），产物同样受 `check-overrides.mjs` 校验；生成器共享的事实性白名单在 `config/overrides.mjs`。
- **纪律**：颜色不对先试 tokens / bridge，单组件与规范不一致才写 `manual/bkui.css`；禁止手改 `generated/`（重跑即丢）；覆写内禁止裸 hex（原值只进注释）。

## 七、非颜色 token 与 UnoCSS

- 圆角：`tokens/radius.css` 两层——档位层（尺度 `hairline/xs/sm/md/lg/xl` + 形状 `none/full`）与语义层（只引用档位）。业务类名 `rounded-bkms-<语义>`（形状档 `rounded-bkms-none/full`），样式声明写 `var(--bkms-radius-*)`，四角简写统一「整体语义 + 逻辑角清零」。组件库自带的 `--border-radius-base: 2px` / `--input-broder-radius: 3px` **不走 bridge**（`variables.css` 明确不动），由 `generated/bkui/radius.css` 逐选择器覆写。
- shadow：6 个语义变量；`--bkms-shadow-button` 用 `color-mix(in srgb, var(--bkms-brand-2) 25%, transparent)` 随主题换色。
- UnoCSS：`parseScaleColors()` 从 `tokens/color.css` 提取色阶，**必须注册扁平 key**（`'bkms-brand-6'` 整体）——嵌套 `{ bkms: { 'brand-6' } }` 会按 `-` 切段查不到而静默丢弃。`parseSemanticShortcuts()` 从语义层生成 `text-title` / `bg-card` 等别名。`THEME_DIR` 用 `resolveThemeDir()`（cwd 优先 + `color.css` 存在性校验）。
- 已知限制：纯 `var()` 值不支持 `/50` alpha 修饰符，半透明显式写 `color-mix`。

## 八、运行时多主题与 dark

- 色阶一律挂 `:root`；`[data-theme="x"]` 只覆盖色阶层，语义层与消费方自动跟随。
- 换肤不漏色的前提：`--bkms-*` 色阶只允许在 `tokens/color.css` 定义。
- 挂载：`index.html` 首帧脚本预置 `data-theme` + `localStorage('vueuse-color-scheme')`，`composables/use-theme.ts` 的 `applyTheme` 切 `data-theme` + `.dark` class。
- dark 未做：需翻转 neutral 色阶的文字/背景用途，且 bkui 深色导航（`--menu-bg-color` / `--submenu-bg-color` 等）桥接未映射。

## 九、操作步骤

| Step | 内容 | 状态 |
| --- | --- | --- |
| 0 | 前置准备：令牌骨架、codemod 工具 | 已执行 |
| 1 | 基建批：color.css / 桥接 / 引入位 / `bkms-themed` 挂载 | 已执行 |
| 2R | class 覆写批：生成器 + 41 组件域覆写 + 漂移自检 | 已执行 2026-11-06 |
| 3 | 存量 patch 审计 → 全局无包裹段（原 `overrides.css`，现收口到 `manual/bkui.css`） | 已执行 |
| 4 | 全局层替换：uno 注册、main.css 变量化、vxe 覆盖换 token | 已执行 |
| 5 | codemod 批：业务层 hex → `var(--bkms-*)` | 已执行 2026-11-17（`mapping.json` / `codemod.mjs` 退役，改单源自举） |
| 6 | 人工批：动态注入、rgba 阴影、漏网组件 | 已执行 2026-11-24 |
| 7 | 收尾验收：旧色 grep、漂移 0 失效、`color-no-hex` 启用 | 已执行 2026-11-24 |

每步 = 操作 + 验证 + 回滚；一个 PR 对应一步或一步的一个子批。Git：主特性分支只进不改，每步开子分支，规约点位强制 commit，验证后 `merge --no-ff`。message 规范 `theme(stepN): <动作>`。

## 十、现状快照（2026-11-18 实测）

| 层 | 规模 |
| --- | --- |
| `tokens/color.css` | 104 个令牌（色阶 68 / 语义 28 / 阴影 8） |
| `tokens/radius.css` | 8 个档位（尺度 6 + 形状 2）+ 11 个语义档（`--bkms-radius-*`） |
| `tokens/viz.css` | 33 个令牌，独立实色，见 `THIRD-PARTY-THEME.md` |
| `generated/bkui/` | 43 个 CSS（41 组件域 + `index.css` + `radius.css`），生成器独占 |
| `manual/lib/` | 13 个 CSS（11 覆写 + 2 `index.css`），10 个库，一库一文件 |
| `manual/` 顶层 | 3 个 CSS（`bkui.css` 主手写层 + `ua.css` UA 兜底 + `boost.css` `!important` 层） |
| 业务层 hex 残留 | 0 处（2026-11-24 清零；历史基线约 2000 处 / 350+ 文件）。viz 域 `tokens/viz.css` 与 `readVizVar(变量, 实色)` 兜底属设计内例外 |
| theme-lint | 7 条规则 / 3 个规则模块（颜色 / 圆角 / shared） |
| 命令 | `theme:report`、`node scripts/theme-codemod/scripts/check-lib.mjs`、`theme:designer` |
| 全量 lint 基线 | 仓库存量报错未清零（非本轮引入）；改动文件零新增 |

## 十一、关键决策档案（已归档）

8 条关键决策已移至 [`DECISIONS.md`](./DECISIONS.md) 第一节。日常执行只需记住其中两条禁令：`@layer semantic` 不再新增条目；生成产物禁止手改。

## 十二、踩坑清单（已归档）

9 条踩坑实证已移至 [`DECISIONS.md`](./DECISIONS.md) 第二节。新增路径、排查覆盖失效、业务 scoped 被压时再查。

## 十三、下一阶段待办

1. **dark 主题审计**：neutral 色阶用途翻转 + bkui 深色导航变量桥接，需单独立项。
2. **换肤器接线**：`refreshXxxViz()` 系列目前零调用，`setTheme` 不重载；dark 落地时按「清缓存 → 各 refresh → 各库重绘」接（详见 `THIRD-PARTY-THEME.md`）。
3. **产物一致性闸门**：`theme:gen && git diff --exit-code src/styles/theme/generated` 尚未接入 CI / pre-commit，产物被手改不会在流水线暴露。
4. **遗留令牌引用治理**：`var(--bkms-navy-5)` 36 处、`var(--bkms-success-5)` 5 处仍在业务层；`generated/` 内 `--bkms-neutral-4` 98 处按声明位混用（border 26 / color 60 / background 12）。生成器已有雏形（`color.mjs` 的 `INK_PROPS` / `INK_SEMANTIC_BY_HEX` / `NARROW_DECLS`），方向是把这两处硬编码白名单外置成按 prop 位的配置表，并覆盖 `manual/` 同原值不同令牌的存量。
5. **待核实**：需求单 6 大块数值、紫青收拢/色差 ≤6 规则原文。

**已闭环（2026-11-24）：业务层写死色值清零** —— `theme:report` 令牌漂移 0 处，`stylelint color-no-hex` / `function-disallowed-list` 与 eslint `theme/no-hardcoded-color` 全部升为 error；Step 6 的动态注入与 rgba 一并归零。口径边界：此闭环指「不再有 hex 字面量」，不含遗留令牌引用（见第 4 条）。

**已闭环（2026-11-24）：`theme:gen` 干净 clone 自举** —— 命令前置 `stats-usage.mjs`（0.16s），`reports/` 继续不入库；已验证删除 `reports/` 后 `theme:gen` exit 0、产物零 diff。

## 十四、流程约定

- 新增颜色先查 spec 色阶；禁止业务代码写新 hex；`--bkms-*` 色阶只在 `tokens/color.css`。
- 组件库变量声明只允许出现在 `theme/variables.css`（及各域 `variables.css`）。
- patches 内禁止裸 hex（原值只进注释）；进 patches 前先试 bridge。
- 未命中色值走统一消化流程（补 spec → 补映射 → 重跑），禁止静默跳过。
- teleport 弹层覆写天然被 `body.bkms-themed` 覆盖，不依赖业务 scoped 作用域。
