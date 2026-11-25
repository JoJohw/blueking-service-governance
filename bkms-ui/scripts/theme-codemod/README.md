# theme-codemod — 主题色工具集

支撑 bkms-ui 主题色体系（`--bkms-*` 令牌 + bkui class 覆写层）的生成与自检。
方案与分层模型见 `docs/theme-style/THEME.md`（第九节为操作步骤），第三方库可视化主题见 `docs/theme-style/THIRD-PARTY-THEME.md`。

## 速查（执行前先读这一段）

| 事项 | 事实 |
| --- | --- |
| 映射真源 | `scripts/theme-codemod/scripts/config/overrides.mjs` 的 `HEX_TOKENS` 是 `hex → token` **唯一**人工维护处；令牌本体在 `src/styles/theme/tokens/` |
| 生成 | `pnpm theme:gen` → `src/styles/theme/generated/bkui/**`；产物**禁止手改**，闸门 `pnpm theme:gen && git diff --exit-code src/styles/theme/generated` |
| 校验 | `node scripts/theme-codemod/scripts/check-overrides.mjs`（bkui 双源漂移）、`node scripts/theme-codemod/scripts/check-lib.mjs`（第三方库漂移） |
| 手写层 | `src/styles/theme/manual/**`，生成器不读不写，改它不需要重跑生成 |
| 台账 | `scripts/theme-codemod/reports/**` 已 gitignore，可随时重生成，不入库 |

> 速查为摘要：与正文冲突时以正文与脚本实现为准。本表路径按**项目根**书写，正文中同名路径是**相对本目录**的简写。

## 目录结构

```
theme-codemod/
├── scripts/    # 可执行脚本（直接 node 执行，清单见下表）
│   ├── gen-overrides/               # 覆写生成器（颜色 / 圆角各一）
│   │   ├── color.mjs                # 颜色覆写生成器
│   │   └── radius.mjs               # 圆角覆写生成器
│   ├── config/                      # 生成器输入（非算法：组件库事实 + 人工映射）
│   │   ├── overrides.mjs            # 颜色：组件族收编（EXTRA_OWNERS）+ 类前缀别名（PREFIX_ALIAS）+ 旧色→新色映射（HEX_TOKENS）
│   │   └── radius-components.json   # 圆角：组件族 + 选择器级 token 分派
│   └── lib/                         # 共用解析工具
└── reports/    # 运行产出台账（脚本输出，可随时重生成，已 gitignore；设计拍板记录不入本目录）
```

`config/` 收两类输入：按组件库事实增补的白名单/别名，以及人工维护的 `hex → token` 映射。算法参数（匹配、分段、清理策略）留在各自生成器里；收编一个被第三方包渲染但 `stats-usage` 判为未使用的类族，改这里即可。

## 数据单源

`hex → token` 由 `scripts/config/overrides.mjs` 唯一提供，**人工维护、不由产物反推**：
生成器不读旧产物，删掉 `generated/bkui/**` 重跑结果逐字节一致。

- `HEX_TOKENS`：旧色 → 新规范令牌的默认对应（一种写死色值一行）
- 语义修正（同一旧色在这里是描边、在那里是占位字色）不进映射表，写 `manual/bkui.css`：生成器只落色阶，手写层按用途覆写成 `line-*` / `text-*` / `bg-*`
- 未收录的 hex 按原值占位并标 `pending` 进 `gen-summary.md`，拍板后补进 `HEX_TOKENS`

能自动判定的一律不写：命中 `color.css` 令牌值的声明直接原值保留，字色位与 8 位阴影另有规则吸收。

| 层 | 真源 | 说明 |
| --- | --- | --- |
| 令牌值 | `src/styles/theme/tokens/color.css` | 所有 `--bkms-*` 色值的唯一定义处（`@layer scale` / `@layer semantic` 两个区） |
| 历史映射事实 | `scripts/config/overrides.mjs` 的 `HEX_TOKENS` | 旧色→新色的机械映射，人工维护；语义用途由手写层 `manual/bkui.css` 承接 |
| 例外决策 | `scripts/config/overrides.mjs` 的 `HEX_TOKENS` | 只收映射表里学不到且**会真正生成**的少数 hex；未使用组件的规则不进产物，也不登记 |

生成白名单来自 `stats-usage.mjs` 的 `usage.json`（项目实际引用的组件）；安装目录里存在但未引用的组件记在 `unusedComponents`，其规则由生成器按组件自有 CSS 判定后直接跳过——不生成、不告警、不需要色值映射。

## generated / manual 两层：谁生成、谁手写

