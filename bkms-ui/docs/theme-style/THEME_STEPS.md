# 主题色适配操作步骤

> 版本记录：v0~v4 见 git 历史（`THEME_STEPS-v1.md` ~ `THEME_STEPS-v4.md`，2026-11-06 起文件名不再带版本后缀）。本文为现行版，同步 2026-11-06 目录重排（theme → `src/styles/theme/`，patches 分 `bkui-theme/` 生成 + `bkms/` 手写）与设计确认值收编进度。
> **关键修订**：① Step 2 整体替换——编译期替换退役，改为 **class 覆写批**（作用域挂载 + 生成器 + 漂移自检）；② Step 7 验收口径更换。依据：`THEME.md`。
> 每步 = 操作 + 验证标准 + 回滚方式。一个 PR 对应一步或一步的一个子批。
> **范围声明**：只覆盖「颜色映射」+ 令牌地基；运行时第二主题、其余视觉块待需求单核实后补版本。

## Git 执行规约

主特性分支只进不改；每步开子分支（Step 2 分支名 `theme/step2r-class-override`）；规约点位强制 commit；子分支验证通过后 merge 回主分支并跑 lint + 构建；push / 删分支 / 远端操作先询问。message 规范 `theme(stepN): <动作>`。

## Step 0 前置准备（已执行）

已落地：`scripts/theme-codemod/`（`mapping.json` / `keep.json` / `pending-design.json`、`codemod.mjs`、`extract-root-vars.mjs`、reports）、`src/styles/theme/` 结构（tokens/colors + tokens/semantic + bridge + patches/bkui-theme + patches/bkms + themes + index.css）。

**实施调整**：

1. JS 内联开关语义微调：编译替换退役后，问题变为"**inline style 无法被 class 覆写覆盖**"——盘点组件库 JS 内联样式后，命中项只能走 `!important` 覆盖或 JS 改写，单独登记决策。
2. `gen-overrides.mjs` / `check-overrides.mjs` 的配置（输入路径、分域规则）进 `rules.md`。

**验证**：mapping/keep/pending-design 三者两两无交集；未命中清单区分"已在 pending-design"与"全新未记录"。

## Step 1 基建批（已执行）

已落地：colors / semantic / bridge / 引入位（bkui.ts 内显式相邻）、语义映射写死（`--white-color`→neutral-10、`--whitesmoke-color`→neutral-8、`--gray-color`→neutral-3、`--light-gray`→neutral-4）。

**增量（已落地 2026-11-06）**：`src/main.ts` 启动时 `document.body.classList.add('bkms-themed')`（运行时挂载——本项目 app.mount 在异步回调之后，时序安全；teleport 到 body 的弹层天然在作用域内）。

**验证**：body 类存在；teleport 弹层（Select 下拉）DOM 在 body 内、天然处于覆写作用域；bridge 变量解析正确（`--primary-color` = `#3B6EF5`）。

## Step 2R class 覆写批（替换原编译替换批，核心）——已执行 2026-11-06

**实施记录**（commit 08b86b1 / 038754a / 4d24f96 / 9a8e5ab）：

- 数据基线：`pending-design.json` 按最新设计待确认清单同步为 45 项（四组），`add-source.mjs` 重跑补溯源。
- 生成器 `gen-overrides.mjs`：只解析实际加载的 `style.variable.css`；组件→类前缀**别名表**（Dialog→`modal` 族、DatePicker→`picker-panel`/`picker-confirm` 族）；值四分类；8 位 hex 已确认值用 color-mix、未确认整条占位；index.css 的 patches 清单由生成器接管。
- 产出：**31 组件 / 270 规则 / 325 声明**（button/link/loading 在变量版产物中零写死 hex，颜色全走 `--button-*` 等变量——桥接层已覆盖，正确地不生成文件）。button 使用量最大但桥接即可。
- 未归属规则 176 条进 `reports/gen-summary.md`：约 130 条属未使用组件（cascader/color-picker/code-diff/notify/slider/pagination/…，正确跳过），其余为通用工具类（滚动条、`.bk-popper`、fieldset、autofill）——归后续"全局无包裹段"（Step 3/6），不阻塞本轮。
- stylelint：patches 豁免形态类规则（`no-descending-specificity`/`selector-class-pattern`/`selector-pseudo-element-colon-notation`/`selector-attribute-quotes`/`order/properties-order`）；colors/bridge 既有格式违规已 `--fix` 顺手清掉。
- `check-overrides.mjs`：270/270 有效。踩坑记录：patches 首条规则的 prelude 混有文件头注释，`startsWith('.bkms-themed')` 判定前必须先剥注释——曾导致每文件漏检 1 条（infobox/progress/switcher 三文件当时完全未被自检覆盖）。
- 工具链入口：`npm run theme:usage` / `theme:gen` / `theme:check`。
- **设计确认收编（2026-11-06）**：设计拍板 45 项全部按建议值替换 → 收编 `mapping.json`、`pending-design.json` 清空、重跑 `theme:gen` 后覆写内这 45 色全部换 `var(--bkms-*)`，漂移自检 270/270。覆写内新暴露 13 种清单外 hex（24 处）按原值占位并进台账"覆写内占位"组。
- **覆写内占位清零（2026-11-06）**：13 种分三路收编——与已采纳建议值重复 5 种、ΔE≤6 / spec 原色邻近自动收录 4 种、借鉴已采纳 45 对的实证容忍度收录 3 种（ΔE 中位 8.39、30/45 对超 6 仍被采纳，证明该模式可取）。`mapping.json` 总量 199，覆写内 pending = 0。

