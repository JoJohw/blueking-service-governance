# 主题色适配操作步骤 v4

> 版本记录：v0 = `THEME_STEPS.md`；v1 = `THEME_STEPS-v1.md`（修正变量体系、新增编译期替换 Step 2、Git 执行规约）；v2 = `THEME_STEPS-v2.md`（口径注明、未命中兜底、语义映射写死）；v3 = `THEME_STEPS-v3.md`（合并多主题蓝图、bridge 引入位修正）；v4 = 本文件。
> **v4 修订点**：① Step 0 mapping 拆分「spec 已收录 / 待设计确认」；② Step 2 编译替换收敛为 postcss 首选 + 跳过变量定义 + 覆盖渐变函数参数；③ Step 5 合入顺序显式确认；④ Step 7 补 dark 主题审计。
> 依据：`docs/THEME-v4.md`。每步 = 操作 + 验证标准 + 回滚方式。一个 PR 对应一步或一步的一个子批。
> **范围声明**：本流程只覆盖「颜色映射」+ 令牌地基；运行时第二主题、圆角/导航/表格/工具栏/成员管理待需求单核实后补版本。

## Git 执行规约（防错与回滚，同 v3）

需求量大、改动点多，全程**子分支执行、点位 commit、验证后合入**，任何时刻不动已认可的主分支。

**分支模型**

```
feature/xxx（主特性分支：只进合入后的内容，不在其上直接改）
 ├── theme/step0-prep
 ├── theme/step1-tokens-bridge
 ├── theme/step2-build-replace
 ├── theme/step3-patch-audit
 ├── theme/step4-global
 ├── theme/step5-codemod-components
 ├── theme/step5-codemod-pages-<目录名>
 └── theme/step6-manual
```

**AI 执行授权**

- `git checkout -b` / `git add` / `git commit`：到达下方规约点位可自主执行，无需逐步确认。
- `git merge` / `git rebase` 回主特性分支：**前置条件 = 子分支通过该步验证标准**；合入后在主分支跑一次 `pnpm lint` + 构建，确认无误才开下一个子分支。
- `git push`、删除分支、任何触及远端 / 主干的操作：先询问。

**Commit 点位**（每步至少一个，关键点位强制）

| 点位 | 分支 | commit 时机 |
| --- | --- | --- |
| Step 0 | theme/step0-prep | mapping/keep/待确认清单 + 脚本 + 目录骨架就位、自检通过 |
| Step 1 | theme/step1-tokens-bridge | tokens/bridge/引入位落地；混态走查清单整理完再补一个 commit |
| Step 2 | theme/step2-build-replace | 插件落地且 dev/build 双验证通过；产物 grep = 0 后 |
| Step 3 | theme/step3-patch-audit | 每删/改一条规则一个 commit |
| Step 4 | theme/step4-global | UnoCSS 注册、main.css、vxe 覆盖可各一个 commit，或合并一个 |
| Step 5 | theme/step5-codemod-* | 每目录一分支；脚本跑完、人工抽查通过后才 commit |
| Step 6 | theme/step6-manual | 每个独立子项一个 commit |
| Step 7 | —（主分支） | 纯验收，不改代码，无 commit |

**回滚约定**

- 子分支内出错：`git checkout <主分支>` → `git branch -D theme/stepN-xxx` 丢弃重来。
- 已合入后发现错误：主分支上 `git revert` 对应 merge commit。
- codemod 批量改动天然适合此模式：脚本永远在子分支上跑，结果不满意整分支丢弃。

**message 规范**：`theme(stepN): <动作>`，如 `theme(step2): add postcss transform for dist css`。

## Step 0 前置准备

**操作**

