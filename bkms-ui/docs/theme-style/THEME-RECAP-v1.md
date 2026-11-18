# 主题色主线复盘与现状快照（v1）

> 新文件，按项目约定带版本后缀；不覆盖 `THEME.md`（体系指南）与 `THEME_STEPS.md`（步骤清单）。
> 依据 **commit 的实际 diff**，不依据 commit message；日期 2026-11-18。
> 统计口径：`git log -- src/styles/theme scripts/theme-lint scripts/theme-codemod stylelint.config.mjs`。

## 一、口径与总览

| 项 | 实测值 |
| --- | --- |
| 主线 commit | 35 个（含合并提交），2026-08-03 `7e26d572` → 2026-11-18 `83c86081` |
| 文件改动次数 | 402 |
| 增删行 | +14995 / -7344 |
| 本轮追加 | `5864dd19`、`6bc2aff1`、`bfdb9148`、`ecd6955a`（第三方字典三批 + 补提交） |

`THIRD-PARTY-THEME-v2.md` §10 记录的是「31 个提交 / +15235 / -7733 / 396 次改动」，为方案撰写时的口径；差异来自合并提交是否计入、统计路径范围，本文以当前仓库实测为准，不改写历史文档。

## 二、主线时间线（commit → 实际 diff → 当时解决的问题）

| 日期 | commit | 实际改了什么 | 解决的问题 |
| --- | --- | --- | --- |
| 08-03 | `7e26d572` | 初始提交 | — |
| 11-04 | `d33babd5` | 新增 `THEME-v4.md` / `THEME_STEPS-v4.md`、`codemod.mjs`、`extract-root-vars.mjs`、`bridge-notes.md`、`keep.json`；`package.json` 挂编译替换 | 建立 bkms 令牌、组件库桥接与 postcss 编译期替换 |
| 11-04 | `c3f8d9cf` | 组件目录批量变量替换 | 业务侧色值从字面量迁到变量 |
| 11-06 | `31dd8251` | 新增 `gen-overrides.mjs`（367 行）、`check-overrides.mjs`、`add-source.mjs`，重写两份方案文档 | 编译替换改为 bkui class 覆写层，并加漂移自检 |
| 11-06 | `bb28cc64` | `src/theme/bridge.css` → `src/styles/theme/`；新增 `theme/index.css`、`patches/bkms/feedback.css`、`table.css` | 生成器清理误删手写补丁后恢复，并把 patches 按 `bkui-theme` / `bkms` 分域 |
| 11-06 | `aa9f621a` | `gen-overrides.mjs` +193 行、`check-overrides.mjs` +66 行；`uno.config.ts` 把 `color-mix` 注释、`THEME_DIR` 换成 `resolveThemeDir()`，并写明扁平 key | 级联保护（涉色声明随行生成、transparent/keep 保原值）、双源扫描、`import.meta.url` 在 unconfig 打包后指向临时目录、uno 嵌套注册静默丢失 |
| 11-06 | `283c2a0a` | `theme/index.css` 由 66 行缩到静态清单；`gen-overrides.mjs` 清理逻辑改写；`bkui.ts` 加载点调整 | 桥接拆为各域 `variables.css`，每域单一聚合入口；变量层不走 index.css |
| 11-06 | `77c7714b` | 新增 `bkui-theme-literal/{collapse,slider,index}.css`，`mapping.json` 收编 5 组前缀 | lib/\*.less 编译产物选择器更具体，字面量版需单独复刻；hljs 第三方主题色豁免扫描 |
| 11-09 | `597f26b5` | 语义化升级；`resource-topology.vue` 的 `fill: '#FFFFFF'` 被改成 `fill: 'var(--bkms-text-inverse)'` | 业务全面语义化；这次改动也是后续 canvas 透明回归的源头 |
| 11-11 ~ 11-12 | `e31c806b` / `d27a840e` | 新增 `styles/bkms.css`，`App.vue` 与多个页面壳层改用语义变量 | 导航 / 菜单 / 筛选条等散落色收编 |
| 11-13 | `d0a368da` | `package.json` 去掉工具链脚本、`add-source.mjs` 删除、双源覆写合并单目录、`mapping.json` 收敛 | 工具链与构建解耦，产物形态定版 |
| 11-15 | `b672169b` | `eslint.config.mjs` +82 行、`theme-lint.test.mjs` +753 行、`vitest.config.mts` 新增 | 四条 eslint 规则接管色值治理，配套 142+ 单测 |
| 11-16 | `01b3f5b0` | `dev/palette/` 整套（App.vue +804 行、README、CHANGELOG） | 设计改色可查询 / 可比对色差 |
| 11-17 | `9dee3d2b` | 删除 `data/color-diff-backup.json`（775 行）、`mapping.json`（243 行）、`pending-design.json`（207 行） | codemod 产物自举，一次性台账退役 |
| 11-17 | `d3637262` | `colors.css` + `semantic.css` 合并为 `color.css`、删 `patches/bkms/index.css`、样式拆 app/overrides 两层 | 令牌真源收敛为单文件 |
| 11-17 | `a8019490` | 新增 `radius.css` 与 palette 的 `RadiusPreview.vue`（465 行） | 圆角进入语义令牌维度 |
| 11-18 | `83c86081` | `plugin.mjs` 由 671 行拆为 `rules/color.mjs`（574 行）、`rules/radius.mjs`、`rules/shared.mjs` | 一个维度一个模块，聚合入口只合并导出 |
| 11-18 | `f8e6b7da` | `constants.ts`、`resource-topology.vue`、`artifact-expand.vue`、`monitor-chart-bridge.ts` 的 `var()` 改回实色 | G6 / ECharts 的 canvas 渲染路径不解析 CSS 变量 |
| 11-18 | `5864dd19` / `6bc2aff1` / `bfdb9148` / `ecd6955a` | viz 字典与桥接层、四库适配、9 个 vendor 覆写、漂移校验脚本 | 第三方库着色体系统一到 `--bkms-viz-*` |

