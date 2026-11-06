# 颜色规范统一 · 待确认清单（共 68 个：需确认 49，可归档 19）

> 背景：项目正把界面颜色统一到新规范色板。大部分旧颜色已自动替换，以下颜色在规范中没有明确新值，需要按组确认。结论直接在群里回就行。

## 一、按钮和链接的悬停 / 按下 / 禁用色（7 个）

规范色板只定义了 success / warning / danger 的正常态（-2 档）。组件库里这些颜色还有悬停、按下、禁用三种状态，规范没说各用第几档。告知规则即可（如：hover 用 -4 档、active 用 -1 档、disabled 用 -5 档），或者说保持现有深浅关系不变。

### 颜色：`#1AB943`，建议：success-2 `#2CAF5E`
出现位置：组件库 button、全局样式（项目实际使用，3 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 67 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件；组件库变量 `--button-success-active-color`

### 颜色：`#45E35F`，建议：success-2 `#2CAF5E`
出现位置：组件库 button、link、全局样式（项目实际使用，4 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 67 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件；组件库变量 `--button-success-hover-color`、`--link-success-hover-color`

### 颜色：`#94F5A4`，建议：success-4 `#A1E3BA`
出现位置：组件库 alert、link、全局样式（项目实际使用，4 个样式文件） + 公共变量内联 67 处；组件库变量 `--link-success-disabled-color`

### 颜色：`#EB9000`，建议：warning-1 `#E38B02`
出现位置：组件库 button、全局样式（项目实际使用，3 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 67 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件；组件库变量 `--button-warning-active-color`

### 颜色：`#FFD695`，建议：warning-4 `#F9D090`
出现位置：组件库 link、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--link-warning-disabled-color`

### 颜色：`#DB2626`，建议：danger-1 `#E71818`
出现位置：组件库 button、全局样式（项目实际使用，3 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 67 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件；组件库变量 `--button-danger-active-color`

### 颜色：`#FD9C9C`，建议：danger-4 `#F8B4B4`
出现位置：组件库 link、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--link-danger-disabled-color`

## 二、深色界面（侧栏导航、深色提示浮层）（14 个）

以下深色用于侧栏菜单底色、深色 tooltip 等，与 navy 家族的相似度超出自动合并阈值。逐个确认：归入 navy 某一档、保留现状、还是有单独的深色规范？

### 颜色：`#182132`，建议：navy-1 `#0C1323`
用途：--menu-bg-color/--nav-bg-color 侧栏深底
出现位置：业务页面 `src/pages/home/space-selector.vue:36`；组件库 menu、navigation、全局样式（项目实际使用，3 个样式文件） + 公共变量内联 67 处；组件库变量 `--menu-bg-color`、`--nav-header-bg-color`、`--nav-bg-color`

### 颜色：`#253047`，建议：navy-2 `#31394F`
出现位置：组件库 navigation（项目实际使用，1 个样式文件） + 公共变量内联 1 处

### 颜色：`#263247`，建议：navy-2 `#31394F`
出现位置：组件库 navigation（项目实际使用，1 个样式文件） + 公共变量内联 1 处

### 颜色：`#989CA7`，建议：navy-4 `#96A2B9`
用途：编译替换纳入 date-picker 后新发现，待设计拍板
出现位置：日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 6 个文件

### 颜色：`#151D2C`，建议：navy-1 `#0C1323`
出现位置：组件库 menu、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--submenu-bg-color`

### 颜色：`#26323D`，建议：navy-2 `#31394F`
出现位置：业务页面 `src/pages/application/detail/deploy/instance-list/components/instance-table.vue:1183`；组件库 dropdown、popover（项目实际使用，4 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 3 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#424A5F`，建议：navy-3 `#384A6B`
出现位置：组件库 navigation（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#9FA3AE`，建议：navy-4 `#96A2B9`
出现位置：组件库 message（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#A0A0A0`，建议：navy-4 `#96A2B9`
出现位置：组件库 全局样式、tree（项目实际使用，5 个样式文件）；另有 2 个未使用组件仅打包未列出 + 公共变量内联 4 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#ACAFB6`，建议：navy-4 `#96A2B9`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#ACB9D1`，建议：navy-5 `#C4C6CC`
出现位置：组件库 menu（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#B0BDD5`，建议：navy-5 `#C4C6CC`
出现位置：组件库 menu、navigation（项目实际使用，4 个样式文件） + 公共变量内联 2 处

