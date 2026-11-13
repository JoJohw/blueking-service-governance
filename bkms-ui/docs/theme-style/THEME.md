# 主题色适配指南（多主题体系）

> 版本记录：v0 = `THEME.md`（初版）；v1~v4 见 git 历史（`THEME-v1.md` ~ `THEME-v4.md`，2026-11-06 起文件名不再带版本后缀，历史版本只存在于 git）。本文为现行版，含 2026-11-06 目录重排：theme 移入 `src/styles/theme/`、令牌收进 `tokens/`、patches 按 `bkui-theme/`（生成）与 `bkms/`（手写）分域；设计确认值全部收编（mapping 230，含 2026-11-13 pending-designer-review 建议值拍板批），覆写内 pending 清零。
> **关键决策（方向性变更）**：① **编译期替换层（postcss-theme-replace）退役**，组件库写死 hex 改由 **class 选择器覆写**承担；② 覆写层组织规约：按组件域分文件 + `body.bkms-themed` 统一作用域 + 全局无包裹段分离；③ specificity 策略、stylelint 豁免、漂移自检脚本明确；④ DoD 口径更换；⑤ 沿用已定内容：mapping 拆分「spec 已收录 / 待设计确认」、bridge 语义映射写死、UnoCSS 接入、多主题预留、dark 审计备注。
> 本文数字均于 2026-11-03 对 `node_modules/bkui-vue/dist/style.variable.css`（v2.0.2-beta.97，226KB）实测复核，统计口径随数字标注。
> 原则：重分析、轻方案；色值真源 = `bkms-color-spec.md`；`--bkms-*` 色阶唯一写在 tokens。

## 范围声明

**本期落地范围 = 需求单的「颜色映射」一块 + 多主题体系的令牌地基。** 需求单其余视觉块（圆角、顶栏/侧栏、表格、列表工具栏、成员管理）因需求单原文尚未提供，暂登记待核实项，不产出步骤。运行时第二主题（`data-theme` 切换）本期只预留扩展位、不实现。

## 一、为什么是 class 覆写：按值替换 vs 按选择器覆写

| | 编译期替换（已退役） | class 覆写（现行） |
| --- | --- | --- |
| 替换粒度 | **按值**：`#3a84ff` 确认后库内 59 处一刀切全变 | **按选择器**：同一色值，按钮 hover 改、图例不改，"同值不同命" |
| 与设计确认流程的契合 | 要求值级全量确认才能安全执行 | **支持"确认一批、覆盖一批"的条目级渐进** |
| 失效形态 | 值匹配，抗选择器漂移 | 选择器匹配，库升级改选择器即**静默失效**——必须配自检脚本 |
| 可见性 | 构建期魔法，排查读插件 | 普通 CSS，devtools 直接看命中关系 |
| 构建依赖 | postcss 插件 + Vite 管线行为 | 无 |

**结论**：设计确认是条目级而非值级，class 覆写与实际工作流粒度匹配。

## 二、现状盘点（实测数字 + 口径）

