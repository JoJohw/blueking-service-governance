# theme-codemod — 主题色工具集

支撑 bkms-ui 主题色体系（`--bkms-*` 令牌 + bkui class 覆写层）的生成与自检。
方案与分层模型见 `docs/theme-style/THEME.md`，操作步骤见 `docs/theme-style/THEME_STEPS.md`。

## 目录结构

```
theme-codemod/
├── scripts/    # 可执行脚本（npm 入口见下表）
├── data/       # 仅存 keep 黑名单（保留色的唯一人工清单）
├── docs/       # 说明文档（rules.md 规约、bridge-notes.md bridge 生成备注）
└── reports/    # 运行产出台账（脚本输出，可随时重生成；designer-review 为拍板记录）
```

## 数据单源

没有 `hex → token` 的第二份 JSON：**既往产物就是映射真源**。`patches/bkui-theme/*.css` 里每条覆写都写成
`属性: var(--bkms-*);` 加行尾「原 #hex」注释，生成器重跑前先扫描旧文件建索引，于是人工拍板的改动直接改产物即可，
下一轮重跑自动继承。

| 层 | 真源 | 说明 |
| --- | --- | --- |
| 令牌值 | `src/styles/theme/tokens/color.css` | 所有 `--bkms-*` 色值的唯一定义处（`@layer scale` / `@layer semantic` 两个区） |
| 历史映射事实 | `src/styles/theme/patches/bkui-theme/*.css` | 令牌 + 原值注释成对出现，生成器自读自建索引 |
| 保留色黑名单 | `data/keep.json` | 刻意保留原色、不替换的黑名单 |

## 脚本入口（直接 node 执行，不占 package.json）

| 脚本 | 作用 |
| --- | --- |
| `scripts/stats-usage.mjs` | 组件使用统计 → `reports/usage.json`（生成器白名单基线）+ `reports/usage-report.md` |
| `scripts/gen-overrides.mjs` | 双源扫描 bkui dist（style.variable.css 变量版 + style.css 字面量版），生成 `patches/bkui-theme/`（每组件一文件：变量版段 + 字面量段，字面量段压制 lib/*.less 旧色）+ `index.css` + `reports/gen-summary.md`（含未归属规则与待拍板占位清单）。缺 `usage.json` 时会提示先跑 stats-usage |
| `scripts/check-overrides.mjs` | 漂移自检：按文件内「字面量版源」段标记切分，变量版段对 style.variable.css、字面量段对 style.css 校验选择器与原 hex 仍在，失效即 exit 1。**库升级后必跑** |

## 典型工作流

```
stats-usage（组件白名单基线） → gen-overrides（生成覆写） → 人工审查草稿 → check-overrides（漂移自检）
```

未收录色值兜底：直接改对应 `patches/bkui-theme/<kebab>.css` 的值与原值注释（或在 token 里补档）→ 重跑 `gen-overrides.mjs`，禁止静默跳过。

构建注意：`pnpm build` 需 `NODE_OPTIONS=--max-old-space-size=8192`（默认堆不足，Node 22 + Vite 构建崩 OOM，与主题改造无关）。

## 纪律

- `patches/bkui-theme/`（每组件文件含变量版段+字面量段）由生成器管理，**重跑整体覆盖**；手写覆写在 `src/styles/overrides.css`，生成器既不读取也不写入。
- 字面量版存在的原因：dev 下 bkui 组件入口（`lib/<comp>/index.js`）按需加载 `.less`（字面量色），部分选择器比变量版更具体（如 `.bk-button.bk-button-primary`），同 specificity 下后加载的 less 会赢——字面量覆写复刻 less 的选择器并加 `.bkms-themed` 前缀（+1 specificity）压制。
- 覆写文件内禁止裸 hex，原值只准进行尾注释（供 review 与漂移自检比对）；尾注释同时是下一轮生成的映射来源，删了等于丢映射。
- 设计拍板流程：改 `patches/bkui-theme/` 的值与原值注释 → 重跑 `gen-overrides.mjs` → `check-overrides.mjs` 自检。
- `--bkms-*` 色阶只在 `tokens/color.css` 定义，业务代码禁止新写 hex（stylelint `color-no-hex` 落地后自动管控）。