### 颜色：`#C0C0C0`，建议：navy-5 `#C4C6CC`
出现位置：组件库 全局样式（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#C3CDD7`，建议：navy-5 `#C4C6CC`
出现位置：组件库 tree（项目实际使用，3 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

## 三、提示条（Message）的底色与阴影（5 个）

各类提示条（信息/成功/警告/错误）的浅色底和同系浅阴影，建议统一用对应色系的最浅一档（-7，信息类用 brand-7）。确认或给替代色。

### 颜色：`#FFF4E2`，建议：warning-7 `#FDF4E8`
出现位置：组件库 alert、message、全局样式（项目实际使用，4 个样式文件） + 公共变量内联 67 处；组件库变量 `--message-warning-bg-color`

### 颜色：`#EAF3FF`，建议：brand-7 `#F0F4FF`
出现位置：业务页面 `src/components/interval-selector.vue:29,44,55`、`src/components/view-default-env-vars/env-var-copy-dropdown.vue:38,48`；组件库 tag-input（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#F2FFF4`，建议：success-7 `#EBFAF0`
出现位置：组件库 alert、message、全局样式（项目实际使用，4 个样式文件） + 公共变量内联 67 处；组件库变量 `--message-success-bg-color`

### 颜色：`#EDE6DB`，建议：warning-6 `#FDEED8`
出现位置：组件库 message、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--message-warning-shadow-color`

### 颜色：`#F6DADA`，建议：danger-5 `#FFDDDD`
出现位置：组件库 message、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--message-danger-shadow-color`

## 五、灰色及杂散颜色（23 个）

这些颜色散落在组件库和页面细节里，与规范色板有肉眼可见差异。逐个确认"并入最接近的规范色"或"保留原色"。

### 颜色：`#768197`，建议：neutral-3 `#8F9FBD`
出现位置：组件库 navigation（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#3F87FF`，建议：brand-2 `#3B6EF5`
用途：--menu-active-bg-color 渐变
出现位置：组件库 menu、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--menu-active-bg-color`

### 颜色：`#1890FF`，建议：brand-2 `#3B6EF5`
出现位置：组件库 switcher（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#2196F3`，建议：brand-2 `#3B6EF5`
出现位置：组件库 tree（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#2D8CF0`，建议：brand-2 `#3B6EF5`
出现位置：组件库 date-picker（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#609CFE`，建议：brand-3 `#6691FF`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#6E788B`，建议：neutral-2 `#4A5973`
出现位置：组件库 menu、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--menu-group-color`

### 颜色：`#D3D9E4`，建议：neutral-4 `#C1CDE5`
出现位置：组件库 navigation（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#D8D8D8`，建议：success-5 `#CBF0DA`
出现位置：组件库 timeline（项目实际使用，3 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处；组件库变量 `--d2h-file-header-border-color`

### 颜色：`#DDE4EB`，建议：neutral-5 `#E4E9F2`
出现位置：组件库 divider、dropdown、select（项目实际使用，5 个样式文件） + 公共变量内联 2 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#E6E9EA`，建议：neutral-5 `#E4E9F2`
出现位置：组件库 search-select（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#E8EAEC`，建议：neutral-5 `#E4E9F2`
出现位置：业务页面 `src/pages/application/detail/deploy/instance-list/components/instance-table.vue:1280,1284,1289`、`src/pages/application/global-view.vue:43`；组件库 date-picker、time-picker（项目实际使用，3 个样式文件） + 公共变量内联 2 处

