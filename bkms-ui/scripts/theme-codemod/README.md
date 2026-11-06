# theme-codemod — 主题色迁移工具集

支撑 bkms-ui 主题色体系（`--bkms-*` 令牌 + bkui class 覆写层）的生成、自检与业务侧替换。
方案与分层模型见 `docs/theme-style/THEME.md`，操作步骤见 `docs/theme-style/THEME_STEPS.md`。

## 目录结构

```
theme-codemod/
├── scripts/    # 可执行脚本（npm 入口见下表）
├── data/       # 映射数据基线（脚本输入，人工/流程维护）
├── docs/       # 说明文档（rules.md 规约、bridge-notes.md bridge 生成备注）
└── reports/    # 运行产出台账（脚本输出，可随时重生成；designer-review 为拍板记录）
```

## 脚本与 npm 入口

| 脚本 | npm | 作用 |
| --- | --- | --- |
| `scripts/gen-overrides.mjs` | `theme:gen` | 双源扫描 bkui dist（style.variable.css 变量版 + style.css 字面量版），生成 `patches/bkui-theme/`（变量版覆写）与 `patches/bkui-theme-literal/`（压制 lib/*.less 字面量旧色）+ `index.css` + 摘要/占位台账 |
| `scripts/check-overrides.mjs` | `theme:check` | 漂移自检：变量版对 style.variable.css、字面量版对 style.css，校验选择器与原 hex 仍在，失效即 exit 1。**库升级后必跑** |
| `scripts/stats-usage.mjs` | `theme:usage` | 组件使用统计 → `reports/usage.json`（生成器白名单基线）+ `reports/usage-report.md` |
| `scripts/codemod.mjs` | — | 业务侧 hex → `var(--bkms-*)`（Step 5 用：`scan` 只报告 / `apply [dir]` 写回） |
| `scripts/extract-root-vars.mjs` | — | 一次性：提取 bkui `:root` 变量清单（Step 0 盘点用，已完成使命） |

## data/ 数据基线

| 文件 | 作用 |
| --- | --- |
| `mapping.json` | hex → `--bkms-*` token 映射（设计已确认值，真源 = `bkms-color-spec.md`） |
| `keep.json` | 刻意保留原色、不替换的黑名单 |
| `pending-design.json` | 待设计确认值（当前为空；重新积累待确认色时在此登记，设计拍板后转入 mapping） |
| `color-diff-backup.json` | 主题改造历史颜色备份：记录按实际赋值变量计算、CIEDE2000 色差不超过 6 的 hex、对应 token、色差及来源；仅用于历史追溯与审查，不作为自动替换输入。 |

## 典型工作流

```
theme:usage（组件白名单基线） → theme:gen（生成覆写） → 人工审查草稿 → theme:check（漂移自检）
```

未命中色值兜底：补 spec → 补 `data/mapping.json` → 重跑，禁止静默跳过。

## 纪律

- `patches/bkui-theme/`（变量版）与 `patches/bkui-theme-literal/`（字面量版）由生成器管理，**重跑整体覆盖**；`patches/bkms/` 为手写业务补丁，生成器只读取并追加进 `index.css` import 清单，**绝不写入**。
- 字面量版存在的原因：dev 下 bkui 组件入口（`lib/<comp>/index.js`）按需加载 `.less`（字面量色），部分选择器比变量版更具体（如 `.bk-button.bk-button-primary`），同 specificity 下后加载的 less 会赢——字面量覆写复刻 less 的选择器并加 `.bkms-themed` 前缀（+1 specificity）压制。
- 覆写文件内禁止裸 hex，原值只准进行尾注释（供 review 与漂移自检比对）。
- 设计拍板流程：确认值写入 `data/mapping.json` → `theme:gen` → `theme:check`，占位自动换成 token。
- `--bkms-*` 色阶只在 `tokens/colors.css` 定义，业务代码禁止新写 hex（stylelint `color-no-hex` 落地后自动管控）。
