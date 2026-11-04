# bk-patch.css 审计结论（Step 3，2026-11-03）

原文件 19 条规则逐条三分类（docs/THEME_STEPS-v4.md Step 3），文件已退役删除，`main.css` 的 `@import './bk-patch.css'` 一并移除。

| # | 规则 | 处置 | 去向 | 依据 |
| --- | --- | --- | --- | --- |
| 1 | `.bk-navigation-wrapper ... .container-content { padding: 0 }` | 迁 | patches/navigation.css | 布局修正 |
| 2 | `.vxe-table--tooltip-wrapper { z-index: 3000 }` | 迁 | patches/table.css | 层级修正 |
| 3 | `.bk-tab-content { padding: 18px 24px }` | 迁 | patches/form.css | 尺寸修正（tab 无独立域，归通用控件域） |
| 4 | `.bk-message-content.multi ... { position: static }` | 迁 | patches/feedback.css | unocss fixed 覆盖组件库的坑，保留原注释 |
| 5 | `.bk-button:not(...) { min-width: 88px }` | 迁 | patches/form.css | 尺寸修正 |
| 6/7 | `.content-hover .content-item` 显隐 | 迁 | main.css | 业务工具类（非组件库补丁），与 `.ellipsis` 同类 |
| 8 | `.scrollbar-stable` | 迁 | main.css | 业务工具类 |
| 9 | `.bk-textarea { min-height: 50px }` | 迁 | patches/form.css | 尺寸修正 |
| 10/11 | `.normal/large-exception .bk-exception-img` | 迁 | patches/feedback.css | 尺寸修正 |
| 12 | `.bfc::before/::after` | 迁 | main.css | 业务工具类（BFC 清浮动） |
| 13 | `.vxe-table ... nth-last-child(1) background-size` | 迁 | patches/table.css | vxe 斑马纹残留清除，布局类 |
| 14 | `.bk-search-select-container ... { min-width: fit-content }` | 迁 | patches/form.css | 布局修正 |
| 15 | `.bk-popper { border: none }` | 迁 | patches/feedback.css | 边框去留为刻意视觉（先例：与既有去边框补丁同源） |
| 16 | `.popover-dark-translucent { background: rgba(0,0,0,.8) }` | 保留 | patches/feedback.css | 刻意视觉；spec 无对应 token，rgba 原值保留（待设计拍板是否 token 化） |
| 17 | `.vxe-table--filter-wrapper {...}` | 迁 | patches/table.css | 尺寸修正 |
| 18 | `.no-padding-popover { padding: 0 }` | 迁 | patches/feedback.css | 布局修正 |
| 19 | `.bk-popover...no-border-popover { border: none }` | 迁 | patches/feedback.css | 刻意视觉（去边框） |

**删除：0 条**（实测无"动机被 bridge/编译替换替代"的颜色类补丁，与 THEME-v4 第一节"仅 1 处色值"一致）。
