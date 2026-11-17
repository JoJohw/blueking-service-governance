# BKMS 主题色板

一个查看、检索和比对 BKMS 主题色值的小工具。色值直接解析自主题 token 源文件，点击任意色块即可复制对应的 `var()` 引用。

功能演进见[更新记录](./CHANGELOG.md)。

## 启动

在仓库根目录运行：

```bash
pnpm theme:designer
```

然后打开 `http://localhost:5300`。构建产物输出到 `dev/palette/dist/`：

```bash
npx vite build --config dev/palette/vite.config.ts
```

## 主要功能

### 浏览色板

左侧是分组导航（色阶 / 语义层），右侧按分组展示所有 token：

- **色阶**：以原始色值展示，如 `--bkms-brand-2` → `#3B6EF5`。
- **语义层**：显示 token 引用的色阶，以及解析后的 hex；阴影组也在这里——阴影是按场景命名的效果值，直接写 8 位带 alpha 色，无法由色阶派生。
- 两侧都会出现「用途预览」（文字 / 线条 / 背景 / 阴影）：**预览形态由 token 类别决定，与挂在哪个分区无关**——没有用途语境的原子色（品牌色、中性色、keep 级）显示纯色块。
- 点击任意卡片复制 `var(--bkms-xxx)`，顶部会弹出复制成功提示。

### 搜索

页面顶部常驻搜索框，输入即过滤，结果按「色阶 / 语义层」分组展示。支持两类查询：

- **文本**：token 名、用途说明、分组名、引用关系。可以输入完整变量，如 `var(--bkms-brand-3)`。
- **颜色值**：`hex`、`rgb()`、`rgba()`、`hsl()`、`hsla()`。颜色查询按 CIEDE2000 色差匹配，精确值优先，并容许小幅误差。

搜索时左侧导航自动收起以让出空间；清空搜索后恢复完整色板。

### 专注模式

每个分组右上角有「专注模式」按钮，普通状态下鼠标移到该分组整块区域时才显示。点击后只保留该分组、放大色块，标题栏吸顶不随滚动移动；再次点击退出。专注状态会写入 URL 参数 `?focus=<分组名>`，刷新后保持；退出时回到进入前的滚动位置。

### 色值建议

右下角的「色值建议」悬浮胶囊打开工具面板（无遮罩，不打断浏览）。输入一个颜色——支持 hex / rgb 文本或直接用取色器选取——工具会：

1. 在面板上方并排显示输入色与最接近的色板色，中间给出 CIEDE2000 ΔE 数值；
2. 列出色板中 ΔE ≤ 6 的候选，按色差从小到大排列，每项可单独复制 `var()`；
3. 若阈值内没有候选，则展示最接近的 5 个作为参考。

胶囊和面板都可拖动，松手靠近边缘时自动吸附，不会拖出视口。按 `Esc` 关闭面板。专注模式下工具保持打开、位置不变。

## 数据来源与口径

- 色阶来自 `src/styles/theme/tokens/colors.css`，语义层来自同目录的 `semantic.css`，由 `src/util/tokens.ts` 解析。语义 token 通过 `var()` 引用色阶，工具会递归解析到最终色值。
- CSS 本身不支持 JSDoc，`@tag` 是工具自定义、解析器自行识别的注释约定（浏览器忽略）。分组用显式起止标识符标记，描述显示在分组标题下：

  ```css
  /**
   * @group keep            分组名，开组（必填，值即展示标题）
   * @note 原值收编成 token   分组描述，可多行续写（@description 同义）
   */
  --bkms-keep-ffb848: #FFB848;
  /* @endgroup */          闭组标识，之后到下一个 @group 之前的声明归入「未分组」
  ```

- `/** 用途 */` 仍是单条 token 的说明（原有格式）。兼容与容错：旧格式 `/* 组名（组描述） */` 继续按分组解析（semantic.css 仍用）；声明同行尾注释 `--x: #fff; /* 用途 */` 挂到该 token；非 @tag 多行块注释兜底为组描述；未知 @tag 忽略不报错。
- 色差使用 CIEDE2000（ΔE00）。色值建议的贴近阈值为 **6**；颜色搜索的容错阈值为 **3**。
- 工具自身的界面配色定义在 `src/shell.css`，是一组固定值，不随主题 token 变化；色块与预览展示的颜色仍取自 token 真源。

需要修改主题 token 时，用 AI IDE 走 `theme-designer` skill（`.agents/skills/theme-designer/`，CodeBuddy 下为 `.codebuddy/skills/theme-designer/`），它负责定位真源、改对层级；本工具只用于改完后的预览与对比。

## 代码结构

```
src/
├─ App.vue                     # 页面编排：导航、分组列表、搜索、专注、复制提示
├─ main.ts                     # 入口
├─ shell.css                   # 工具界面固定配色
├─ components/
│  ├─ SectionPanel.vue         # 分组容器与专注模式
│  ├─ TokenCard.vue            # 卡片通用外壳与复制
│  ├─ TokenCell.vue            # 卡片内容：形态由 previews 规则决定，分区只定尺寸
│  ├─ ColorAdvisor.vue         # 色值建议面板
│  └─ previews/                # 按 token 类别选预览组件（文字/线条/背景/阴影/色块兜底）
└─ util/
   ├─ tokens.ts                # 解析 CSS token、递归解析 var()
   ├─ color-diff.ts            # CIEDE2000 与颜色输入归一化
   ├─ suggest.ts               # 色值建议候选池与筛选
   ├─ search.ts                # 搜索匹配
   └─ useDrag.ts               # 拖动、边界约束与磁吸
```
