# theme-lint

色值治理工具链：把 `src/styles/theme/tokens` 里的 CSS 变量当作唯一真源，检查业务代码有没有绕过它写死色值。

三个文件分工：

| 文件         | 职责                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| `map.mjs`    | 解析令牌 + 反查类名/变量。**唯一真源**，`uno.config.ts` 与 eslint 规则都从这里取 |
| `plugin.mjs` | eslint 插件，注册四条 `theme/*` 规则                                             |
| `report.mjs` | 存量报表，只看不改（`pnpm theme:report`）                                        |

测试在 `scripts/test/`，用 `pnpm test:scripts` 单独跑，不进 `test:unit` / `test:ci`。

## 令牌从哪来

`src/styles/theme/tokens/` 下两个文件：

- `colors.css` —— 原子色阶（`--bkms-brand-2`、`--bkms-neutral-10` …），全库唯一允许出现色值字面量的地方
- `semantic.css` —— 语义层（`--bkms-text-title`、`--bkms-bg-card` …），只 `var()` 引用色阶

**新增令牌不需要改任何代码**：`map.mjs` 在模块加载时扫描这两个文件，`uno.config.ts` 据此注册类、eslint 据此给建议。色阶会自动生成 `text-` / `bg-` / `border-` 等全部颜色工具类，语义层自动生成 `bkms-text-*` / `bkms-bg-*` / `bkms-line-*` 快捷类（见 `uno.config.ts` 顶部注释的消费矩阵）。

## 四条规则

| 规则                 | 级别  | 检查什么                                                                   | 可自动修                              |
| -------------------- | ----- | -------------------------------------------------------------------------- | ------------------------------------- |
| `no-hardcoded-color` | warn  | 写死色值（hex / `rgb()` / `rgba()` / `hsl()`）                             | 有同值令牌且非复合值时可修（带 `/alpha` 转 `color-mix`） |
| `no-default-palette` | error | uno 默认调色板类，如 `text-red-500`、`border-t-gray-900`、`shadow-red-500` | 否                                    |
| `prefer-uno-class`   | error | class 内用 `var()` 任意值（`text-[var(--bkms-brand-2)]`）                  | 同层有注册类时可修（带 `/alpha` 转 `color-mix`） |
| `no-foreign-var`     | warn  | `var()` 引用不在 `--bkms-*` 白名单、也不是同文件局部变量                   | 否                                    |

级别是渐进的：两条 warn 是存量软基线，清零后升 error；两条 error 当前零存量，直接拦。

覆盖范围：`.vue`（template / script / `<style>` 块）、`.ts/.tsx/.js/.jsx`、独立 `.css`（走 `@eslint/css` 的 `css/css` language）。

## 建议值怎么算

`map.mjs` 的四条优先级：

1. **语义优先**：目标色值有同值语义令牌时，给 `bkms-text-*` / `bkms-bg-*` / `bkms-line-*` 快捷类，比通用工具类语义清晰
2. **色阶兜底**：没有同值语义令牌时，落到色阶类（`bg-bkms-brand-2`）或 `var(--bkms-neutral-1)`
3. **方向边框不压平**：`border-t-[色值]` 只能落在 `border-t-bkms-*`，否则会退化成通用 `border-color`
4. **方向分隔线不压平**：`divide-x-[色值]` 没有对应的颜色类，只报不修（压平会把横向改成四向）

找不到同值令牌时不硬猜，只给最接近的候选（`nearestClasses` / `nearestVars`，色差超过阈值不给），由 IDE 灯泡里人工点选。

## 八处有意为之的例外

- **`shadow-[…var(--bkms-shadow-*)]`**：uno 没把阴影注册成类，class 内 `var()` 是唯一合法写法，放行
- **`ring-offset-[色值]`**：uno 也没有对应的颜色类，替换成 `ring-*` 会把外发光环改成实心环，所以**只报不修**
- **`divide-x-[色值]` / `divide-y-[色值]`**：uno 只给 `divide-<color>` 注册颜色，`divide-x` 只管宽度；压平会把横向分隔线改成四向，所以**只报不修**
- **复合任意值（`bg-[linear-gradient(…)]`、`bg-[var(--x,#fff)]`）**：色值只是参数之一，整体换成单一注册类会连渐变 / 回退值一起抹掉，所以**只报不修**
- **带 `/alpha` 的任意值色值**：注册类的 `/50` 会被 uno 静默丢弃（50% 变 100%），修复产物落 `bg-[color-mix(in_srgb,var(--bkms-*)_50%,transparent)]`，alpha 语义才保得住
- **跨令牌层的 `var()`**：`text-[var(--bkms-brand-2)]` → `bkms-text-brand` 同值但不同层，语义层分叉后会改错，`prefer-uno-class` 只给候选不自动修
- **非 class 语境的任意值**：script 里的普通字符串（`const s = 'bg-[#fff]'`）只报不修，那里可能只是文案或选择器数据
- **`color-mix(…)`**：半透明场景的合法写法，`prefer-uno-class` 放行

## 怎么用

```bash
pnpm theme:report            # 存量清单：按规则+文件聚合，标出可修/有候选的数量
pnpm theme:report --rule=theme/no-hardcoded-color
pnpm lint                    # 全量走 eslint（存量未清零，会红）
pnpm test:scripts            # 本目录的单测
```

日常开发靠编辑器，仓库里的 `.vscode/settings.json` 负责让两个扩展认这些文件：

```json
{
  "stylelint.validate": ["css", "postcss", "scss", "sass", "less", "vue"],
  "eslint.probe": ["javascript", "javascriptreact", "typescript", "typescriptreact", "vue", "css"]
}
```

`eslint.probe` 决定哪些语言触发 ESLint 校验（含 `.css`，让 `theme/no-hardcoded-color` 在样式文件里也生效）；`stylelint.validate` 决定哪些语言触发 Stylelint，`vue` 必须显式列出（扩展默认只校验 `css`/`postcss`）。配置到位后保存即有提示，灯泡里可一键替换。

## 已知边界

- `hsl()` 只报不导：没做 HSL→RGB 转换，报出来后不给候选，需人工查令牌（`rgb()/rgba()` 已归一成 hex）
- 命名色不查：`text-[red]`、`color: red` 完全不报，查它要维护 148 个 CSS 命名色表，性价比不够
- 内联 `style="color: #111214"` 不解析属性名，只按色阶兜底给 `var(--bkms-neutral-1)`，不会给 `var(--bkms-text-title)`
- 无颜色语境的 3 位 hex（如 `getByText('#101')`）视为编号不报，6 位以上照报
- `url(#icon)` 里的 `#` 是 SVG 引用，不报