| 目录 | 路径 | 归属 | 重跑会怎样 |
| --- | --- | --- | --- |
| bkui 覆写 | `generated/bkui/` | 生成 | `color.mjs` 重写各组件文件与 `index.css`，`radius.mjs` 重写 `radius.css`；目录其他文件一律删除，禁止手改 |
| 变量桥接 | `bridge/bkui.css` | 手写 | 不参与生成；无层，`:root` 同名变量压过组件库 |
| bkui 手写 | `manual/bkui.css` | 手写 | 不参与生成；承接生成器表达不了的差异（多态拆分、新增选择器、规范值） |
| 第三方库 | `manual/lib/` | 手写 | 一库一文件（颜色 / 圆角 / 形态同文件）；库内变量只在 `vxe.css` 单点定义 |
| UA 兜底 | `manual/ua.css` | 手写 | 全项目唯一 UA 规则，`:where()` 零特异性 |
| `!important` 层 | `manual/boost.css` | 手写 | 入 `bkms-boost`（层序最前），只收必须压过组件库 `!important` 的声明 |
| 业务补丁 | `src/styles/app.css` | 手写 | 模板自有 class（`.bkms-*`），加载早于 uno |

### 警告

- **不要手改生成产物**：`generated/bkui/**` 重跑即丢，也没有「改产物再继承」这条路径了。要改颜色：先改 `tokens/` 或 `bridge/`；单组件与规范不一致时写 `manual/bkui.css` 的差异。
- **新增 `manual/lib/@blueking/*.css` 手写文件**时，要同步登记 `scripts/theme-codemod/scripts/check-lib.mjs` 的 `LIB_CSS` 与 `KEY_SELECTORS`，否则校验脚本不认这层覆写。
- **移除某个库的覆写**时，手工删文件并摘掉 `manual/lib/index.css` 里的 `@import`。
- **`boost.css` 的副本不是冗余**：`generated/` 与 `manual/lib/` 的同名声明在 `bkms-patches` 层，`!important` 打不过 `bkms-vendor`，只能靠 `bkms-boost` 再声明一次；改值两处同步。

## 脚本入口（直接 node 执行，不占 package.json）

