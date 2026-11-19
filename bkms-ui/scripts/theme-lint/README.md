# theme-lint

色值治理工具链：把 `src/styles/theme/tokens` 里的 CSS 变量当作唯一真源，检查业务代码有没有绕过它写死色值。

文件分工：

| 文件               | 职责                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| `map.mjs`          | 解析令牌 + 反查类名/变量。**唯一真源**，`uno.config.ts` 与 eslint 规则都从这里取 |
| `plugin.mjs`       | 聚合入口：合并各维度规则，eslint 配置里仍以 `theme` 插件名引用                   |
| `rules/shared.mjs` | 规则工厂（四路挂载）+ 定位换算 + 类名与声明切分；radius 三条已接入，color 四条仍内联 |
| `rules/color.mjs`  | 颜色维度四条规则                                                                 |
| `rules/radius.mjs` | 圆角维度三条规则                                                                 |
| `report.mjs`       | 存量报表，只看不改（`pnpm theme:report`）                                        |

测试在 `scripts/test/`，用 `pnpm test:scripts` 单独跑，不进 `test:unit` / `test:ci`。

## 令牌从哪来

`src/styles/theme/tokens/` 下两个文件：

- `color.css` —— 颜色维度（一个维度一个文件）：`@layer scale` 区是原子色阶与「场景色」（`--bkms-brand-2`、`--bkms-warning-alt` …），全库唯一允许色值字面量的地方——场景色是 spec 未覆盖的保留色，按用途命名后直写原值，与数字色阶同形消费；`@layer semantic` 区是语义层（`--bkms-text-title`、`--bkms-bg-card` …），只 `var()` 引用色阶（阴影组例外，值即完整效果）
- `radius.css` —— 圆角维度：档位层（尺度档 `hairline/xs/sm/md/lg/xl` + 形状档 `none/full`）+ 语义档（base/field/tag/scroll/control/card/tile/indicator/overlay/tab/menu）。档位名不带像素值，换主题重定义档位即可带动全部语义档；`base` 指向 `md`（6px）通用基准，形状档不进语义候选池

**新增令牌不需要改任何代码**：`map.mjs` 在模块加载时扫描这两个文件，`uno.config.ts` 据此注册类、eslint 据此给建议。色阶会自动生成 `text-` / `bg-` / `border-` 等全部颜色工具类，语义层自动生成 `bkms-text-*` / `bkms-bg-*` / `bkms-line-*` 快捷类（见 `uno.config.ts` 顶部注释的消费矩阵）。

## 七条规则

| 规则                   | 级别  | 检查什么                                                                   | 可自动修                              |
| ---------------------- | ----- | -------------------------------------------------------------------------- | ------------------------------------- |
| `no-hardcoded-color`   | warn  | 写死色值（hex / `rgb()` / `rgba()` / `hsl()`）                             | 有同值令牌且非复合值时可修（带 `/alpha` 转 `color-mix`） |
| `no-default-palette`   | error | uno 默认调色板类，如 `text-red-500`、`border-t-gray-900`、`shadow-red-500` | 否                                    |
| `prefer-uno-class`     | error | class 内用 `var()` 任意值（`text-[var(--bkms-brand-2)]`）                  | 同层有注册类时可修（带 `/alpha` 转 `color-mix`） |
| `no-foreign-var`       | warn  | `var()` 引用不在 `--bkms-*` 白名单、也不是同文件局部变量                   | 否                                    |
| `no-hardcoded-radius`  | warn  | 写死圆角长度与形状值（`rounded-[6px]`、`border-radius: 0`、`50%`、`999px`） | 同值唯一且场景明确、形状值可修；其余只给候选 |
| `prefer-radius-class`  | warn  | 圆角没走语义注册类：`rounded-lg`、`rounded-bkms-md`、`rounded-full`      | 语义 `var()` 任意值与内置形状类可换成注册类 |
| `no-stacked-radius`    | error | 同一元素上多个圆角类压在同一角（`rounded-bkms-card` + `rounded-t-bkms-tile`）；静态 class 与 `:class` 绑定（数组 / 对象 / 字符串拼接）都检查 | 两条建议各删一个类，留哪个由人定（同名类重复不算叠加） |

