# bridge.css 生成说明（Step 1）

变量清单实抓自 `node_modules/bkui-vue/dist/style.variable.css`（v2.0.2-beta.97）`:root` 块，共 128 个
（THEME-v4 记 129，以实抓为准），逐值清单原存 `reports/root-vars.txt`，已删，git 历史可查。

## 语义映射口径（THEME-v4 写死）

- `--white-color` → `--bkms-neutral-10`
- `--whitesmoke-color` → `--bkms-neutral-8`
- `--gray-color` → `--bkms-neutral-3`
- `--light-gray` → `--bkms-neutral-4`

## 未重声明的变量及原因

**值属 pending-design（待设计拍板，拍板后回填 bridge.css）**：
`--message-primary-bg-color`、`--message-warning-bg-color`、`--message-success-bg-color`、
`--message-danger-bg-color`、`--menu-bg-color`、`--submenu-bg-color`、`--menu-active-bg-color`、
`--nav-header-bg-color`、`--nav-bg-color`、`--menu-group-color`、`--button-success-hover-color`、
`--button-success-active-color`、`--button-danger-active-color`、`--button-warning-active-color`、
`--link-success-hover-color`、`--link-success-disabled-color`、`--link-warning-disabled-color`、
`--link-danger-disabled-color`、`--message-primary-shadow-color`、`--message-warning-shadow-color`、
`--message-success-shadow-color`、`--message-danger-shadow-color`。

**keep 保留色（值不变，无需重声明）**：
`--switch-default-color`(#fff)、`--fixed-navbar-background`(#fff)、`--cascader-panel-disabled-bg`(#fff)、
`--date-picker-dropdown-bg`(#fff)、`--table-bg-color`(var(--white-color)，随桥接联动)、
`--menu-active-color`(white)。

**非颜色/尺寸变量**（不动）：`--bk-prefix`、`--popover-max-height`、`--font-size-*`、`--line-height-*`、
`--component-size-*`、`--border-width/style-base`、`--border-radius-base`(2px)、`--input-broder-radius`(3px)、
`--input-height-base`、`--input-color`、`--input-bg`、`--input-border-color`、`--input-icon-size`、
`--input-horizontal-padding`、`--menu-width`、`--menu-collapse-width`、`--date-picker-dropdown-mb`。

## 已重声明（59 个）

全局组 12：primary/success/warning/danger/default/gray/light-gray/white/whitesmoke/disable/disable-bg/border。
组件级 47：input 5、button 7、radio 9、checkbox 1、switch 1、breadcrumb 3、link 5、message 2、slider 2、
menu 1、table 7、cascader 3、select 2（--select-active-color、--select-hover-color）、
search-select 1（--search-select-focus-color → brand-3，#3c96ff 命中 mapping）。
