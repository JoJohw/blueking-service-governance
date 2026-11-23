# theme-codemod — 主题色工具集

支撑 bkms-ui 主题色体系（`--bkms-*` 令牌 + bkui class 覆写层）的生成与自检。
方案与分层模型见 `docs/theme-style/THEME.md`（第九节为操作步骤），第三方库可视化主题见 `docs/theme-style/THIRD-PARTY-THEME.md`。

## 目录结构

```
theme-codemod/
├── scripts/    # 可执行脚本（直接 node 执行，清单见下表）
│   ├── gen-overrides/               # 覆写生成器（颜色 / 圆角各一）
│   │   ├── color.mjs                # 颜色覆写生成器
│   │   └── radius.mjs               # 圆角覆写生成器
│   ├── config/                      # 生成器输入（非算法：只放组件库事实）
│   │   ├── overrides.mjs            # 颜色：组件族收编（EXTRA_OWNERS）+ 类前缀别名（PREFIX_ALIAS）
│   │   └── radius-components.json   # 圆角：组件族 + 选择器级 token 分派
│   └── lib/                         # 共用解析工具
└── reports/    # 运行产出台账（脚本输出，可随时重生成；designer-review 为拍板记录）
```

`config/` 只收「按组件库事实增补」的白名单与别名，算法参数（匹配、分段、清理策略）留在各自生成器里；收编一个被第三方包渲染但 `stats-usage` 判为未使用的类族，改这里即可。

## 数据单源

没有 `hex → token` 的第二份 JSON：**既往产物就是映射真源**。`patches/bkui-theme/*.css` 里每条覆写都写成
`属性: var(--bkms-*);` 加行尾「原 #hex」注释，生成器重跑前先扫描旧文件建索引，于是人工拍板的改动直接改产物即可，
下一轮重跑自动继承。

| 层 | 真源 | 说明 |
| --- | --- | --- |
| 令牌值 | `src/styles/theme/tokens/color.css` | 所有 `--bkms-*` 色值的唯一定义处（`@layer scale` / `@layer semantic` 两个区） |
| 历史映射事实 | `src/styles/theme/patches/bkui-theme/*.css` | 令牌 + 原值注释成对出现，生成器自读自建索引 |

## patches 四域：谁生成、谁手写

| 域 | 路径 | 归属 | 重跑会怎样 |
| --- | --- | --- | --- |
| bkui 覆写 | `patches/bkui-theme/` | 生成 | `gen-overrides/color.mjs` 重写各组件文件与 `index.css`，`gen-overrides/radius.mjs` 重写 `radius.css`；**`variables.css`（bkui 变量桥接）在白名单里，不会被删** |
| 第三方库 | `patches/lib/` | 手写 | 全部手写，不参与任何生成器；颜色一律使用 `--bkms-*` 令牌，库内变量只在 `vxe.css` 单点定义 |
| UA 兜底 | `patches/ua-fill/` | 手写 | 不参与任何生成器；加载顺序在 `theme/index.css` 末尾，可压过前面所有覆写 |
| 业务补丁 | `patches/bkms/` | 手写 | 同上，放有业务语义的补丁 |

### 警告

- **不要手改生成产物**：仅 `patches/bkui-theme/*.css`（`variables.css` 除外），重跑即丢。要改值按「既往产物即映射真源」改产物里的 `var()` 与原值注释后重跑，或回令牌层补档。`patches/lib/` 全是手写，可直接改。
- **lib 域圆角分文件仅适用于原生成产物**：date-picker / ediatable 的圆角拆到独立 `*-radius.css`，与颜色覆写解耦；monitor / task-log 等手写库的圆角直接内嵌在原覆写文件里，不另拆。
- **第三方手写文件不会被清理**：移除某个库的覆写时，手工删文件并摘掉 `@blueking/index.css` 里的 `@import`。
- **新增 `patches/lib/@blueking/*.css` 手写文件**时，要同步登记 `scripts/theme-codemod/scripts/check-lib.mjs` 的 `LIB_CSS` 与 `KEY_SELECTORS`，否则校验脚本不认这层覆写。

## 脚本入口（直接 node 执行，不占 package.json）