级别是渐进的：四条 warn 是存量软基线，清零后升 error；三条 error 当前零存量，直接拦。

覆盖范围：`.vue`（template / script / `<style>` 块）、`.ts/.tsx/.js/.jsx`、独立 `.css`（走 `@eslint/css` 的 `css/css` language）。

接入新令牌维度时不要往 `plugin.mjs` 里堆规则：写 `rules/<维度>.mjs` 导出规则对象，在聚合入口合并即可。

## 建议值怎么算

`map.mjs` 的四条优先级：

1. **语义优先**：目标色值有同值语义令牌时，给 `bkms-text-*` / `bkms-bg-*` / `bkms-line-*` 快捷类，比通用工具类语义清晰
2. **色阶兜底**：没有同值语义令牌时，落到色阶类（`bg-bkms-brand-2`）或 `var(--bkms-neutral-1)`
3. **方向边框不压平**：`border-t-[色值]` 只能落在 `border-t-bkms-*`，否则会退化成通用 `border-color`
4. **方向分隔线不压平**：`divide-x-[色值]` 没有对应的颜色类，只报不修（压平会把横向改成四向）

找不到同值令牌时不硬猜，只给最接近的候选（`nearestClasses` / `nearestVars`，色差超过阈值不给），由 IDE 灯泡里人工点选。

### 圆角：同值多档是常态，所以大多不自动修

颜色基本是「一个值一个语义」，圆角不是：`md`（6px）同时对应 `base` / `field` / `control` / `card` / `overlay` / `tab` / `menu` 七个语义档，值相同但场景不同；`base` 是通用基准，无场景词命中时排在候选最前。于是：

1. **同值语义档唯一**（`1px` → `indicator`、`20px` → `tile`）：直接自动修
2. **同值多档**（`4px` → `tag`/`scroll`、`6px` → 七个）：只给候选，灯泡里按场景挑，不替你定
3. **档位里没有同值**（`3px`、`8px` 等）：给最接近档位的候选，仍然不自动修
4. **场景词只影响排序**：选择器 / class 里的 `tab`、`card`、`popover` 等词会把对应语义档排到候选第一位，但不据此自动改

形状值不进语义候选池，但也不放行：`0` → `none`、百分比 / `≥100px` 胶囊 → `full`，映射到项目注册类 `rounded-bkms-none` / `rounded-bkms-full`（样式里是 `var(--bkms-radius-none/full)`），映射唯一所以直接自动修；uno 内置的 `rounded-full` / `rounded-none` 同样换成注册类。`20~99px` 在方块元素上属大圆角，不按形状处理，只给最近档位候选。

档位是量级名而非像素名：`hairline=1px` / `xs=3px` / `sm=4px` / `md=6px` / `lg=8px` / `xl=20px`，换主题重定义档位即可带动语义档，名字不会因改值而撒谎。尺度档类（`rounded-bkms-md`）只在迁移过渡期出现，业务一律用语义类（`rounded-bkms-base` / `rounded-bkms-card` 等，与色阶 `text-bkms-*` 同形）。

## 十三处有意为之的例外