**操作**

1. **生成器 `gen-overrides.mjs`**：
   - 输入：`node_modules/bkui-vue/dist/*.css`；数据：`mapping.json`（已确认值）+ `keep.json`。
   - 抽取：prop 非 `--` 开头且 value 含 6 位 hex（先小写化）的 declaration，按"选择器 + prop"聚合。
   - 过滤：仅生成 mapping 已收录**且设计已确认**的值；`pending-design.json` 内的值不生成，进"待确认清单"。
   - 输出：选择器加 `.bkms-themed ` 前缀、逐字复刻原选择器（含伪类/组合器），值写 `var(--bkms-*)`；渐变/阴影**整值重拼**；8 位 hex 用 color-mix；**原值保留为行尾注释**。
   - 分域：按 bkui 组件前缀写入 `patches/bkui-theme/` 对应文件（button / form / table / dialog / alert-message / pagination / …，每组件一文件，文件内分区注释），`index.css` 同步 @import（bkms 手写补丁段由生成器扫描 `patches/bkms/` 追加）。
2. **stylelint 配置**：`patches/` 目录豁免 `no-descending-specificity`。
3. **人工审查生成草稿**：重点核伪类复刻、组合选择器、渐变整值重拼；patches 内禁止裸 hex（原值只准在注释）。
4. **退役编译替换**：删 `vite.config.mts` 的 postcss import 与 `css.postcss` 配置；删 `scripts/theme-codemod/postcss-theme-replace.mjs`。
5. **漂移自检 `check-overrides.mjs`**：校验 patches/ 每条选择器在 bkui dist css 中仍存在且原 hex 仍在，失效清单输出；挂 dev 启动（或 CI）。

**验证**

1. Step 1 混态清单复核：**已确认项变色；未确认项保持旧色并进清单**（新常态，非 bug）。
2. Devtools 抽查：`.bkms-themed` 前缀选择器命中且 computed style 为新值；teleport 弹层（Modal / Select 下拉 / Message）覆写生效。
3. Devtools 无变量未定义告警；`pnpm lint` 通过（含 stylelint 豁免生效）。
4. 漂移自检 0 失效。

**回滚**：删 patches 新增内容 + 还原 vite.config 接线（分支内整体丢弃即可）。

**commit 点位**：生成器 + 挂载一个 commit；草稿审查通过一个 commit；退役 + 自检脚本一个 commit。

## Step 3 存量 patch 审计（口径微调）

19 条规则三分类：动机被 bridge 替代 → 删；布局/尺寸规则 → 迁入**全局无包裹段**（`patches/bkms/` 手写文件，无 `.bkms-themed` 前缀——作用于 body/html 自身或需全局生效）；涉色规则（1 处 rgba 气泡）→ 变量化后入全局段。结论表附 PR。**未走查完不删任何一条。**（注：`patches/bkms/feedback.css` 与 `table.css` 为原手写补丁，已恢复保留。）

## Step 4 全局层替换（同前版）

UnoCSS 注册 `theme.colors.bkms` + env-tag-* 短写法；`main.css` 约 14 处硬编码色变量化；vxe 覆盖换 token（`permissionModel.vue:238`、`env-var-precheck-dialog.vue:531-535`）。

## Step 5 codemod 批（同前版）

先 `src/components/` 后 `src/pages/`（application → env → basic → 其余），合入顺序不变；`.ts/.js` 颜色字符串回退并登记；svg fill 提前定；未命中新值走统一消化流程。

## Step 6 人工批（微调）

动态注入（`use-env-manager.ts` 4 处）、echarts（待拍板）、rgba 阴影对照 spec；**漏网组件统一收进 `patches/`**（bkui 组件进 `bkui-theme/`、业务/第三方进 `bkms/`；注明"bridge 够不着"，不再有编译替换选项）；JS 内联命中项按 Step 0 开关结论处理。

## Step 7 收尾验收（口径更换）

1. 全库业务侧 grep 旧色（排除 keep/svg/echarts）。
2. ~~dist 产物内旧色 grep = 0~~ **作废**。替换为：
   - 已确认项 computed style 全为新值（抽查清单化）；
   - 漂移自检 0 失效；
   - **未确认项清单**：页面残留旧色的完整清单及设计确认状态，随确认进度逐步收敛。
3. 防回潮：stylelint `color-no-hex` 全局启用，仅豁免 colors.css。
4. 多主题预留自检：`--bkms-*` 色阶只在 colors.css（grep 其他文件 0 命中）。
5. dark 主题审计备注记入需求单输入，不在本次执行。

**DoD**：改一个 `--bkms-brand-2` 值，业务页与 bkui 组件**已确认覆盖的部分**全站联动变色；未确认项随设计确认收敛，收敛完成后达成全站联动。

## 依赖关系

```
Step 0（已落） ──► Step 1（已落 + 挂载增量）──► Step 2R（class 覆写批）
                        ├─► Step 3（patch 审计 → 全局无包裹段）
                        └─► Step 4 ──► Step 5（codemod）──► Step 6 ──► Step 7
```

Step 2R 不要求与 Step 1 同批发布——覆写运行时渐进生效，未确认项本来就该保持旧色，无混态窗口期约束。

## 待核实项（同前版）

1. 需求单 6 大块数值；2. 紫青收拢 / 色差 ≤6 规则原文；3. JS 内联盘点结论。