1. `bkms-color-spec.md` 收编进 `docs/`。
2. 新建目录骨架 `src/theme/`：`tokens.css`、`bridge.css`、`patches/`（form/table/dialog/feedback/navigation 五个空文件）、`themes/`（留空）、`index.css`。
3. 新建 `scripts/theme-codemod/`，三份 JSON（key 统一小写）：
   - `mapping.json`：spec「颜色映射」表逐行录入。
   - `keep.json`：spec「不替换」清单 + 业务确认保留色（如 echarts 待拍板项）。
   - `pending-design.json`（v4 新增）：**spec 未收录的 bkui 旧色清单**（`#f0f8ff`/`#fff4e2`/`#ffeded`/`#eaf3ff`/`#3f87ff`/`#182132` 等），附参照同类项的**建议**归类，标注"待设计拍板"。**不进 mapping，不臆断归类**。
   - 占位：紫青收拢 / 色差 ≤6 判定规则（需求单核实后落成第三段逻辑，进 `rules.md` 或脚本常量）。
4. codemod 脚本：遍历 `src/**/*.{vue,css,ts}`，**先小写化** → 查 keep（跳过）→ 查 mapping（替换为 `var(--bkms-*)`）；`rgba(` 不处理；3 位短写展开成 6 位后仅当命中 mapping 才替换。产出报告（文件 + 处数 + 未命中清单）。
5. **同一份 mapping.json 供两处消费**：业务 codemod（Step 5）与编译期替换（Step 2）——单一真源。
6. **显式待定开关：编译替换是否覆盖 `.js` 内嵌样式字符串**——组件库 JS 内联样式不在 postcss 对 css 的处理范围。Step 2 动手前先盘点组件库 JS 内是否存在色值，据结果决定是否另加 JS 处理；默认只处理 css。

**验证**：覆盖率自检（未命中色值反查 spec，区分"已在 pending-design"与"全新未记录"）；mapping/keep 交集报错；mapping 与 pending-design 无交集。

**回滚**：删 `scripts/theme-codemod/` 与 `src/theme/` 骨架。

## Step 1 基建批（tokens + bridge）

**操作**

1. `src/theme/tokens.css`：照抄 spec 两张表（色阶 + 语义层 + 阴影），色阶全部挂 `:root`，语义层用 `var()` 引用色阶；`--bkms-shadow-button` 用 `color-mix(in srgb, var(--bkms-brand-2) 25%, transparent)`。
2. `src/theme/bridge.css`：变量清单从 `node_modules/bkui-vue/dist/style.variable.css` 的 `:root` 块实抓（THEME-v4 第一节已列全 129 个及口径，仍以实抓为准），高频优先：
   - 全局组：`--primary-color`/`--success-color`/`--warning-color`/`--danger-color`/`--default-color`/`--gray-color`/`--light-gray`/`--border-color`/`--disable-color`/`--disable-bg-color`/`--white-color`/`--whitesmoke-color`
   - 组件级组按走查重点补：`--button-*`、`--menu-*`、`--table-*`、`--input-*`、`--link-*`、`--message-*`
   - **语义映射口径写死**：`--white-color`→`--bkms-neutral-10`；`--whitesmoke-color`→`--bkms-neutral-8`；`--gray-color`→`--bkms-neutral-3`；`--light-gray`→`--bkms-neutral-4`。
   - 禁止声明清单外变量；禁止凭记忆写 `--bk-color-*`（实测 0 命中）。
3. **引入位**：
   - `main.ts` 顶部：`import '~/theme/tokens.css';`
   - `src/modules/bkui.ts`：在 `import 'bkui-vue/dist/style.variable.css';` **紧接其后**加 `import '~/theme/bridge.css';`
   - `main.css` 末尾：`@import '~/theme/index.css';`（`index.css` 按序 `@import './patches/*.css'`）

**验证**

1. 整页刷新：按钮/表格/表单/弹窗中**走变量的部位**变色。
2. 写死色部位不变——**预期内的混态，不是 bug**（549 处写死 hex），逐个记录作为 Step 2 对照清单。
3. Devtools 确认 `:root` 上 `--primary-color` 解析为 `#3B6EF5`；`--whitesmoke-color` 解析为 `#F7F9FD`（非纯白）；确认 bridge.css 的 `<style>` 确实在 `style.variable.css` 之后（引入位生效）。

**回滚**：删两处 import + 一行 `@import`。

## Step 2 编译期替换批（postcss 首选）

**操作**