- **`shadow-[…var(--bkms-shadow-*)]` / `drop-shadow-[…var(--bkms-shadow-*)]`**：uno 没把阴影注册成类，class 内 `var()` 是唯一合法写法，放行（`drop-shadow` 前缀带连字符，需按整串识别，否则按 `-` 切分会把色值静默放过）
- **`ring-offset-[色值]`**：uno 也没有对应的颜色类，替换成 `ring-*` 会把外发光环改成实心环，所以**只报不修**
- **`divide-x-[色值]` / `divide-y-[色值]`**：uno 只给 `divide-<color>` 注册颜色，`divide-x` 只管宽度；压平会把横向分隔线改成四向，所以**只报不修**
- **复合任意值（`bg-[linear-gradient(…)]`、`bg-[var(--x,#fff)]`）**：色值只是参数之一，整体换成单一注册类会连渐变 / 回退值一起抹掉，所以**只报不修**
- **带 `/alpha` 的任意值色值**：注册类的 `/50` 会被 uno 静默丢弃（50% 变 100%），修复产物落 `bg-[color-mix(in_srgb,var(--bkms-*)_50%,transparent)]`，alpha 语义才保得住
- **跨令牌层的 `var()`**：`text-[var(--bkms-brand-2)]` → `bkms-text-brand` 同值但不同层，语义层分叉后会改错，`prefer-uno-class` 只给候选不自动修
- **非 class 语境的任意值**：script 里的普通字符串（`const s = 'bg-[#fff]'`）只报不修，那里可能只是文案或选择器数据
- **`color-mix(…)`**：半透明场景的合法写法，`prefer-uno-class` 放行
- **形状档注册类与形状档 var()**：`rounded-bkms-none/full`、`border-radius: var(--bkms-radius-full)` 是业务合法写法，放行；只有 `20~99px` 这种方块大圆角仍按写死圆角上报，避免误判成正圆
- **圆角多值简写**：`border-radius: 0 4px 4px 0` 四角语义各不相同，但「两侧清零 + 两侧同语义」的两种历史形态可自动拆成整体语义 + 逻辑角；其余只报。样式文件里由 stylelint `declaration-property-value-disallowed-list` 直接拦，不再走 lint 的修
- **uno 内置圆角刻度**（`rounded-lg` 等）：值随根字号浮动（本项目根字号 12px），换算不出可靠档位，只报不修
- **未知圆角语义档**（`rounded-[var(--bkms-radius-cardd)]`）：令牌里没有它就不给 autofix，只报「先新增令牌」，避免产出 uno 没注册的类名
- **script 里的类名字符串**：动态类名同样检测，但可能只是数据 / 文案，只报不修

## 怎么用

```bash
pnpm theme:report            # 存量清单：按规则+文件聚合，标出可修/有候选的数量
pnpm theme:report --rule=theme/no-hardcoded-color
pnpm theme:report --by=property   # 额外按 CSS 属性维度聚合（shadow / border / background…），仅 no-hardcoded-color
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

## 常见问题与解决方案

编辑器里看不到 `theme/*` 规则的提示，按顺序排查：

1. **确认装了 ESLint 和 Stylelint 两个扩展**。没装 Stylelint 时 `.vscode/settings.json` 里的 `stylelint.validate` 会被标「未知的配置设置」Hint——这就是缺扩展的信号，不是配置写错
2. **确认 `.vscode/settings.json` 有内容**。新 clone 后该文件应随仓库存在；如果缺失，从上文补回
3. **`pnpm install` 后重启 ESLint 服务或重启编辑器**（命令面板 → `ESLint: Restart ESLint Server`）。自定义插件 `plugin.mjs` 是随依赖安装后才可解析的本地文件，装完依赖不重启服务，扩展仍用旧缓存，规则不生效
4. 以上都没问题仍不报：命令行跑 `pnpm lint` 验证规则本身是否命中——命令行报、编辑器不报，就是扩展侧问题（回到第 3 步）

## 已知边界

- `hsl()` 只报不导：没做 HSL→RGB 转换，报出来后不给候选，需人工查令牌（`rgb()/rgba()` 已归一成 hex）
- 命名色不查：`text-[red]`、`color: red` 完全不报，查它要维护 148 个 CSS 命名色表，性价比不够
- 内联 `style="color: #111214"` 不解析属性名，只按色阶兜底给 `var(--bkms-neutral-1)`，不会给 `var(--bkms-text-title)`
- 无颜色语境的 3 位 hex（如 `getByText('#101')`）视为编号不报，6 位以上照报
- `url(#icon)` 里的 `#` 是 SVG 引用，不报
