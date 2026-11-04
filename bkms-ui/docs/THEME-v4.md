# 主题色适配指南 v4（多主题体系）

> 版本记录：v0 = `THEME.md`（初版）；v1 = `THEME-v1.md`（修正变量体系、新增编译期替换层、范围声明）；v2 = `THEME-v2.md`（统计口径注明、未命中兜底、语义映射写死）；v3 = `THEME-v3.md`（合并多主题蓝图 + 评审三处修正）；v4 = 本文件。
> **v4 修订点**：① 编译替换实现收敛为「postcss 首选」（补强 1）；② 显式化 bridge/transform/codemod 职责表并明确 `:root` 变量定义值边界（补强 4 + 补充 A）；③ 3 位短写口径澄清（补强 2）；④ mapping 拆分「spec 已收录 / 待设计确认」两份（补强 3 + 补充 B）；⑤ postcss 替换范围覆盖渐变/阴影函数参数（补充 C）；⑥ dark 主题审计备注（补强 5）；⑦ Step 5 合入顺序确认（补强 6）。
> 本文数字均于 2026-11-03 对 `node_modules/bkui-vue/dist/style.variable.css`（v2.0.2-beta.97，226KB）实测复核，统计口径随数字标注，脚本复算按同口径。
> 原则：重分析、轻方案；色值真源 = `bkms-color-spec.md`（建议收编进 `docs/`）。

## 范围声明

**本期落地范围 = 需求单的「颜色映射」一块 + 多主题体系的令牌地基。** 需求单其余视觉块（圆角、顶栏/侧栏、表格、列表工具栏、成员管理）因需求单原文尚未提供，暂登记待核实项，不产出步骤。**运行时第二主题（`data-theme` 切换、`useTheme()`）本期只预留扩展位、不实现**——先交付"静态换色 + 令牌单一来源"，主题切换机制等第二主题出现时再启用。

## 一、现状盘点（实测数字 + 口径）

