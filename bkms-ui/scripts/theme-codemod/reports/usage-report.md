# bkui-vue 组件使用情况报告

- 生成时间：2026-11-06T02:43:32.177Z
- 数据源：src/**/*.{vue,ts,tsx,js} 的 `import { X } from 'bkui-vue'` 与 .vue 模板 `<bk-*>` 标签
- 组件种类：37；其中 dist css 存在对应类前缀（覆写范围内）：**35**；无对应类前缀（icon 等，覆写范围外）：2

## 覆写范围内组件（按使用文件数排序）

| 组件 | 类前缀 | import 文件数 | 模板标签数 | 使用文件数 |
| --- | --- | --- | --- | --- |
| Button | `.bk-button` | 168 | 0 | 168 |
| Input | `.bk-input` | 87 | 0 | 87 |
| Message | `.bk-message` | 83 | 0 | 83 |
| Form | `.bk-form` | 74 | 0 | 74 |
| Tag | `.bk-tag` | 72 | 2 | 74 |
| Select | `.bk-select` | 50 | 0 | 50 |
| Alert | `.bk-alert` | 45 | 0 | 45 |
| Sideslider | `.bk-sideslider` | 45 | 0 | 45 |
| Radio | `.bk-radio` | 44 | 0 | 44 |
| Popover | `.bk-popover` | 38 | 1 | 39 |
| Dialog | `.bk-dialog` | 34 | 0 | 34 |
| Exception | `.bk-exception` | 31 | 0 | 31 |
| Divider | `.bk-divider` | 23 | 0 | 23 |
| SearchSelect | `.bk-search-select` | 22 | 0 | 22 |
| Loading | `.bk-loading` | 18 | 0 | 18 |
| PopConfirm | `.bk-pop-confirm` | 17 | 0 | 17 |
| Switcher | `.bk-switcher` | 17 | 0 | 17 |
| Checkbox | `.bk-checkbox` | 15 | 0 | 15 |
| InfoBox | `.bk-infobox` | 15 | 0 | 15 |
| ResizeLayout | `.bk-resize-layout` | 10 | 0 | 10 |
| Tab | `.bk-tab` | 10 | 0 | 10 |
| Dropdown | `.bk-dropdown` | 6 | 0 | 6 |
| DatePicker | `.bk-date-picker` | 5 | 0 | 5 |
| TagInput | `.bk-tag-input` | 4 | 0 | 4 |
| Tree | `.bk-tree` | 4 | 0 | 4 |
| Navigation | `.bk-navigation` | 2 | 0 | 2 |
| Card | `.bk-card` | 1 | 0 | 1 |
| Link | `.bk-link` | 1 | 0 | 1 |
| Menu | `.bk-menu` | 1 | 0 | 1 |
| Progress | `.bk-progress` | 1 | 0 | 1 |
| Steps | `.bk-steps` | 1 | 0 | 1 |
| TimePicker | `.bk-time-picker` | 1 | 0 | 1 |
| Timeline | `.bk-timeline` | 1 | 0 | 1 |
| Transfer | `.bk-transfer` | 1 | 0 | 1 |
| Upload | `.bk-upload` | 1 | 0 | 1 |

## 范围外（dist css 无对应类前缀，多为 icon）

- OverflowTitle（`bk-overflow-title`，使用文件 16）
- bkTooltips（`bk-tooltip`，使用文件 2）

## 模板 bk- 标签明细（全项目仅存少量）

- `bk-tag` x2：src/components/lane-select.vue, src/components/modules/module-item.vue
- `bk-popover` x1：src/App.vue