| 脚本 | 作用 |
| --- | --- |
| `scripts/stats-usage.mjs` | 组件使用统计 → `reports/usage.json`（生成器白名单基线）+ `reports/usage-report.md` |
| `scripts/gen-overrides/color.mjs` | 双源扫描 bkui dist（style.variable.css 变量版 + style.css 字面量版），生成 `patches/bkui-theme/`（每组件一文件：变量版段 + 字面量段，字面量段压制 lib/*.less 旧色）+ `index.css` + `reports/gen-summary.md`（含未归属规则与待拍板占位清单）。缺 `usage.json` 时会提示先跑 stats-usage |
| `scripts/gen-overrides/radius.mjs` | 读 `config/radius-components.json`：组件族给默认 token，`rules[].match`（选择器正则）对特定后代换档——椭圆角标走 `full`、1px 细条走 `indicator`、标签走 `tag`、浮层走 `overlay`。`selectors` 补白（源样式无圆角声明时手动登记）支持字符串（用默认 token）或 `{ selector, token }` 对象（单条指定别的档，如 simplicity 走 `none`）。生成 `patches/bkui-theme/radius.css`（按组件分段）+ `reports/radius-summary.md`（原值→token 台账，供设计核对）；零命中组件、未命中的分派规则都告警 |
| `scripts/check-overrides.mjs` | 漂移自检：按文件内「字面量版源」段标记切分，变量版段对 style.variable.css、字面量段对 style.css 校验选择器与原 hex 仍在，失效即 exit 1。**库升级后必跑**；圆角产物因带字面量段标记一并受检 |
| `scripts/check-lib.mjs` | 第三方覆写漂移自检：校验 `patches/lib/` 里的 `--vxe-ui-*` / `--bkms-viz-*` 变量与登记的关键选择器在当前依赖版本中仍存在，失效即 exit 1 |
| `scripts/config/overrides.mjs` | 颜色生成器的专属配置：组件族收编（`EXTRA_OWNERS`）+ 类前缀别名（`PREFIX_ALIAS`），只放组件库事实、不放算法参数 |
| `scripts/lib/css-blocks.mjs` | 共用 CSS 文本解析工具（`collectBlocks` / `splitSelectorList`），`gen-overrides/color.mjs` 与 `check-overrides.mjs` 共用 |

## 典型工作流

```
stats-usage（组件白名单基线） → gen-overrides（生成覆写） → 人工审查草稿 → check-overrides（漂移自检）
```

未收录色值兜底：直接改对应 `patches/bkui-theme/<kebab>.css` 的值与原值注释（或在 token 里补档）→ 重跑 `gen-overrides/color.mjs`，禁止静默跳过。

构建注意：`pnpm build` 需 `NODE_OPTIONS=--max-old-space-size=8192`（默认堆不足，Node 22 + Vite 构建崩 OOM，与主题改造无关）。

## 纪律

- `patches/bkui-theme/`（每组件文件含变量版段+字面量段）由生成器管理，**重跑整体覆盖**；手写覆写在 `src/styles/overrides.css` 与 `patches/ua-fill/`、`patches/bkms/`、`patches/lib/` 的手写文件里（见「patches 四域」），生成器既不读取也不写入。
- 圆角覆写是域内单文件 `radius.css`，由 `gen-overrides/radius.mjs` 产出；`gen-overrides/color.mjs` 只在清理白名单与 `index.css` 清单里认它，不读也不写。白名单只收主体控件，单值 `0`、百分比与 `20px+` 形状值、滚动条 thumb 不覆写；多值简写不保留四角令牌，统一转成「整体语义 + 逻辑角清零」（`border-radius: var(--bkms-radius-<语义>)` + `border-start/end-*-radius: var(--bkms-radius-none)`），改语义档时不必逐角跟改。产物不带「原 #hex」尾注释，靠「字面量版源」段标记并入 `check-overrides.mjs` 的选择器漂移校验。
- 业务层圆角收敛口径：模板 class（含 `@apply`、方向前缀）用注册类 `rounded-bkms-<语义>`，形状值用 `rounded-bkms-none/full`；样式声明 / 内联 style / script 字符串用 `var(--bkms-radius-<语义>)` 或 `var(--bkms-radius-none/full)`。四角简写不要写成四个令牌并列，统一成「整体语义 + 逻辑角清零」（`border-radius: var(--bkms-radius-<语义>)` + `border-start/end-*-radius: var(--bkms-radius-none)`），换语义档时不用逐角跟改。替换台账不随仓库维护（另行归档），本目录只留生成器需要的配置。
- 书写形态由两条规则兜住：stylelint `declaration-property-value-disallowed-list` 拦 `border-radius` 多值（值里有空格即报，纯令牌并列同样拦）；eslint `theme/no-stacked-radius` 拦同一 class / `@apply` 里压在同一角上的多个圆角类（`hover:` 这类变体前缀作用于别的状态，不算叠加）。`patches/**` 是复刻产物，豁免多值规则；`dev/palette` 的演示类不受叠加规则约束。台账（另行归档）只登记最终形态，多值写法不入账。
- `radius.css` 档位是量级名 `hairline/xs/sm/md/lg/xl`（1/3/4/6/8/20px）+ 形状档 `none/full`，语义层只引用档位；业务代码不直连尺度档，形状档可直接用。图形半径（G6 / ECharts / 组件 `radius` prop）不是 CSS 圆角，不进令牌。
- `src/main.ts` 的 console `%c` 徽章样式由 DevTools 渲染，不继承页面 `:root`，圆角只能保留字面量并显式 `eslint-disable-next-line theme/no-hardcoded-radius`。
- 字面量版存在的原因：dev 下 bkui 组件入口（`lib/<comp>/index.js`）按需加载 `.less`（字面量色），部分选择器比变量版更具体（如 `.bk-button.bk-button-primary`），同 specificity 下后加载的 less 会赢——字面量覆写复刻 less 的选择器并加 `.bkms-themed` 前缀（+1 specificity）压制。
- 覆写文件内禁止裸 hex，原值只准进行尾注释（供 review 与漂移自检比对）；尾注释同时是下一轮生成的映射来源，删了等于丢映射。
- 设计拍板流程：改 `patches/bkui-theme/` 的值与原值注释 → 重跑 `gen-overrides/color.mjs` → `check-overrides.mjs` 自检。
- `--bkms-*` 色阶只在 `tokens/color.css` 定义，业务代码禁止新写 hex（stylelint `color-no-hex` 落地后自动管控）。
