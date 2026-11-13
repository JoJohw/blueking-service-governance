# bkui 域变量桥接说明

变量清单实抓自 `node_modules/bkui-vue/dist/style.variable.css`（v2.0.2-beta.97）`:root` 块，共 128 个。
桥接文件：`src/styles/theme/patches/bkui-theme/variables.css`（经 `src/styles/theme/variables.css` 聚合加载，
语义映射口径见该文件头注释）。

## 未重声明的变量及原因

**值引用其他 bkui 变量的**（随桥接级联联动，无需重声明）：`--border-style-color`、`--input-disabled-border`、
`--input-color`、`--input-border-color`、`--input-height-base`、`--input-icon-size`、`--message-color`、
`--search-select-focus-border-color`、`--search-select-font-color`、`--search-select-placeholder-color`、
`--search-select-message-color`、`--search-select-menu-border-color`。

**keep 保留色**（值不换）：`--link-warning-hover-color`(#ffb848)。

**非颜色/尺寸变量**（不动）：`--bk-prefix`、`--popover-max-height`、`--font-size-*`、`--line-height-*`、
`--component-size-*`、`--border-width/style-base`、`--border-radius-base`(2px)、`--input-broder-radius`(3px)、
`--input-horizontal-padding`、`--menu-width`、`--menu-collapse-width`、`--date-picker-dropdown-mb`。

已重声明清单不再在此维护——`patches/bkui-theme/variables.css` 即清单本体；
设计拍板出处记于 docs/theme-style/THEME.md（2026-11-13 pending-designer-review 建议值批）。