### 颜色：`#F7F7F7`，建议：neutral-8 `#F7F9FD`
出现位置：组件库 date-picker（项目实际使用，3 个样式文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处；组件库变量 `--d2h-file-header-bg-color`、`--d2h-dark-moved-label-color`

### 颜色：`#14A568`，建议：success-2 `#2CAF5E`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#42B685`，建议：success-3 `#65C389`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#C9F5E2`，建议：success-5 `#CBF0DA`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#DCFFE2`，建议：success-6 `#DAF6E5`
出现位置：组件库 message、全局样式（项目实际使用，2 个样式文件） + 公共变量内联 67 处；组件库变量 `--message-success-border-color`

### 颜色：`#E4FAF0`，建议：success-7 `#EBFAF0`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#FDAF32`，建议：warning-3 `#F8B64F`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#FFDFAC`，建议：warning-5 `#FCE5C0`
出现位置：组件库 alert（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#ED5C5D`，建议：danger-3 `#FF5656`
出现位置：组件库 tag（项目实际使用，2 个样式文件） + 公共变量内联 1 处；日期选择器组件 vue2/index.iife.min.js、vue2/index.umd.min.js、vue2/vue2.css 等 4 个文件

### 颜色：`#FFD2D2`，建议：danger-5 `#FFDDDD`
出现位置：组件库 alert（项目实际使用，2 个样式文件） + 公共变量内联 1 处

### 颜色：`#FFD5D5`，建议：danger-5 `#FFDDDD`
出现位置：组件库 tree（项目实际使用，2 个样式文件） + 公共变量内联 1 处

## 六、建议直接归档（无需决策）（19 个）

以下颜色在当前代码中已无使用：或仅存在于项目未使用的组件（样式虽打包但永不渲染），或仅存在于已淘汰的旧版组件库副本。建议从待办移除、不做替换。

### 颜色：`#212121`，建议：navy-1 `#0C1323`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#292929`，建议：navy-1 `#0C1323`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#422321`，建议：neutral-1 `#111214`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#575961`，建议：neutral-2 `#4A5973`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#56B6C2`，建议：整套保留
用途：代码高亮主题（one 系）青
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#5C6370`，建议：整套保留
用途：代码高亮主题（one 系）注释灰
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#61AEEE`，建议：整套保留
用途：代码高亮主题（one 系）蓝
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#98C379`，建议：整套保留
用途：代码高亮主题（one 系）绿
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#C678DD`，建议：整套保留
用途：代码高亮主题（one 系）紫
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#D19A66`，建议：整套保留
用途：代码高亮主题（one 系）橙
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#E06C75`，建议：整套保留
用途：代码高亮主题（one 系）红
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#E6C07B`，建议：整套保留
用途：代码高亮主题（one 系）黄
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#ABB2BF`，建议：整套保留
用途：代码高亮主题（one 系）灰
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#3A3C42`，建议：navy-2 `#31394F`
用途：bkui-vue@2.0.2-beta.63 lib/navigation/navigation.less（被连带打包的旧版组件库副本），编译替换 Step 2 新发现
出现位置：无消费点

### 颜色：`#DEE0EA`，建议：neutral-5 `#E4E9F2`
用途：bkui-vue@2.0.2-beta.63 lib/navigation/navigation.less，编译替换 Step 2 新发现
出现位置：无消费点

### 颜色：`#3785FF`，建议：brand-2 `#3B6EF5`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#1D1D1D`，建议：neutral-1 `#111214`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#8F8F89`，建议：navy-4 `#96A2B9`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

### 颜色：`#9B703F`，建议：warning-1 `#E38B02`
出现位置：组件库样式（仅存在于项目未使用的组件中，页面不渲染，2 个文件）；另有 1 个未使用组件仅打包未列出 + 公共变量内联 1 处