1. `vite.config.mts` 新增 postcss 插件（配在 `css.postcss.plugins`；vite transform 为备选）：
   - 匹配范围：`bkui-vue/dist/*.css`（插件内判断 `result.opts.from` / `root.source.input.file` 路径）；JS 内联范围按 Step 0 开关结论。
   - 替换规则：读 `mapping.json`，hex → `var(--bkms-*)`；命中 `keep.json` 跳过；**先小写化再匹配，仅 6 位 hex，不碰 3 位短写与 `rgba()`**。
   - **跳过变量定义**：`decl.prop.startsWith('--')` 的 declaration 一律跳过（变量定义值归 bridge）；其余 declaration 的 **value 全文**做替换（覆盖 `color`/`background` 及渐变、阴影函数参数里的 hex）。
   - **未命中兜底**：既不在 mapping 也不在 keep 的色值禁止静默跳过——输出"未命中色值清单"，走"未命中 → 补 spec → 补 mapping.json → 重跑"；若命中 `pending-design.json`，标注"待设计"而非静默。
   - **不读写 node_modules 磁盘文件**——只改流经构建管线的文本。先例：本仓库 `html-version` 插件（161-167 行）改 index.html 占位符（注意其为 `transformIndexHtml` 钩子，非 CSS transform 先例）。
2. **先验证拦截能力**：写最小插件，dev 下 `console.log` 确认拿到 `style.variable.css` 文本，再展开替换逻辑。若 dev 下拿不到，改用 vite `transform` + `enforce: 'pre'` 方案（备选）。
3. dev 与 build 行为一致性确认（`pnpm dev` 与 `pnpm build` 各验一次）。
4. 处理边界 case：`#3a84ff` 出现在渐变/阴影函数内时 `var()` 依然合法（CSS 函数参数可为变量），无需特殊处理；JS 内联覆盖结论回填到插件配置与本文。

**验证**

1. Step 1 记录的混态清单逐个复核：写死部位已变新色（按 549 处出现量，重点核对 `#3a84ff` 59 处、`#2c77f4` 等主力）。
2. **未命中清单已消化**：清零或全部进了 spec/mapping/keep/pending-design。
3. Devtools 无变量未定义告警；`pnpm build` 产物 dist 内 grep 旧色 = 0（keep 除外）。
4. 目检重点组件（按钮 hover/active、表格边框、message、radio、侧栏底 `#182132`）无半新半旧。

**回滚**：去掉插件配置即回原状（独立 PR）。

## Step 3 存量 patch 审计

**操作**：逐条过 `src/styles/bk-patch.css` 19 条规则。**实测基本无色值（仅 `.popover-dark-translucent` 一处 rgba 黑色气泡）**，三分类处理：

- 动机已被 bridge/编译替换替代 → 删。
- 与颜色无关的布局/尺寸修正（padding/z-index/min-width/height 等）→ 保留，迁入 `patches/` 对应域。
- 刻意视觉（半透明深色气泡、去边框）→ 保留，涉色值（1 处 rgba）顺手变量化或按 spec shadow 处理。

结论表附 PR。**未走查完不删任何一条。**

**验证**：与 Step 1/2 走查结果合并看；patch 兜着的部位删除后仍正确。

**回滚**：revert 单 PR。

## Step 4 全局层替换（含 UnoCSS 注册）

**操作**

1. `uno.config.ts`：
   - 注册 `theme.colors.bkms`，值为 `var(--bkms-*)`（`brand-2: 'var(--bkms-brand-2)'` 等）。
   - `env-tag-*` 4 个 shortcuts 改 `!bg-bkms-brand-6 !text-bkms-brand-2` 等短写法。
2. `src/styles/main.css` 约 14 处硬编码色 → `var(--bkms-*)`。
3. vxe 变量覆盖换 token：`src/pages/basic/base-info/permissionModel.vue:238`；`src/pages/application/detail/deploy/env-var-precheck-dialog.vue:531-535`。

**验证**：对应页面目检；`pnpm lint`；UnoCSS 无 `/50` alpha 修饰符误用（短写法不生效的需显式 color-mix）。

**回滚**：单 PR revert。