| 脚本 | 作用 |
| --- | --- |
| `scripts/stats-usage.mjs` | 组件使用统计 → `reports/usage.json`（生成器白名单基线）+ `reports/usage-report.md` |
| `scripts/gen-overrides/color.mjs` | 双源扫描 bkui dist（style.variable.css 变量版 + style.css 字面量版），生成 `generated/bkui/`（每组件一文件：变量版段 + 字面量段，字面量段压制 lib/*.less 旧色）+ `index.css` + `reports/gen-summary.md`（含未归属规则、待拍板占位与「同 hex 多语义」清单）。缺 `usage.json` 时会提示先跑 stats-usage |
| `scripts/gen-overrides/radius.mjs` | 读 `config/radius-components.json`：组件族给默认 token，`rules[].match`（选择器正则）对特定后代换档——椭圆角标走 `full`、1px 细条走 `indicator`、标签走 `tag`、浮层走 `overlay`。`selectors` 补白（源样式无圆角声明时手动登记）支持字符串（用默认 token）或 `{ selector, token }` 对象（单条指定别的档，如 simplicity 走 `none`）。生成 `generated/bkui/radius.css`（按组件分段）+ `reports/radius-summary.md`（原值→token 台账，供设计核对）；零命中组件、未命中的分派规则都告警 |
| `scripts/check-overrides.mjs` | 漂移自检：按文件内「字面量版源」段标记切分，变量版段对 style.variable.css、字面量段对 style.css 校验选择器与原 hex 仍在，失效即 exit 1。**库升级后必跑**；圆角产物因带字面量段标记一并受检 |
| `scripts/check-lib.mjs` | 第三方覆写漂移自检：校验 `manual/lib/` 里的 `--vxe-ui-*` / `--bkms-viz-*` 变量与登记的关键选择器在当前依赖版本中仍存在，失效即 exit 1 |
| `scripts/config/overrides.mjs` | 颜色生成器的专属配置：组件族收编（`EXTRA_OWNERS`）+ 类前缀别名（`PREFIX_ALIAS`），只放组件库事实、不放算法参数 |
| `scripts/lib/css-blocks.mjs` | 共用 CSS 文本解析工具（`collectBlocks` / `splitSelectorList`），`gen-overrides/color.mjs` 与 `check-overrides.mjs` 共用 |

## 典型工作流

```
stats-usage（组件白名单基线） → gen-overrides（生成覆写） → 人工审查草稿 → check-overrides（漂移自检）
```

未收录色值兜底：进 `tokens/color.css` 补档，或把该组件的差异写进 `manual/bkui.css`；禁止静默跳过，也禁止手改 `generated/`。

构建注意：`pnpm build` 需 `NODE_OPTIONS=--max-old-space-size=8192`（默认堆不足，Node 22 + Vite 构建崩 OOM，与主题改造无关）。

## 纪律

- `generated/bkui/`（每组件文件含变量版段+字面量段）由生成器管理，**重跑整体覆盖**；手写覆写在 `bridge/`、`manual/bkui.css`、`manual/ua.css`、`manual/boost.css`、`manual/lib/`（见「generated / manual 两层」），生成器既不读取也不写入。
- 圆角覆写是域内单文件 `radius.css`，由 `gen-overrides/radius.mjs` 产出；`gen-overrides/color.mjs` 只在清理白名单与 `index.css` 清单里认它，不读也不写。白名单只收主体控件，单值 `0`、百分比与 `20px+` 形状值、滚动条 thumb 不覆写；多值简写不保留四角令牌，统一转成「整体语义 + 逻辑角清零」（`border-radius: var(--bkms-radius-<语义>)` + `border-start/end-*-radius: var(--bkms-radius-none)`），改语义档时不必逐角跟改。产物不带「原 #hex」尾注释，靠「字面量版源」段标记并入 `check-overrides.mjs` 的选择器漂移校验。
- 业务层圆角收敛口径：模板 class（含 `@apply`、方向前缀）用注册类 `rounded-bkms-<语义>`，形状值用 `rounded-bkms-none/full`；样式声明 / 内联 style / script 字符串用 `var(--bkms-radius-<语义>)` 或 `var(--bkms-radius-none/full)`。四角简写不要写成四个令牌并列，统一成「整体语义 + 逻辑角清零」（`border-radius: var(--bkms-radius-<语义>)` + `border-start/end-*-radius: var(--bkms-radius-none)`），换语义档时不用逐角跟改。替换台账不随仓库维护（另行归档），本目录只留生成器需要的配置。
- 书写形态由两条规则兜住：stylelint `declaration-property-value-disallowed-list` 拦 `border-radius` 多值（值里有空格即报，纯令牌并列同样拦）；eslint `theme/no-stacked-radius` 拦同一 class / `@apply` 里压在同一角上的多个圆角类（`hover:` 这类变体前缀作用于别的状态，不算叠加）。`generated/**` 与 `manual/lib/**` 等复刻产物豁免多值规则；`manual/bkui.css` 是手写层，多值规则照常生效；`dev/palette` 的演示类不受叠加规则约束。台账（另行归档）只登记最终形态，多值写法不入账。
- `radius.css` 档位是量级名 `hairline/xs/sm/md/lg/xl`（1/3/4/6/8/20px）+ 形状档 `none/full`，语义层只引用档位；业务代码不直连尺度档，形状档可直接用。图形半径（G6 / ECharts / 组件 `radius` prop）不是 CSS 圆角，不进令牌。
- `src/main.ts` 的 console `%c` 徽章样式由 DevTools 渲染，不继承页面 `:root`，圆角只能保留字面量并显式 `eslint-disable-next-line theme/no-hardcoded-radius`。
- 字面量版存在的原因：dev 下 bkui 组件入口（`lib/<comp>/index.js`）按需加载 `.less`（字面量色），部分选择器比变量版更具体（如 `.bk-button.bk-button-primary`），同 specificity 下后加载的 less 会赢——字面量覆写复刻 less 的选择器并加 `.bkms-themed` 前缀（+1 specificity）压制。
- 覆写文件内禁止裸 hex，原值只准进行尾注释（供 review 与漂移自检比对，**不再承担生成输入**）。
- 设计拍板流程：颜色改 `tokens/` / `bridge/`；旧色→新色对应改 `config/overrides.mjs` 的 `HEX_TOKENS`；语义用途（描边/字色/底色/阴影）与单组件差异写 `manual/bkui.css` → 重跑 `gen-overrides/color.mjs` 确认产物无多余变更 → `check-overrides.mjs` 自检。
- 产物完整性闸门：`pnpm theme:gen && git diff --exit-code src/styles/theme/generated`（CI / 提交前）。有 diff 说明有人手改了产物，或映射来源变了，需先解释再提交。
- `--bkms-*` 色阶只在 `tokens/color.css` 定义，业务代码禁止新写 hex（stylelint `color-no-hex` / eslint `theme/no-hardcoded-color` 均已 error 管控）。