## 三、关键决策档案

1. **class 覆写取代编译期替换**（`31dd8251`）：postcss 替换层退役，改生成器产出带 `.bkms-themed` 的覆写规则；`check-overrides.mjs` 对 `style.variable.css` + `dist/style.css` 双源校验。
2. **uno 令牌扁平注册**（`aa9f621a` diff 注释明确）：unocss 按 `-` 切段逐层查 theme，嵌套 `{ bkms: { 'brand-6' } }` 会把类名拆成 `bkms/brand/6` 而静默丢弃；`resolveThemeDir()` 用 cwd 优先 + `colors.css` 存在性兜底。
3. **级联保护与双源扫描**（`aa9f621a`、`77c7714b`）：覆写规则的全部色彩类声明随行生成；`transparent` / keep 保留原值；字面量版单独成域。
4. **桥接分域、每域单一聚合入口**（`283c2a0a`）：变量层由 `bkui.ts` 紧随 `style.variable.css` 加载，不走 `index.css`，避免 `:root` 后者覆盖。
5. **产物自举与一次性脚本退役**（`9dee3d2b`）：`mapping.json` / `pending-design.json` / 备份文件不再入库，色值真源收敛到 `color.css`。
6. **规则插件拆分**（`83c86081`）：颜色 / 圆角各自成模块，`plugin.mjs` 只做聚合；`map.mjs` 与 `uno.config.ts` 同源，避免两套真源。
7. **semantic.css 冻结、magicbox 不接入**：`@blueking/magicbox-theme` 与本项目架构同构但色板是另一套规范，暂不接入；新语义走 shortcut 语义类或场景类，不再往语义文件加条目。
8. **第三方库统一颜色来源、各自最后一公里**（本轮）：canvas 类库用 `readVizVar` 取实色，变量覆盖型直接消费 CSS 变量，硬编码型走 `patches/vendor/` 覆写；`@locked` 色（series 8 色、语法高亮）不随品牌主色漂移。

## 四、踩坑清单