| 事实 | 数据 / 位置 | 对方案的影响 |
| --- | --- | --- |
| 组件库引入变量版样式 | `src/modules/bkui.ts:23` → `style.variable.css` | 组件库**变量驱动与写死色混杂**，非纯变量驱动 |
| 组件库真实变量体系 | `:root` 定义 **129** 个（口径：`:root` 块内 `--xxx` 去重；含 `:root` 外定义则 **138**）：全局组 `--primary-color`(86 处)/`--success-color`(34)/`--warning-color`(25)/`--danger-color`(40)/`--default-color`(37)/`--gray-color`(21)/`--light-gray`(74)/`--white-color`(72)/`--whitesmoke-color`(6)/`--border-color`(2)/`--disable-color`(42)/`--disable-bg-color`(2) + 尺寸组（`--border-radius-base: 2px`、`--input-broder-radius: 3px`、`--component-size-*`）+ 组件级组（`--button-*`/`--menu-*`/`--table-*`(44)/`--input-*`/`--link-*`/`--message-*`/`--radio-*`/`--nav-*` 等） | **没有** `--bk-color-*` 系列（实测 0 命中）。变量重声明对象以本清单为准 |
| 变量引用 vs 写死色 | `var(--*)` 引用 **822** 处；写死 hex：**去重后 113 种**（口径 A：6 位 hex + 词边界，8 位色整体跳过；无边界口径 121 种），**实际出现 549 处**；另有 8 位 hex（带 alpha）**26 个**。`#3a84ff` 独占 59 处，`#2c77f4`/`#63656e`/`#979ba5`/`#c4c6cc`/`#dcdee5` 等旧色板主力 | **桥接只覆盖 822 处引用点；549 处写死 hex 必须走编译期替换**。只做桥接会半新半旧混色 |
| 业务侧零消费 | 全 src 搜组件库真实变量名（`var(--primary-color` 等）= **0** 处 | 业务与组件库色板两套孤岛，本次打通 |
| 编译期替换机制缺位 | `vite.config.mts` 全文 220 行，无 postcss 配置、无 CSS transform 插件（有 `html-version` transformIndexHtml 先例，161-167 行，但**那是 html 钩子，非 CSS 先例**） | 需求明文要求"写死色编译时替换、不改 node_modules"，需新建机制 |
| 组件库 spec 未收录色 | `#3f87ff` 1 处（`--menu-active-bg-color` 渐变）、`#182132` 3 处（`--menu-bg-color`/`--nav-bg-color` 侧栏底）；另有 `#f0f8ff`/`#fff4e2`/`#ffeded`/`#eaf3ff` 等 message 系旧色 | 编译替换必须输出"未命中清单"；spec 未收录色**先出清单给设计拍板，不臆断归类**（见第四节） |
| 硬编码色值规模（业务侧） | hex 约 2000 处 / 350+ 文件；rgba 约 210 文件 | 人肉不现实，映射表必须可被脚本消费 |
| 已有存量补丁 | `src/styles/bk-patch.css`，19 条规则，以 `!important` 为主，**实测仅 1 处色值**（`.popover-dark-translucent` 的 rgba 黑色气泡） | 归宿待决策（决策清单 4）。审计重点从"颜色变量化"改为"布局/尺寸规则是否可删" |
| 样式加载顺序 | `main.ts`：`main.css`(55) → `@blueking/table`(56) → uno reset(57) → `uno.css`(58)；bkui css 经 `import.meta.glob(eager:true)`(63) 间接加载 | bridge 引入位必须**显式紧跟** `style.variable.css`，不依赖构建器 import 顺序（见第三节） |
| uno 硬编码 | `uno.config.ts` env-tag-* 4 个 shortcuts（bg/text 共 8 个色值） | 脚本覆盖不到，人工纳入（走 theme 注册，见第六节） |
| dark 挂载点 | `index.html:9-16`，死代码 | 运行时主题预留的现成挂载点（见第七节） |
| 业务侧硬编码非颜色 | border-radius/box-shadow 共 37 文件 | 圆角走桥接，见第五节 |

## 二、分层模型（四层 + 多主题扩展位）

```
tokens.css        原子层 + 语义层    --bkms-brand-2、--bkms-text-body……（spec 已定义，唯一写色值处）
bridge.css        桥接层             组件库真实变量重指向：--primary-color: var(--bkms-brand-2); ……
build-replace     编译期替换         postcss：改写经 Vite CSS 管线的组件库 CSS 里的写死 hex
patches/          补丁层（最后手段） 前三层都够不着的：结构、特殊尺寸、伪元素，按组件域分文件
themes/           主题扩展位          [data-theme="xxx"] 只覆盖色阶（第二主题时启用）
```

**两条链路必须同批上线**：桥接覆盖 822 处变量引用点，编译替换覆盖 549 处写死 hex。同一个视觉部位可能同时存在两条取值路径（按钮底色走变量、hover 态写死），只上一条链路会混色。

### 职责表（v4 显式化，消除"归 bridge 还是 transform"的纠结）

| 色出现位置 | 归属 | 手段 |
| --- | --- | --- |
| bkui **变量定义值**（`--xxx: #yyy`，即 declaration 的 prop 以 `--` 开头） | **bridge.css** | 重声明同名变量指向 `var(--bkms-*)` |
| bkui **组件规则字面量**（`color: #yyy`、`background: #yyy`、渐变/阴影函数参数里的 hex，prop 非 `--` 开头） | **编译期替换（postcss）** | 构建时对 declaration 的 value 做 hex → `var(--bkms-*)` |
| 业务代码（`src/**` 下 hex） | **codemod** | Step 4/5 源码期脚本替换 |

> 关键边界（补充 A）：编译替换的实现必须**跳过 prop 以 `--` 开头的 declaration**（变量定义值归 bridge），否则会把 `--primary-color: #3a84ff` 也改成 `var(--bkms-brand-2)`，与 bridge 重叠。postcss 里按 `decl.prop.startsWith('--')` 判断即可，比"排除 `:root` 块"更通用（顺带覆盖 `:root` 之外的变量定义）。