## Step 5 codemod 批（分目录推进）

**操作**

1. **合入顺序（v4 显式确认）**：先 `src/components/`（64 文件），目检后合入；再 `src/pages/`：application → env → basic → 其余。**合入主干亦按此顺序**——pages 依赖 components/common，避免 pages 先合入时引用未合入的 components 改动。
2. 每目录一个 PR；人工抽查 diff 两类误替换：
   - `.ts/.js` 颜色字符串（echarts、动态注入）——不在 CSS 变量作用域，**回退原样并登记** Step 6 清单；
   - svg fill——排除或保留，提前定。
3. 报告未命中新色值：不现场造 token，先补 spec → 补 mapping.json → 重跑（若属 pending-design 则标注待设计）。

**验证**：`pnpm lint`；每目录抽 2~3 页目检无混色。

**回滚**：按 PR revert。

## Step 6 人工批（脚本盲区）

**操作**

1. `.ts/.js` 动态注入（已知 `composables/use-env-manager.ts` 4 处，97-100 行）：确认注入点在 DOM 树内后改 `var(--bkms-*)`，否则 `getComputedStyle` 读 token。
2. echarts 内联色：是否 token 化待拍板（可整体保留并进 keep.json）。
3. `rgba(`：遮罩类多数保留；阴影对照 spec 6 个 shadow 变量。
4. Step 1/2 走查漏网组件收编：能 bridge 的进 `bridge.css`，不能的进 `patches/` 对应域并注明原因。
5. **teleport 组件（Modal/Select 下拉/Message）**：确认 `:root` 变量沿 DOM 继承生效；`patches/` 覆盖用全局类名（不用 scoped）。

**验证**：清单清零；逐项目检。**回滚**：逐项独立提交。

## Step 7 收尾验收

**操作**

1. 全库 grep（排除 keep、svg、echarts 登记项）：
   ```powershell
   rg -i "#(3a84ff|dcdee5|63656e|c4c6cc|ea3636|f5f7fa|313238|4d4f56|979ba5|f0f1f5|e1ecff|eaf3ff)" src --glob "!*.svg"
   ```
2. **双链路终验**：dist 产物内旧色 grep = 0（编译链）+ 全页走查无混色（运行链）。
3. **防回潮落位**：stylelint 启用 `color-no-hex`，仅豁免 `tokens.css`；跑一次 stylelint 确认 0 违规。
4. spec / mapping.json / 代码三方一致性抽查（随机 5 个 token 反向溯源）。
5. **多主题预留自检**：确认 `--bkms-*` 色阶只定义在 `tokens.css`（grep 其他文件 0 命中）；手动在 devtools 给 `html` 加 `data-theme` 类验证覆盖色阶能整体换色。
6. **dark 主题审计备注（v4，作为需求单输入，不执行）**：记录"dark 主题需额外审计 bkui 深色组件（`--menu-bg-color`/`--submenu-bg-color`）是否需反向覆盖"到需求单输入，不在本次执行。
7. THEME-v4 第九节流程约定落进 CR checklist。

**DoD**：改一个 `--bkms-brand-2` 值，业务页与 bkui 组件**全部**（含写死路径）同时变色，且无需改任何业务文件。

## 依赖关系

```
Step 0 ──► Step 1 ──► Step 2（编译替换，依赖 mapping.json + Step 0 开关结论）
              ├─► Step 3（patch 审计，依赖 Step 1/2 走查结果）
              └─► Step 4（全局层）──► Step 5（codemod）──► Step 6（人工）──► Step 7
```

Step 2 与 Step 3/4 可并行；Step 2 上线前 Step 1 独立存在会造成可预期的混态——两步应同批合入主干（分 PR 但同批发布）。

## 待核实项（需求单提供后回填新版本）

1. 6 大块具体数值（圆角 2px→6px、行高 42、表头 `#FBFCFE`、菜单 30px/40px、工具栏箭头 12px 等）。
2. 紫青收拢 / 色差 ≤6 判定规则原文 → 回填 Step 0 判定逻辑。
3. 成员管理工具栏对齐的具体范围。