| 事实 | 数据 / 位置 | 对方案的影响 |
| --- | --- | --- |
| 组件库引入变量版样式 | `src/modules/bkui.ts:23` → `style.variable.css` | 组件库**变量驱动与写死色混杂**，非纯变量驱动 |
| 组件库真实变量体系 | `:root` 定义 **129** 个（口径：`:root` 块内 `--xxx` 去重；含 `:root` 外定义则 **138**）：全局组 `--primary-color`(86)/`--success-color`(34)/`--warning-color`(25)/`--danger-color`(40)/`--default-color`(37)/`--gray-color`(21)/`--light-gray`(74)/`--white-color`(72)/`--whitesmoke-color`(6)/`--border-color`(2)/`--disable-color`(42)/`--disable-bg-color`(2) + 尺寸组（`--border-radius-base: 2px`、`--input-broder-radius: 3px`、`--component-size-*`）+ 组件级组（`--button-*`/`--menu-*`/`--table-*`(44)/`--input-*`/`--link-*`/`--message-*`/`--radio-*`/`--nav-*` 等） | **没有** `--bk-color-*` 系列（实测 0 命中）。变量重声明对象以本清单为准 |
| 变量引用 vs 写死色 | `var(--*)` 引用 **822** 处；写死 hex：去重 **113 种**（口径 A：6 位 hex + 词边界）、**实际 549 处**；8 位 hex（带 alpha）26 个。`#3a84ff` 独占 59 处 | 桥接覆盖 822 处引用点；549 处写死 hex 走 **patches/ class 覆写**。只做桥接会混色 |
| 业务侧零消费 | 全 src 搜组件库真实变量名 = **0** 处 | 业务与组件库色板两套孤岛，本次打通 |
| 组件库 spec 未收录色 | `#3f87ff` 1 处（`--menu-active-bg-color` 渐变）、`#182132` 3 处（侧栏底）；另有 `#f0f8ff`/`#fff4e2`/`#ffeded`/`#eaf3ff` 等 message 系旧色 | **先出清单给设计拍板，不臆断归类**（见第五节） |
| 硬编码色值规模（业务侧） | hex 约 2000 处 / 350+ 文件；rgba 约 210 文件 | 人肉不现实，映射表必须可被脚本消费 |
| 已有存量补丁 | `src/styles/bk-patch.css`，19 条规则，以 `!important` 为主，实测仅 1 处色值 | 归宿：审计后布局/尺寸规则迁入全局无包裹段 |
| 样式加载顺序 | `main.ts`：main.css(55) → @blueking/table(56) → uno(57-58)；bkui css 经 `import.meta.glob(eager:true)`(63) 间接加载 | bridge 引入位显式紧跟 `style.variable.css`（见第三节） |
| uno 硬编码 | `uno.config.ts` env-tag-* 4 个 shortcuts | 走 theme 注册（见第七节） |
| dark 挂载点 | `index.html:9-16`，死代码 | 运行时主题预留挂载点（见第八节） |
| 业务侧硬编码非颜色 | border-radius/box-shadow 共 37 文件 | 圆角走桥接，见第六节 |

## 三、分层模型（编译替换层移除，patches 升格）

```
tokens/
├── colors.css         原子色阶             --bkms-brand-2……（唯一写色值处，:root；uno 注册真源）
└── semantic.css       语义层               --bkms-text-body…… 引用色阶
patches/*/variables.css   桥接层               组件库 :root 变量重指向 --bkms-*（按域拆分：bkui-theme/ + bkms/，bkui.ts 加载）
patches/
├── bkui-theme/        class 覆写层 ★主角   组件库写死 hex 的选择器级覆盖（549 处的归属地，生成器管理）
└── bkms/              手写业务补丁         feedback/table 等手工维护，生成器不触碰
themes/             主题扩展位           [data-theme] 第二主题时启用
```

职责表：