各层判断标准：

- `tokens.css`：只放 spec「要定义的变量」（色阶 + 语义层 + 阴影），**全库唯一写色值处**，不含映射、不含选择器。色阶一律挂 `:root`。
- `bridge.css`：**只声明 :root 清单里实际存在的变量**（从 `style.variable.css` 实抓，禁止凭记忆），值引用 `--bkms-*`。**语义映射口径（写死，防各自发挥）**：

  | 组件库变量 | 实际定义值 | 指向 | 依据 |
  | --- | --- | --- | --- |
  | `--white-color` | `white` (#FFFFFF) | `var(--bkms-neutral-10)` | spec：#FFFFFF 不改 |
  | `--whitesmoke-color` | `#fafbfd` | `var(--bkms-neutral-8)` | spec：#FAFBFD → #F7F9FD，不归 neutral-10（保留 off-white 层级） |
  | `--gray-color` | `#979ba5` | `var(--bkms-neutral-3)` | spec：#979BA5 → #8F9FBD |
  | `--light-gray` | `#c4c6cc` | `var(--bkms-neutral-4)` | spec：#C4C6CC → #C1CDE5 |

  其余变量按"spec 值映射优先、无命中走未命中流程"处理。附带收益：`--border-radius-base` 等尺寸变量也在清单内，未来圆角调整走桥接即可。
- 编译期替换（postcss，首选）：配置在 `vite.config.mts` 的 `css.postcss.plugins`，对 `bkui-vue/dist/*.css` 流经内容做 hex→`var(--bkms-*)` 文本替换。**磁盘 node_modules 不动**。与业务侧 codemod 共用同一份 `mapping.json`。规则：**跳过 `--` 开头的 declaration；其余 declaration 的 value 内做 6 位 hex 替换（大小写不敏感）**。**未命中兜底**：既不在 mapping 也不在 keep 的色值禁止静默跳过——输出"未命中色值清单"，共用"未命中 → 补 spec → 补 mapping → 重跑"流程（`#3f87ff`、`#182132` 即此类）。
  - 为何 postcss 首选：postcss 对所有经 Vite CSS 管线的 CSS（含 node_modules 依赖）一定生效、dev/build 行为一致；vite `transform` 钩子在 dev 下能否拦截 node_modules CSS 需验证（`html-version` 先例是 `transformIndexHtml`，非 CSS transform 先例）。
- `patches/`：按组件域分文件（form/table/dialog/feedback/navigation）。一条规则准入前必须回答"桥接 / 编译替换哪个够不着它"，并在规则旁注明。

## 三、目录结构与引入顺序

```
src/theme/
├── tokens.css          # 色阶 + 语义 + 阴影（唯一写色值处）
├── bridge.css          # 组件库变量桥接（即 vendor/bkui.css）
├── patches/
│   ├── form.css
│   ├── table.css
│   ├── dialog.css
│   ├── feedback.css
│   └── navigation.css
├── themes/             # 本期留空，第二主题时放 green.css 等
└── index.css           # 统一 @import patches/*.css（控制补丁层加载顺序）
```

**引入顺序（消除对构建器 import 顺序的依赖）**：

1. `main.ts` 顶部：`import '~/theme/tokens.css';` —— 最早定义 `--bkms-*`。
2. `src/modules/bkui.ts`：`import 'bkui-vue/dist/style.variable.css';` **紧接其后** `import '~/theme/bridge.css';` —— 同一模块内 import 顺序由 ES module 规范保证，bridge 必然后于 `style.variable.css` 加载，覆盖组件库 `:root` 变量。
3. `main.css` 末尾（或 `main.ts` 末尾）：`@import '~/theme/index.css';` —— patches 最后加载，选择器级兜底。

> 为何不把 bridge 放进 `main.css`：`main.css` 与 `style.variable.css` 的先后取决于 `import.meta.glob(eager:true)` 的构建产物顺序（不可控）。显式相邻是釜底抽薪的解法。

## 四、映射表的可执行性

spec「颜色映射」表多对一、单向确定 → 理想 codemod 数据源，表即配置。要点：

- 「不替换」清单 = 脚本黑名单（`keep.json`）。
- **hex 大小写**：脚本与编译替换**都先小写化再匹配**（业务侧有 `#3A84FF`，bkui 产物有 `#FAFBFD`）。
- **3 位短写口径（澄清）**：3 位短写（`#fff` 等）先展开成 6 位再查——展开后命中 keep（`#FFFFFF` 不改）或不在 mapping 的一律**不改/跳过**，只有展开后命中 mapping 才替换。spec 映射表全是 6 位，无 3 位条目。
- `rgba(` 不进脚本，人工处理。
- 写死 hex 的**去重口径**：mapping 匹配按"色值种类"（113 种）去重，但替换按"出现处数"（549 处）执行——报告里两列都输出，避免把"113 种"误读为"113 处"。
- **spec 未收录色拆分（补充 B）**：Step 0 扫全 bkui 旧色后分两份——① spec 已收录 → 直接进 `mapping.json`；② spec 未收录 → 单独列「待设计确认清单」（可附参照同类项的**建议**归类，标注"待拍板"），**不进 mapping**。不臆断归类，避免替设计做映射决策。
- **判定规则待补**（需求单核实后落进 `mapping.json` 生成流程）：① 散落的紫、青收进 Purple/Cyan；② 色差 6 以内的散色进最近规范色。业务 codemod 与编译替换共用同一套未命中流程。

## 五、非颜色 token 的缺口分析

- **圆角**：组件库自带 `--border-radius-base: 2px`、`--input-broder-radius: 3px` 变量。若需求确为"控件/卡片/弹层 2px→6px、输入类 3px 保持"，走 bridge.css 重声明即可，不需要业务侧建 token。业务侧自有样式的圆角（37 文件内）按"≥3 次同语义才提 token"增量。
- **shadow**：spec 的 6 个语义变量，其中 `--bkms-shadow-button` 用 `color-mix(in srgb, var(--bkms-brand-2) 25%, transparent)` 实现（等价 spec 的 `#3B6EF540`，但随主题换色）；其余 5 个黑色系阴影保持 spec 原值。
- **height/spacing**：维持增量策略（同语义场景出现 ≥3 次才提 token）。

## 六、UnoCSS 接入

1. `uno.config.ts` 注册 `theme.colors.bkms`，值为 `var(--bkms-*)`（如 `brand-2: 'var(--bkms-brand-2)'`）。
2. `env-tag-*` shortcuts 从硬编码改为 `!bg-bkms-brand-6 !text-bkms-brand-2` 这类短写法（替代 v3 的 `bg-[var(...)]` 长写法，防拼写错）。
3. **已知限制**：`theme.colors` 为纯 `var()` 字符串时，UnoCSS 不支持 `/50` alpha 修饰符（`text-bkms-brand-2/50` 不生效）。需要半透明的场景用 `color-mix(in srgb, var(--bkms-brand-2) 50%, transparent)` 显式写，或改用 `rgb` 分量变量方案。

## 七、运行时多主题预留（本期只留口子，不实现）

- tokens.css 的**色阶一律挂 `:root`**；`[data-theme="green"]` 未来只需覆盖色阶层，语义层与消费方（bridge / 编译替换产出的 `var()`）自动跟随。
- `index.html:9-16` 已给 `<html>` 加 `dark` class 的死代码，可复用为 `data-theme` 挂载点。
- 第二主题出现时：`themes/green.css`（`[data-theme="green"] { --bkms-brand-2: ...; }`）+ `useTheme()` composable + localStorage 持久化。
- **换肤不漏色的前提纪律**：`--bkms-*` 色阶只允许在 `tokens.css` 定义（见第九节），否则散落定义会让换肤漏色。
- **dark 主题审计备注（补强 5，作为需求单输入，不在本次执行）**：语义层把 neutral 色阶同时用于文字（neutral-1）和背景（neutral-10），dark 主题需翻转这些色阶；且 bkui 的 `--menu-bg-color: #182132`、`--submenu-bg-color` 本就是深色，dark 下需反向覆盖。Step 7 多主题自检须加一句"dark 主题需额外审计 bkui 深色组件（menu/navigation）变量是否需反向覆盖"。

## 八、决策清单

1. **编译期替换实现**：postcss（首选，推荐）vs vite transform（备选，需先验证 dev 拦截能力）。**需拍板**。
2. **编译替换是否覆盖组件库 JS 内嵌样式字符串**：css 之外的范围，实施前盘点后定（Step 0 显式待定开关）。
3. **需求单原文**：6 大块数值、编译替换条款、紫青/色差规则——待提供后核实并回填。
4. **存量 `bk-patch.css` 归宿**：19 条规则基本无色值，重点审计"布局/尺寸规则是否可删"，剩余并入 `patches/` 分域（倾向）或保留原文件。
5. **dark class 挂载点**：不消费，tokens 写法留 `:root` 扩展位。
6. **echarts 内联色**：token 化 or 保留原色，登记量后拍板。
7. **spec 未收录色清单**：待设计确认的归类建议——由设计/产品拍板后回填 mapping（补充 B 的落地）。

## 九、流程约定

- 新增颜色先查 spec 色阶；禁止业务代码直接写新 hex。
- 进 `patches/` 前先试 bridge / 编译替换，注明哪个够不着。
- 映射字典与 spec 同步维护。
- 改组件库变量声明只允许出现在 `bridge.css`；业务组件内禁止重声明 `--primary-color` 等全局变量。
- **`--bkms-*` 色阶只允许在 `tokens.css` 定义**（换肤不漏色的前提）。
- **防回潮硬约束**：stylelint `color-no-hex` 全局启用，仅豁免 `tokens.css`（自动化替代人工 CR grep）。
- **teleport 组件提醒**：Modal/Select 下拉/Message 等 teleport 到 `body` 的组件，`:root` 变量沿 DOM 继承天然可用，但 `patches/` 的选择器级覆盖必须用全局类名（不能依赖业务组件的 scoped 作用域）。
- **Git 纪律**：大步骤拆子分支执行、规约点位强制 commit、子分支验证通过后才 merge 回特性分支；已认可的主分支只进不改。细则见 `THEME_STEPS-v4.md` 的「Git 执行规约」。

## v0~v3 勘误与合并记录

| 来源 | 位置/问题 | 处理 |
| --- | --- | --- |
| v0 | "改 :root 变量即可全局换肤"（过强） | 修正为"变量 + 写死色混杂" |
| v0 | `--bk-color-*` 凭记忆编造 | 改用实测 :root 清单 |
| v0 | 圆角结论"4px 主导、不建 token" | 修正为"圆角走 bridge" |
| v0/v1 | 无编译替换步骤（致命漏项） | Step 2 独立成步 |
| v1 | `:root` 126 个、写死 hex 113 处口径不明 | 修正为 129 个、去重 113 种 / 实际 549 处 |
| v2 | 未命中色值会静默漏替换 | 补"未命中清单"兜底 |
| v2 | bridge 引入依赖"glob 先于 main.css"假设 | 改为 bkui.ts 内显式相邻引入 |
| 多主题蓝图 | 漏编译期替换（只做变量桥接） | 保留编译替换层 |
| 定稿计划 | 补强 1~6 | v4 全量吸收（见版本记录） |

## 待核实项（阻塞回填，不阻塞颜色主链路）

1. 需求单原文：6 大块具体数值（圆角 2px→6px、表格行高 42、表头 `#FBFCFE`、菜单 30px/40px 等）。
2. 紫青收拢 / 色差 ≤6 判定规则的原文表述。