| 坑 | 实证 | 结论 |
| --- | --- | --- |
| 生成器清理丢手写补丁 | `gen-overrides.mjs` 的 `cleanGeneratedDir` 除 `variables.css` 白名单外全量 `rmSync` | 手写补丁必须与生成产物平级分域，且清理只删自有 `<kebab>.css` |
| canvas 不解析 `var()` | `597f26b5` 把 minimap `fill` 改成 `var(...)` → `f8e6b7da` 改回实色 | 字典经 var 链解析后必须是实色，桥接层负责解析与兜底 |
| `import.meta.url` 指向临时目录 | `aa9f621a` 引入 `resolveThemeDir()` | cwd 优先 + 存在性校验 |
| `var()` 尾随 `]`、`.ts` 替换不在台账范围 | codemod 替换口径 65 处 `<script>`、明确不含 `.ts` | 记为已知盲区，不假装已全量覆盖 |
| 根 `.gitignore` 的 `*vendor*` | 本轮 `bfdb9148` 提交后才发现 `scripts/theme-check-vendor.mjs` 与 `patches/vendor/` 被忽略，追加 `ecd6955a` 补提交 | 新增含 vendor 字样的路径必须 `git status --untracked-files=all` 复核 |
| markdown 自定义属性 camelCase | `github-markdown-css` 的 `--fgColor-*` 触发 stylelint `custom-property-pattern` | 第三方变量名必须同名重指向，用定点 `stylelint-disable` 而不是改配置全局放宽 |

## 五、现状快照

| 层 | 规模 |
| --- | --- |
| `tokens/color.css` | 104 个令牌（色阶 68 / 语义 28 / 阴影 8） |
| `tokens/viz.css` | 33 个令牌，`@viz-pending` 5 项、`@viz-locked` 8 项 |
| `patches/bkui-theme/` | 42 个 CSS（含 `index.css` 与 `variables.css`） |
| `patches/vendor/` | 10 个 CSS（9 个覆写 + `index.css`），9 个库 |
| theme-lint | 6 条规则 / 3 个规则模块；`scripts/test/theme-lint.test.mjs` 143 项通过 |
| 命令 | `pnpm theme:report`、`pnpm theme:check-vendor`、`pnpm theme:designer` |
| 业务 hex 债务 | `theme:report` 报 `no-hardcoded-color` 6 处（`overrides.css` 4、`env-vars-import-sideslider.vue` 2），其中 monaco overlaymessage 4 处按既有注释刻意保持 vscode 原值 |
| 待补档 | `@viz-pending` 5 项（拓扑边 / minimap 底 / 遮罩 / 状态块 error / unknown），ΔE00 见 `pending.md` |
| 未归属规则 / pending-design | 原台账文件已在 `9dee3d2b` 删除；设计拍板与未归属规则清单未入库，属已知遗留 |
| dark 主题 | 未做；`[data-theme]` 覆盖位仅预留 |
| 全量 lint | 仓库存量基线：`pnpm lint` 868 errors / 44164 warnings，`pnpm stylelint` 609 problems，`pnpm typecheck` 8 errors；本轮改动文件零新增 error |

## 六、规范沉淀

- 颜色三档判定：`@follow` 只准 `var(--bkms-*)` 别名、`@locked` 保留实色、`@pending` 实色 + `target/deltaE00/usage` 三键标记；同值不等于同义。
- 注释：只写非显然的坑与决策理由；业务 `catch` 不配解说注释，接口失败反馈交给全局拦截器。
- 提交：主特性分支只进不改，一步一子分支，验证通过 `merge --no-ff`；非步骤产出物（设计沟通材料、确认单）不擅自入库。
- 文档：方案类文档每次调整生成带版本后缀的新文件，历史版本不改写。
- 验证：`pnpm theme:report`、`pnpm theme:check-vendor`、`pnpm test:scripts`、`pnpm build` 为改动后的最小回归集。

## 七、下一阶段待办

1. 5 项 `@viz-pending` 由设计补档后改成别名，适配层不动。
2. `THIRD-PARTY-THEME-v2.md` §11 的 10 项拍板收口，状态见 `pending.md`；`STATUS_CONFIG.miniColor` 目前保留字段、仅作字典兜底，是否删字段待 owner 点头。
3. 换肤器接线：按「清缓存 → 各 `refreshXxxViz()` → 各库重绘」固定顺序；当前只预留刷新入口，未做换肤 UI。
4. dark 主题审计（导航变量 `--menu-bg-color` / `--submenu-bg-color` 等桥接未映射）。
5. 业务存量 hex 替换完成后再收紧 stylelint `color-no-hex`；仓库全量 lint / stylelint / typecheck 的存量报错另行清零。
6. `theme:check-vendor` 的 `LIB_CSS` / `KEY_SELECTORS` 是登记制，新增第三方覆写必须同步登记。

> `THIRD-PARTY-THEME-v2.md` §10 曾把「第三方库字典与 `patches/vendor/`」列为下一阶段；本轮已落地，故本文把它并入时间线，下一阶段改写为上述收尾项。
