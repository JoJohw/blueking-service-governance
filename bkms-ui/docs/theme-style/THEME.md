# 主题体系（UI 主题色 + 多主题地基）

> 本文件是 UI 主题体系的唯一指南：分层模型、覆写规约、操作步骤、现状快照、踩坑与下一阶段待办。
> 2026-11-18 合并原 `THEME.md` / `THEME_STEPS.md` / `THEME-RECAP-v1.md`，历史版本见 git。
> 可视化域（G6 / ECharts / Monaco / vxe / 第三方包）见同目录 `THIRD-PARTY-THEME.md`。
> 原则：色值真源 = `src/styles/theme/tokens/`；`--bkms-*` 色阶只在 `tokens/color.css` 定义。

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
variables.css            变量桥接              组件库 :root 变量重指向 --bkms-*（bkui.ts 加载）
patches/bkui-theme/      class 覆写层（主角）   组件库写死 hex 的选择器级覆盖，生成器管理
patches/lib/          第三方库覆写            见 THIRD-PARTY-THEME.md
patches/ua-fill/         浏览器默认底色兜底      手写
src/styles/overrides.css 手写形态覆写            生成器不触碰
themes/                  第二主题扩展位          [data-theme] 时启用
```

职责：组件库变量定义值 → `variables.css` 重声明；组件规则字面量 → `patches/bkui-theme/` 复刻选择器整值重写；业务代码 hex → 已由 codemod 替换为 `var(--bkms-*)`。

## 四、目录结构与引入顺序

```
src/styles/theme/
├── index.css          # 静态清单：tokens → themes → patches/bkui-theme → patches/lib → patches/ua-fill
├── variables.css      # 变量桥接聚合（bkui.ts 加载）
├── tokens/            # color.css / radius.css / viz.css
├── themes/index.css   # 第二主题占位
└── patches/           # bkui-theme(43) / lib(12) / ua-fill(2)
```

1. `main.ts` 末尾 `import '~/styles/theme/index.css'`——`--bkms-*` 最早有定义。
2. `modules/bkui.ts`：`style.variable.css` **紧接其后** import `theme/variables.css`——ES module 保证桥接后于组件库样式。
3. `main.ts` 启动 `document.body.classList.add('bkms-themed')`——覆写作用域运行时挂载。

## 五、覆写层规约

- **作用域**：`patches/bkui-theme/` 所有选择器加 `.bkms-themed ` 前缀，specificity (0,2,0) > 库内 (0,1,0)，**不用 `!important`**。挂 `body` 是为了让 teleport 到 body 的弹层天然在作用域内。
- **值策略**：已确认值写 `var(--bkms-*)`；待确认值用库内原色占位并打 `pending`；命中令牌值的声明原值生成。
- **选择器纪律**：逐字复刻（含伪类、`:not()`、组合器），扁平书写。
- **整值重写**：渐变/阴影里的 hex 不能局部替换；8 位 hex 用 `color-mix(in srgb, var(--bkms-*) N%, transparent)`。
- **原值注释**：每条覆写行尾保留原 hex，供 review 与漂移自检比对。
- **文件组织**：按组件域一文件（41 个组件域 + `index.css` + `variables.css`），文件内分区注释。
- **业务侧覆盖**：业务 scoped 编译后为 `[data-v] + n 类`，而覆写层普遍是 3~5 类（多出 `.bkms-themed` 一级）。业务要改颜色时，`:deep()` 内至少带 2 个类并参考该组件既有覆写规则的层级，必要时用 `!important`（存量先例：`custom-filter.vue`、`env-select-panel.vue`）。

## 六、质量基建

- **stylelint**：`patches/**`（bkui-theme / lib / ua-fill 三域）豁免形态类规则（`no-descending-specificity` / `no-duplicate-selectors` / `selector-class-pattern` / `selector-pseudo-element-colon-notation` / `selector-attribute-quotes` / `order/properties-order`）；`overrides.css` 是手写层，只豁免同一批形态类规则，圆角多值（`declaration-property-value-disallowed-list`）照常生效；`color-no-hex` 全局启用排在存量清零之后。
- **漂移自检**：`check-overrides.mjs` 校验每条选择器仍存在于 bkui dist css 且原 hex 仍在，库升级后必跑。解析前需先剥文件头注释（首条规则 prelude 混有注释）。
- **工具链**：`pnpm theme:report`（lint 报告 + viz 待补档）、`node scripts/theme-codemod/scripts/check-lib.mjs`（第三方包变量/选择器漂移）、`pnpm theme:designer`（palette 预览）。
- **生成器（单源）**：`gen-overrides/color.mjs` 抽取 bkui dist 中「prop 非 `--` 且 value 含 hex」的 declaration；映射真源是**既往产物**——重跑前扫 `patches/bkui-theme/*.css` 的「令牌 + 行尾原值注释」建 hex→token 索引，未收录值按原值占位进 `reports/gen-summary.md`。每次重跑清掉 `patches/bkui-theme/` 下非白名单产物（`variables.css`、`radius.css` 保留），不删目录。`gen-overrides/radius.mjs` 按 `config/radius-components.json` 白名单从 `dist/style.css` 复刻 `border-radius` 规则生成 `radius.css`（多值统一成整体语义 + 逻辑角清零，`!important` 原样保留），组件族给默认 token，`rules[].match` 按选择器正则对后代换档（椭圆角标 `full`、1px 细条 `indicator`、标签 `tag`、浮层 `overlay`）；每次重跑同步产出 `reports/radius-summary.md` 台账（原值 → token），产物同样受 `check-overrides.mjs` 校验；生成器共享的事实性白名单在 `config/overrides.mjs`。
- **纪律**：进 `patches/` 前先试 bridge；patches 内禁止裸 hex（原值只进注释）。

## 七、非颜色 token 与 UnoCSS

- 圆角：`tokens/radius.css` 两层——档位层（尺度 `hairline/xs/sm/md/lg/xl` + 形状 `none/full`）与语义层（只引用档位）。业务类名 `rounded-bkms-<语义>`（形状档 `rounded-bkms-none/full`），样式声明写 `var(--bkms-radius-*)`，四角简写统一「整体语义 + 逻辑角清零」。组件库自带的 `--border-radius-base: 2px` / `--input-broder-radius: 3px` **不走 bridge**（`variables.css` 明确不动），由 `patches/bkui-theme/radius.css` 逐选择器覆写。
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
| 3 | 存量 patch 审计 → 全局无包裹段（`overrides.css`） | 已执行 |
| 4 | 全局层替换：uno 注册、main.css 变量化、vxe 覆盖换 token | 已执行 |
| 5 | codemod 批：业务层 hex → `var(--bkms-*)` | 已执行 2026-11-17（`mapping.json` / `codemod.mjs` 退役，改单源自举） |
| 6 | 人工批：动态注入、rgba 阴影、漏网组件 | 部分遗留，见第十三节 |
| 7 | 收尾验收：旧色 grep、漂移 0 失效、`color-no-hex` 启用 | 未完成，见第十三节 |

每步 = 操作 + 验证 + 回滚；一个 PR 对应一步或一步的一个子批。Git：主特性分支只进不改，每步开子分支，规约点位强制 commit，验证后 `merge --no-ff`。message 规范 `theme(stepN): <动作>`。

## 十、现状快照（2026-11-18 实测）

| 层 | 规模 |
| --- | --- |
| `tokens/color.css` | 104 个令牌（色阶 68 / 语义 28 / 阴影 8） |
| `tokens/radius.css` | 8 个档位（尺度 6 + 形状 2）+ 11 个语义档（`--bkms-radius-*`） |
| `tokens/viz.css` | 33 个令牌，独立实色，见 `THIRD-PARTY-THEME.md` |
| `patches/bkui-theme/` | 43 个 CSS（41 组件域 + `index.css` + `variables.css`） |
| `patches/lib/` | 14 个 CSS（12 覆写 + 2 `index.css`），9 个库 |
| `patches/ua-fill/` | 2 个 CSS（`form-control.css` + `index.css`） |
| 业务层 hex 残留 | 6 位 hex 32 处（另 1 处在 `custom-image-push-guide.vue` 注释里；历史基线约 2000 处 / 350+ 文件） |
| theme-lint | 7 条规则 / 3 个规则模块（颜色 / 圆角 / shared） |
| 命令 | `theme:report`、`node scripts/theme-codemod/scripts/check-lib.mjs`、`theme:designer` |
| 全量 lint 基线 | 仓库存量报错未清零（非本轮引入）；改动文件零新增 |

## 十一、关键决策档案

1. **class 覆写取代编译期替换**（`31dd8251`）：postcss 替换层退役，改生成器产出 `.bkms-themed` 覆写；漂移自检对 `style.variable.css` + `dist/style.css` 双源校验。
2. **uno 令牌扁平注册**（`aa9f621a`）：unocss 按 `-` 切段查 theme，嵌套 key 静默丢弃；`resolveThemeDir()` 用 cwd 优先 + 存在性兜底（unconfig 打包后 `import.meta.url` 指向临时目录）。
3. **级联保护与双源扫描**（`aa9f621a`、`77c7714b`）：覆写规则的全部色彩类声明随行生成；`transparent` / 令牌值命中原值保留；`dist/style.css`（lib/*.less 编译产物）选择器可能更具体，需单独成域复刻。
4. **桥接分域、每域单一聚合入口**（`283c2a0a`）：变量层由 `bkui.ts` 紧随 `style.variable.css` 加载，不走 `index.css`（否则 dev 下 `:root` 后者覆盖）。
5. **产物自举与一次性台账退役**（`9dee3d2b`）：`mapping.json` / `pending-design.json` / 备份文件不再入库，色值真源收敛到 `color.css` + 产物注释。
6. **规则插件拆分**（`83c86081`）：颜色 / 圆角各成模块，`plugin.mjs` 只聚合；`map.mjs` 与 `uno.config.ts` 同源。
7. **semantic.css 冻结、magicbox 不接入**：`@blueking/magicbox-theme` 架构同构但色板是另一套规范，暂不接入；新语义走 uno shortcut 语义类或场景类。
8. **viz 域独立**（2026-11-18）：图表 / 编辑器 / 语法高亮不再派生 `--bkms-*`，详见 `THIRD-PARTY-THEME.md`。

## 十二、踩坑清单

| 坑 | 实证 | 结论 |
| --- | --- | --- |
| 生成器清理丢手写补丁 | `cleanGeneratedDir` 曾整目录 `rmSync` | 手写域必须平级分域，清理只删自有 `<kebab>.css` |
| canvas 不解析 `var()` | `597f26b5` minimap `fill` 改 `var()` → `f8e6b7da` 改回实色 | 字典经 var 链解析后必须实色，桥接层负责解析与兜底 |
| `import.meta.url` 指向临时目录 | `aa9f621a` 引入 `resolveThemeDir()` | cwd 优先 + 存在性校验 |
| `.ts` 颜色字符串不在 codemod 台账 | 口径 65 处 `<script>`、明确不含 `.ts` | 记为已知盲区，不假装已全量覆盖 |
| 根 `.gitignore` 的 `*vendor*` | 曾致覆写目录与校验脚本被忽略；两者已改名 `lib` / `check-lib.mjs` 规避 | 新增含 vendor 字样的路径必须 `git status -uall` 复核 |
| markdown 自定义属性 camelCase | `--fgColor-*` 触发 `custom-property-pattern` | 第三方变量名同名重指向，用定点 `stylelint-disable` |
| 业务 scoped 覆盖被覆写层压掉 | `batch-release-progress-panel` 的 `background-image: none`：业务 `[data-v] .bk-step.done .bk-step-number::after` (0,4,0) < `steps.css` `.bkms-themed .bk-steps-primary .bk-step.done .bk-step-indicator:after` (0,5,0) | 覆写层比库原规则多一级 `.bkms-themed`，业务 4 类以内的覆盖由「同分靠顺序」变成「必然输」；`:deep()` 补层级（`.bk-steps.bk-steps-primary .bk-step`）或 `!important` |
| 同元素不同类名致覆盖误判 | bkui Steps 的 `.bk-step-indicator` 与 `.bk-step-number` 是同一个 `span`（`lib/steps/index.js` render） | 排查覆盖失效以 DOM 实际元素为准，不能只比对类名；按类名扫权重会漏这类 |
| 业务覆盖与覆写层平手 | `custom-navigation.vue`（header/container）、`helm-file-list.vue`（tree hover）与 `navigation.css` / `tree.css` 均 4:4 | dev 靠 scoped 后注入取胜，生产打包顺序变化会翻转；值不同的平手项需按需加固 |

## 十三、下一阶段待办

1. **业务层 hex 收尾**：6 位 hex 剩 32 处（另一处在注释里），逐条确认归属（令牌值 / rgba / 动态注入）后，把 `stylelint color-no-hex` 全局启用（仅豁免 `tokens/color.css`）。
2. **Step 6 剩余**：动态注入（`use-env-manager.ts` 4 处）、rgba 阴影对照 spec、JS 内联样式命中项。
3. **dark 主题审计**：neutral 色阶用途翻转 + bkui 深色导航变量桥接，需单独立项。
4. **换肤器接线**：`refreshXxxViz()` 系列目前零调用，`setTheme` 不重载；dark 落地时按「清缓存 → 各 refresh → 各库重绘」接（详见 `THIRD-PARTY-THEME.md`）。
5. **待核实**：需求单 6 大块数值、紫青收拢/色差 ≤6 规则原文。

## 十四、流程约定

- 新增颜色先查 spec 色阶；禁止业务代码写新 hex；`--bkms-*` 色阶只在 `tokens/color.css`。
- 组件库变量声明只允许出现在 `theme/variables.css`（及各域 `variables.css`）。
- patches 内禁止裸 hex（原值只进注释）；进 patches 前先试 bridge。
- 未命中色值走统一消化流程（补 spec → 补映射 → 重跑），禁止静默跳过。
- teleport 弹层覆写天然被 `body.bkms-themed` 覆盖，不依赖业务 scoped 作用域。
