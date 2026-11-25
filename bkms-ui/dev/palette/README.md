# BKMS 主题色板

一个查看、检索和比对 BKMS 主题令牌的小工具。分段控件切换「颜色 / 圆角 / 可视化 / 组件预览」四个视图：前三者解析主题 token 源文件；组件预览在独立 iframe 中 mock 业务接口，不污染主应用运行时。

工具保留两种运行方式：独立预览（`pnpm theme:designer`，组件预览视图会提示需在主应用打开），以及内嵌在主应用的 `/#/__designer`（组件预览可用）。

架构分层、数据流、扩展点与命令速查见 [`docs/PALETTE.md`](../../docs/PALETTE.md)（本文只讲视图自身的交互与数据口径）；组件样例如何生成见 [`scripts/component-preview/README.md`](../../scripts/component-preview/README.md)。

## 启动

独立预览在仓库根目录运行：

```bash
pnpm theme:designer
```

然后打开 `http://localhost:5300`。构建产物输出到 `dev/palette/dist/`：

```bash
npx vite build --config dev/palette/vite.config.ts
```

内嵌预览随主应用启动（`pnpm dev`），打开 `/#/__designer`。

## 主要功能

### 浏览色板

左侧是分组导航（色阶 / 语义层），右侧按分组展示所有 token：

- **色阶**：以原始色值展示，如 `--bkms-brand-2` → `#3B6EF5`。
- **语义层**：显示 token 引用的色阶，以及解析后的 hex；阴影组也在这里——阴影是按场景命名的效果值，直接写 8 位带 alpha 色，无法由色阶派生。
- 两侧都会出现「用途预览」（文字 / 线条 / 背景 / 阴影）：**预览形态由 token 类别决定，与挂在哪个分区无关**——没有用途语境的原子色（品牌色、中性色）显示纯色块。
- 点击卡片复制**实际值**：色阶给 hex，圆角给长度（语义令牌已解开 `var()` 链），阴影给完整效果串；悬停卡片时右上角出现 `var()` 按钮，复制 `var(--bkms-xxx)` 供开发使用。两种复制都会在顶部弹出成功提示。

### 圆角与可视化字典

切换到「圆角」按档位层 / 语义档查看半径。档位层是量级刻度 `xs/sm/md/lg`（3/4/6/8px）与形状档 `none/full`：尺度档走三尺寸方框，`none` 渲染直角方框、`full` 渲染正圆与胶囊；语义档渲染仿制的真实控件（输入框、标签、勾选框、滚动条、按钮、卡片、浮层、tab、菜单项，以及通用基准方框），卡片上会同时标出引用来源与解析后的长度值（如 `6px`）。切换到「可视化」按语义场景分组展示 `viz.css`：

- **连线 / 底色 / 节点状态 / 文字 / 图表结构 / 选中高亮 / 曲线配色**各有对应形态的仿制小样（三种笔形连线、画布与卡片、缩略小地图状态块、浅深双底文字样张、带网格与浮层的迷你折线图、节点选中描边、八条曲线各取一色的迷你折线图）。
- 小样里的颜色全部读 `var(--bkms-viz-*)`，被审视的那一项用当前 token；分类色标「锁定」，表示任何主题下都不漂移。
- 专注模式、复制反馈与 `?focus=<分组名>` 在三个视图下行为一致；搜索在三个视图下都可用，切换视图时会清空搜索与专注并回到顶部。

### 搜索

页面顶部常驻搜索框（专注模式下隐藏），输入即过滤，只在当前视图的令牌里搜，结果按视图分块：

- **颜色**：色阶 / 语义层两块。
- **圆角**：档位 / 圆角语义两块。
- **可视化**：按语义场景各自成块（连线 / 底色 / 节点状态 …）。

支持两类查询：

- **文本**：token 名、用途说明、分组名、引用关系。可以输入完整变量，如 `var(--bkms-brand-3)`；圆角长度也能按值搜，如 `6px`。
- **颜色值**：`hex`、`rgb()`、`rgba()`、`hsl()`、`hsla()`。颜色查询按 CIEDE2000 色差匹配，精确值优先，并容许小幅误差。圆角是长度令牌，色值查询不会命中。

搜索时左侧导航自动收起以让出空间；清空搜索后恢复当前视图的完整列表。

### 专注模式

每个分组右上角有「专注模式」按钮，普通状态下鼠标移到该分组整块区域时才显示。点击后只保留该分组、放大色块，标题栏吸顶不随滚动移动；再次点击退出。专注状态会写入 URL 参数 `?focus=<分组名>`，刷新后保持；退出时回到进入前的滚动位置。

### 色值建议

右下角的「色值建议」悬浮胶囊打开工具面板（无遮罩，不打断浏览）。输入一个颜色——支持 hex / rgb 文本或直接用取色器选取——工具会：

1. 在面板上方并排显示输入色与最接近的色板色，中间给出 CIEDE2000 ΔE 数值；
2. 列出色板中 ΔE ≤ 6 的候选，按色差从小到大排列，每项可单独复制 `var()`；
3. 若阈值内没有候选，则展示最接近的 5 个作为参考。

胶囊和面板都可拖动，松手靠近边缘时自动吸附，不会拖出视口。按 `Esc` 关闭面板。专注模式下工具保持打开、位置不变。

## 数据来源与口径