| 色出现位置 | 归属 | 手段 |
| --- | --- | --- |
| bkui 变量定义值（prop 以 `--` 开头） | patches/*/variables.css | 重声明同名变量指向 `var(--bkms-*)` |
| bkui 组件规则字面量（含渐变/阴影函数参数） | **patches/（class 覆写）** | 复刻原选择器 + `var(--bkms-*)` 整值重写 |
| 业务代码（`src/**` hex） | codemod | 源码期脚本替换 |

## 四、目录结构与引入顺序

```
src/styles/theme/
├── tokens/
│   ├── colors.css      # 色阶（唯一写色值处）
│   └── semantic.css    # 语义层
├── patches/
│   ├── bkui-theme/     # class 覆写，按组件域分文件（生成器管理，重跑整体覆盖；每文件含变量版段+字面量段；variables.css 为手工桥接，生成器保留）
│   │   ├── variables.css
│   │   ├── form.css
│   │   ├── dialog.css
│   │   └── …
│   └── bkms/           # 手写业务补丁（feedback / table / variables，生成器不触碰）
├── themes/             # 本期留空
└── index.css           # 统一 @import（生成器重写）
```

**引入顺序**：

1. `src/main.ts`：`import '~/styles/theme/index.css';`（整包：tokens + patches，放 CSS 组末尾）—— `--bkms-*` 最早有定义。
2. `src/modules/bkui.ts`：`import 'bkui-vue/dist/style.variable.css';` **紧接其后** `import patches/bkui-theme/variables.css + patches/bkms/variables.css;`（经 theme/variables.css 聚合）—— ES module 规范保证变量桥接后于组件库样式加载。
3. `src/main.ts` 启动时 `document.body.classList.add('bkms-themed')` —— 覆写作用域运行时挂载（见第五节）。

## 五、覆写层组织规约

**作用域类**：`patches/bkui-theme/` 所有覆写选择器加 `.bkms-themed ` 前缀（`.bkms-themed .bk-input { … }`）， specificity (0,2,0) > 库内 (0,1,0)，**全程不用 !important**。挂载在 `body` 上而非 app 根：Modal/Select 下拉/Message 等 teleport 到 body 的弹层天然在作用域内，无需额外补救。挂载点定案为 `main.ts` 启动时运行时添加（本项目 app.mount 在异步回调之后，时序安全）。`body`/`html` 自身样式与历史临时修正放**全局无包裹段**（`patches/bkms/` 手写文件，无前缀）。

**值策略（占位制，2026-11-06 定案）**：覆写结构先行、不等设计全部拍板——设计已确认值直接写 `var(--bkms-*)`；待确认值先用组件库**原色值占位**并打 `pending` 标记（拍板后换 token 即可，结构零返工）；keep 值不生成。

**文件组织**：按组件域分文件（button / form / table / dialog / alert-message / pagination / …），文件内分区注释（如 `/* — 边框色 — */`），与库内组件族一一对应。

**选择器纪律**：逐字复刻原选择器（含伪类、`:not()`、组合器），扁平书写（`.bkms-themed .bk-input:hover:not(.is-focused)`）。

**整值重写**：渐变/阴影函数参数里的 hex 不能局部替换，整条 value 重拼（部分色未确认时等齐或手动拼）；8 位 hex 用 `color-mix(in srgb, var(--bkms-*) N%, transparent)` 拼装。

**原值注释**：每条覆写行尾注释保留原 hex，供 review 与漂移自检比对。

## 六、质量基建

- **stylelint**：`patches/bkui-theme/` 与 `patches/bkms/` 豁免**形态类规则**（`no-descending-specificity`、`selector-class-pattern`、`selector-pseudo-element-colon-notation`、`selector-attribute-quotes`、`order/properties-order`）——覆写逐字复刻 bkui/vxe 产物形态，按本项目规约改写选择器会破坏匹配；`color-no-hex` 全局启用仍待存量清完（排最后），覆写内原值只准进注释。
- **漂移自检（必要基建，非可选）**：`check-overrides.mjs` 校验 `patches/bkui-theme/` 每条选择器仍存在于 bkui dist css 且原 hex 仍在，失效即报警，库升级后必跑。注意实现细节：覆写文件首条规则的 prelude 混有文件头注释，解析时需先剥注释再判定。
- **工具链 scripts**（直接 node 执行，不占 package.json）：`stats-usage.mjs`（组件使用统计）→ `gen-overrides.mjs`（生成覆写）→ `check-overrides.mjs`（漂移自检），数据基线为 `reports/usage.json` + `mapping/keep/pending-design.json`。
- **生成器**：`gen-overrides.mjs` 从 bkui dist css 抽取"prop 非 `--` 开头且 value 含 6 位 hex"的 declaration，按选择器+prop 聚合，**只对设计已确认的值**生成覆写草稿，按组件域写入 `patches/bkui-theme/` 输出，人工只审不写；每次重跑 `rmSync` 整个 `bkui-theme/` 重建，但**绝不触碰 `patches/bkms/`**（手写补丁目录，index.css 的 bkms 段由生成器扫描追加 import）。
- **纪律**：进 `patches/` 前先试 bridge（变量定义值都能走 bridge）；patches 内禁止裸 hex。

## 七、映射表的可执行性

- 「不替换」清单 = `keep.json` 黑名单；hex 先小写化再匹配；3 位短写展开成 6 位后仅当命中 mapping 才处理；`rgba(` 人工处理。
- 写死 hex 报告"去重种类（113）+ 出现处数（549）"两列都输出。
- **spec 未收录色拆分**：spec 已收录 → `mapping.json`；未收录 → `pending-design.json`（附建议归类，标注待设计拍板），不臆断。基线已于 2026-11-06 按最新设计待确认清单同步（45 项），**设计同日全部拍板按建议值替换**——45 项已收编 `mapping.json`、`pending-design.json` 清空、patches 全量换 `var(--bkms-*)`。
- **覆写内占位清零（2026-11-06）**：覆写后新暴露的 13 种清单外 hex 分三路收编完毕——① 与设计已采纳建议值重复（1890ff/253047/d8d8d8/e6e9ea/f7f7f7）；② ΔE≤6 进最近规范色（000000/babcc0）与 spec 原色邻近（333333/fea500）；③ 借鉴"设计已采纳 45 对建议值"的实证容忍度（ΔE 中位 8.39、30/45 超 6 仍被采纳）收录剩余 3 个（333c48/aaaaaa/4070cb）。**当前覆写内 pending = 0**；`reports/pending-values.md` 仅剩 30 种未收录 hex（多为未使用组件 one-dark/ColorPicker 色），留待全局无包裹段处理。
- 判定规则待补：紫青收拢 / 色差 ≤6 进最近规范色（需求单核实后落脚本）。
- **未命中兜底**：生成器与 codemod 共用"未命中 → 补 spec → 补 mapping → 重跑"，禁止静默跳过。

## 八、非颜色 token 与 UnoCSS

- **圆角**：组件库自带 `--border-radius-base: 2px`、`--input-broder-radius: 3px`，走 bridge 重声明即可，不建业务侧 token；业务侧自有圆角按"≥3 次同语义才提 token"。
- **shadow**：6 个语义变量，`--bkms-shadow-button` 用 `color-mix(in srgb, var(--bkms-brand-2) 25%, transparent)` 实现随主题换色。
- **UnoCSS**：注册 `theme.colors.bkms`（值为 `var(--bkms-*)`），env-tag-* 改 `!bg-bkms-brand-6` 短写法；已知限制：纯 var() 值不支持 `/50` alpha 修饰符，半透明显式写 color-mix。

## 九、运行时多主题预留（本期只留口子）

- 色阶一律挂 `:root`（colors.css）；`[data-theme="green"]` 未来只覆盖色阶层，语义层与消费方自动跟随。
- `index.html:9-16` 的 dark class 死代码可复用为 `data-theme` 挂载点。
- 换肤不漏色的前提：`--bkms-*` 色阶只允许在 colors.css 定义。
- dark 主题审计备注：dark 需翻转 neutral 色阶的文字/背景用途，且 bkui 深色组件（`--menu-bg-color`/`--submenu-bg-color`）需反向覆盖——记入需求单输入，不在本次执行。

## 十、决策清单

1. ~~编译期替换选型~~ → **已决策退役**。
2. **JS 内联样式**：inline style 无法被 class 覆写覆盖（除非 !important 或 JS 改写），维持 Step 0 盘点开关。
3. **需求单原文**：6 大块数值、紫青/色差规则——待提供后核实回填。
4. **存量 `bk-patch.css` 归宿**：审计后布局/尺寸规则迁入全局无包裹段。
5. **dark class 挂载点 / echarts 内联色 / spec 未收录色**：同 v3，待定项不变。

## 十一、流程约定

- 新增颜色先查 spec 色阶；禁止业务代码直接写新 hex；`--bkms-*` 色阶只在 colors.css 定义。
- 改组件库变量声明只允许出现在 patches/*/variables.css。
- patches 内禁止裸 hex（原值只准进注释）；进 patches 前先试 bridge。
- 映射字典与 spec 同步维护；未命中色值走统一消化流程，禁止静默跳过。
- stylelint `color-no-hex` 全局启用替代人工 grep。
- teleport 组件覆写天然被 `body.bkms-themed` 覆盖，patches 不依赖业务 scoped 作用域。
- **Git 纪律**：大步骤拆子分支、点位强制 commit、验证后合入，细则见 `THEME_STEPS.md`。

## v0~v3 勘误与合并记录

| 来源 | 位置/问题 | 处理 |
| --- | --- | --- |
| v0 | "改 :root 变量即可全局换肤"（过强） | 修正为"变量 + 写死色混杂" |
| v0 | `--bk-color-*` 凭记忆编造 | 改用实测 :root 清单 |
| v0 | 圆角结论"4px 主导、不建 token" | 修正为"圆角走 bridge" |
| v0/v1 | 无写死色处理步骤（致命漏项） | 独立成步（v4 定为 class 覆写批） |
| v1 | `:root` 126 个、hex 113 处口径不明 | 修正为 129 个、113 种 / 549 处 |
| v2 | 未命中色值静默漏替换 | 补"未命中清单"兜底 |
| v2/v3 | bridge 引入依赖 glob 顺序假设 | 改为 bkui.ts 内显式相邻引入 |
| v4 初版 | 编译期替换（postcss）与条目级设计确认流程粒度错位 | **原地覆盖：退役编译替换，改 class 覆写制** |

## 待核实项（阻塞回填，不阻塞颜色主链路）

1. 需求单原文：6 大块具体数值。
2. 紫青收拢 / 色差 ≤6 判定规则的原文表述。
3. JS 内联样式盘点结论。