- 颜色令牌全部来自 `src/styles/theme/tokens/color.css`，由 `src/util/tokens.ts` 解析；色阶区与语义区按组标记里的 `@layer scale` / `@layer semantic` 区分。色阶区含 spec 未覆盖的「场景色」（按用途命名、直写原值），与数字色阶一样是原子色值；语义 token 一般通过 `var()` 引用色阶，工具会递归解析到最终色值（阴影组例外，值即完整效果）。
- 圆角来自 `radius.css`：档位层是量级刻度 `xs/sm/md/lg` 与形状档 `none/full`（值即字面量），语义层只 `var()` 引用档位、按组件场景命名；可视化字典来自 `viz.css`。两者各自解析成独立分组，不并入颜色视图的色阶 / 语义二分。`viz.css` 的分组同样用 `@group` / `@layer semantic` / `@note` / `@endgroup`；`@viz-locked` 标记数据分类色在任何主题下都不漂移。viz 值是实色、不进 `var()` 链解析，卡片直接展示色值。
- CSS 本身不支持 JSDoc，`@tag` 是工具自定义、解析器自行识别的注释约定（浏览器忽略）。分组用显式起止标识符标记，描述显示在分组标题下：

  ```css
  /**
   * @group brand           分组名，开组（必填，值即展示标题）
   * @layer scale           所属层，必填：scale（色阶区）| semantic（语义区）
   * @note 品牌主色           分组描述，可多行续写（@description 同义）
   */
  --bkms-brand-2: #3B6EF5;
  /* @endgroup */          闭组标识，之后到下一个 @group 之前的声明归入「未分组」
  ```

- `/** 用途 */` 仍是单条 token 的说明（原有格式）。兼容与容错：旧格式 `/* 组名（组描述） */` 继续按分组解析；声明同行尾注释 `--x: #fff; /* 用途 */` 挂到该 token；非 @tag 多行块注释兜底为组描述；未知 @tag 忽略不报错。
- 色差使用 CIEDE2000（ΔE00）。色值建议的贴近阈值为 **6**；颜色搜索的容错阈值为 **3**。
- 工具自身的界面配色定义在 `src/styles/shell.css`，是一组固定值，不随主题 token 变化；色块与预览展示的颜色仍取自 token 真源。
- 顶栏右侧的字典主题切换只切换展示的色值集合，不换工具外壳、不写 `data-theme`、不触发主应用换肤。默认档读 `tokens/` 三份正式文件；`src/styles/theme/themes/*.css` 自动注册为可选主题（文件名即下拉 label，index.css 除外，纯文本解析、忽略选择器），新增或替换文件即可，palette 侧零改动。切换会同步影响色块展示、语义层 `var()` 解析结果、搜索与色值建议。

需要修改主题 token 时，用 AI IDE 走 `theme-designer` skill（`.agents/skills/theme-designer/`，CodeBuddy 下为 `.codebuddy/skills/theme-designer/`），它负责定位真源、改对层级；本工具只用于改完后的预览与对比。

## 代码结构

```
src/
├─ App.vue                     # 页面编排：侧栏、视图切换、专注、复制提示
├─ main.ts                     # 入口
├─ router/
│  └─ index.ts                 # hash 路由，四个视图页
├─ config/
│  ├─ index.ts                 # 各视图标题/描述/分组/搜索分块配置（带类型约束）
│  └─ components.ts            # 组件预览导航项（来自 component-catalog 生成清单）
├─ styles/
│  ├─ main.css                 # 主布局样式
│  └─ shell.css                # 工具界面固定配色
├─ pages/                      # 各视图页
│  ├─ ColorPage.vue
│  ├─ RadiusPage.vue
│  ├─ VizPage.vue
│  ├─ TokenPage.vue
│  └─ ComponentPage.vue
├─ components/
│  ├─ PaletteSidebar.vue       # 左侧主导航
│  ├─ PaletteAside.vue         # 右侧抽屉容器
│  ├─ ViewTabs.vue             # 视图切换
│  ├─ ComponentSort.vue        # 组件按使用次数排序
│  ├─ AdvisorFab.vue           # 色值建议悬浮入口
│  ├─ Toast.vue                # 复制等轻提示
│  ├─ SectionPanel.vue         # 分组容器与专注模式
│  ├─ SearchBar.vue            # 顶部搜索框（受控输入，不认识视图）
│  ├─ SearchResults.vue        # 搜索结果（只渲染 blocks，不认识视图）
│  ├─ TokenCard.vue            # 卡片通用外壳与复制
│  ├─ TokenCell.vue            # 卡片内容：形态由 previews 规则决定，分区只定尺寸
│  ├─ ColorAdvisor.vue         # 色值建议面板
│  └─ previews/                # 按 token 类别选预览组件（文字/线条/背景/阴影/色块兜底）
│     ├─ index.ts              # token 类别 → 预览组件映射
│     ├─ TextPreview.vue
│     ├─ LinePreview.vue
│     ├─ BackgroundPreview.vue
│     ├─ ShadowPreview.vue
│     ├─ SwatchPreview.vue
│     ├─ VizPreview.vue        # viz 语义仿制小样（线条/面/状态/文字/图表/选中态/分类色）
│     ├─ vizSamples.ts         # viz 前缀 → 小样标识
│     ├─ RadiusPreview.vue     # 圆角语义仿制小样
│     └─ radiusSamples.ts      # 圆角语义 → 小样标识
└─ util/
   ├─ tokens.ts                # 解析 CSS token（颜色 / 圆角 / viz 三路），递归解析 var()
   ├─ color-diff.ts            # CIEDE2000 与颜色输入归一化
   ├─ suggest.ts               # 色值建议候选池与筛选
   ├─ search.ts                # 搜索匹配（纯函数，作用域由调用方传入）
   └─ useDrag.ts               # 拖动、边界约束与磁吸
```
