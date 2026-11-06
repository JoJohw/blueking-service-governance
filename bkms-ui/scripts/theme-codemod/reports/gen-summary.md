# gen-overrides 生成摘要

- 生成时间：2026-11-06T09:28:13.845Z
- dist 数据源：style.variable.css
- 扫描含 hex 声明：1713；归属组件：36 个；生成覆写规则：331 条 / 480 声明
- 字面量源（dist/style.css）：359 条 / 554 声明（bkui-theme-literal/，28 个组件；未归属 283 条不计入台账）
- 未归属规则（选择器无白名单组件前缀）：129 条
- 未收录 hex（不在 mapping/keep/pending 任一清单）：6 种

## 按组件产出

| 文件 | 组件 | 规则数 | 声明数 |
| --- | --- | --- | --- |
| patches/bkui-theme/alert.css | Alert | 13 | 19 |
| patches/bkui-theme/card.css | Card | 5 | 6 |
| patches/bkui-theme/checkbox.css | Checkbox | 8 | 12 |
| patches/bkui-theme/collapse.css | Collapse（monitor 渲染） | 7 | 8 |
| patches/bkui-theme/date-picker.css | DatePicker | 33 | 48 |
| patches/bkui-theme/dialog.css | Dialog | 3 | 4 |
| patches/bkui-theme/dropdown.css | Dropdown | 5 | 7 |
| patches/bkui-theme/exception.css | Exception | 2 | 2 |
| patches/bkui-theme/form.css | Form | 5 | 5 |
| patches/bkui-theme/infobox.css | InfoBox | 1 | 1 |
| patches/bkui-theme/input.css | Input | 7 | 7 |
| patches/bkui-theme/menu.css | Menu | 4 | 5 |
| patches/bkui-theme/message.css | Message | 17 | 23 |
| patches/bkui-theme/navigation.css | Navigation | 9 | 13 |
| patches/bkui-theme/pop-confirm.css | PopConfirm | 3 | 3 |
| patches/bkui-theme/popover.css | Popover | 25 | 40 |
| patches/bkui-theme/popper.css | Popper（Popover 浮层） | 6 | 14 |
| patches/bkui-theme/progress.css | Progress | 2 | 2 |
| patches/bkui-theme/radio.css | Radio | 4 | 7 |
| patches/bkui-theme/resize-layout.css | ResizeLayout | 10 | 13 |
| patches/bkui-theme/scroll-util.css | ScrollUtil（第三方滚动条） | 4 | 7 |
| patches/bkui-theme/search-select.css | SearchSelect | 17 | 26 |
| patches/bkui-theme/select.css | Select | 9 | 13 |
| patches/bkui-theme/sideslider.css | Sideslider | 8 | 13 |
| patches/bkui-theme/slider.css | Slider（monitor 渲染） | 6 | 8 |
| patches/bkui-theme/steps.css | Steps | 11 | 25 |
| patches/bkui-theme/switcher.css | Switcher | 4 | 5 |
| patches/bkui-theme/tab.css | Tab | 13 | 17 |
| patches/bkui-theme/tag.css | Tag | 23 | 36 |
| patches/bkui-theme/tag-input.css | TagInput | 12 | 17 |
| patches/bkui-theme/textarea.css | Textarea（Input textarea 形态） | 3 | 5 |
| patches/bkui-theme/time-picker.css | TimePicker | 13 | 16 |
| patches/bkui-theme/timeline.css | Timeline | 15 | 21 |
| patches/bkui-theme/transfer.css | Transfer | 2 | 3 |
| patches/bkui-theme/tree.css | Tree | 11 | 12 |
| patches/bkui-theme/upload.css | Upload | 11 | 17 |

## 未归属规则（需人工判定收编或加入白名单/keep）

- `fieldset` → #c0c0c0
- `.bk-rate-stars .bk-rate-star` → #c5c7d1
- `.bk-rate-stars .bk-rate-star.bk-is-select` → #ffb848
- `.bk-swiper-index li` → #63656e
- `.bk-swiper-index li.bk-current-index` → #c5c7d1
- `.bk-swiper-nav` → #1f2d3d
- `.bk-swiper-nav .bk-swiper-nav-icon` → #ffffff
- `.bk-swiper-nav:hover` → #1f2d3d
- `.bk-table-head-action` → #c4c6cc
- `.bk-table-head-action.active` → #3a84ff
- `.bk-head-cell-sort .sort-action` → #c0c4cc
- `.bk-head-cell-sort .sort-action.active` → #3a84ff
- `.bk-table-settings[data-bk-table-settings-theme=true] .bk-pop2-arrow[data-arrow=top]` → #dcdee5
- `.bk-table-settings[data-bk-table-settings-theme=true] .bk-pop2-arrow[data-arrow=bottom]` → #dcdee5
- `.bk-table-settings[data-bk-table-settings-theme=true] .bk-pop2-arrow[data-arrow=left]` → #dcdee5
- `.bk-table-settings[data-bk-table-settings-theme=true] .bk-pop2-arrow[data-arrow=right]` → #dcdee5
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content` → #dcdee5
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-head` → #313238
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-head .head-title` → #313238
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-title` → #63656e
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-title .field-setting-label` → #313238
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-title .limit` → #c4c6cc
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-title .check-all` → #3a84ff
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-line-height` → #f0f1f5
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-line-height .line-size` → #63656e #c4c6cc
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-line-height .line-size.active` → #3a84ff #e1ecff #a3c5fd
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-line-height .line-size:first-child` → #c4c6cc
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-body .setting-body-line-height .line-size:last-child` → #c4c6cc
- `.bk-table-settings[data-bk-table-settings-theme=true] .setting-content .setting-footer` → #fafbfd #dcdee5
- `.bk-table .bk-table-body::-webkit-scrollbar-thumb` → #dddddd #cccccc
- `.bk-table .bk-table-body .resize-column` → #3785ff
- `.bk-table .bk-table-head table th.expand-row .expand-btn-action,.bk-table .bk-table-body table th.expand-row .expand-btn-action,.bk-table .bk-table-head table td.expand-row .expand-btn-action,.bk-table .bk-table-body table td.expand-row .expand-btn-action` → #575961
- `.bk-table .bk-table-head table th .expand-btn-action,.bk-table .bk-table-body table th .expand-btn-action,.bk-table .bk-table-head table td .expand-btn-action,.bk-table .bk-table-body table td .expand-btn-action` → #c4c6cc
- `.bk-table .bk-table-head table thead th.col-pointer-hover.poiner-right:after,.bk-table .bk-table-body table thead th.col-pointer-hover.poiner-right:after` → #3785ff
- `.bk-table .bk-table-head table thead th.col-pointer-hover.poiner-left:after,.bk-table .bk-table-body table thead th.col-pointer-hover.poiner-left:after` → #3785ff
- `.bk-table .bk-table-head table thead th .across-page-cell .dropwn-icon:after,.bk-table .bk-table-body table thead th .across-page-cell .dropwn-icon:after` → #63656e
- `.bk-table .bk-table-head table tbody tr.stripe-row,.bk-table .bk-table-body table tbody tr.stripe-row` → #fafbfd
- `.bk-table .bk-table-head table tbody tr.stripe-row td,.bk-table .bk-table-body table tbody tr.stripe-row td` → #fafbfd
- `.bk-table .bk-table-head table tbody tr td,.bk-table .bk-table-body table tbody tr td` → #ffffff
- `.bk-table .bk-table-head table tbody tr.--drag-start td,.bk-table .bk-table-body table tbody tr.--drag-start td` → #ffffff
- `.bk-table .bk-table-head .col-resize-drag` → #3785ff
- `.bk-across-page-popover .dropwn-content` → #ffffff #dcdee5
- `.bk-across-page-popover .dropwn-content>div` → #63656e
- `.bk-across-page-popover .dropwn-content>div:hover` → #f5f7fa
- `.bk-notify` → #ffffff #f0f1f5 #000000
- `.bk-notify .bk-notify-content-header` → #313238
- `.bk-process .bk-process-toggle.active,.bk-process .bk-process-toggle:hover` → #ffffff
- `.bk-process li` → #f0f1f5
- `.bk-process li:before` → #ffffff
- `.bk-process li:after` → #f0f1f5
- `.bk-process li.success` → #ffffff
- `.bk-process li.current` → #ffffff
- `.bk-process li.error` → #ffffff
- `.bk-pagination` → #63656e
- `.bk-pagination-list-pre-batch,.bk-pagination-list-next-batch,.bk-pagination-list-pre,.bk-pagination-list-next,.bk-pagination-list-item` → #63656e #ffffff
- `.bk-pagination-list-pre-batch.is-active,.bk-pagination-list-next-batch.is-active,.bk-pagination-list-pre.is-active,.bk-pagination-list-next.is-active,.bk-pagination-list-item.is-active` → #3a84ff #e1ecff
- `.bk-pagination-list-pre-batch:hover,.bk-pagination-list-next-batch:hover,.bk-pagination-list-pre:hover,.bk-pagination-list-next:hover,.bk-pagination-list-item:hover` → #f0f1f5
- `.bk-pagination-list-pre-batch.is-disabled,.bk-pagination-list-next-batch.is-disabled,.bk-pagination-list-pre.is-disabled,.bk-pagination-list-next.is-disabled,.bk-pagination-list-item.is-disabled` → #c4c6cc #fafbfd #dcdee5
- `.bk-pagination-list-pre,.bk-pagination-list-next` → #979ba5
- `.bk-pagination-list-pre.is-disabled,.bk-pagination-list-next.is-disabled` → #dcdee5
- `.bk-pagination-small-list .bk-pagination-picker` → #f0f1f5
- `.bk-pagination-small-list .bk-pagination-picker:hover` → #eaebf0
- `.bk-pagination-small-list .bk-pagination-picker.is-focused` → #ffffff #3a84ff
- `.bk-pagination-btn-pre,.bk-pagination-btn-next` → #979ba5
- `.bk-pagination-btn-pre:hover,.bk-pagination-btn-next:hover` → #3a84ff #f0f1f5
- `.bk-pagination-btn-pre.is-disabled,.bk-pagination-btn-next.is-disabled` → #dcdee5
- `.bk-pagination-picker-list .item` → #63656e
- `.bk-pagination-picker-list .item:hover,.bk-pagination-picker-list .item.is-actived` → #3a84ff #f4f6fa
- `.bk-code-diff .d2h-files-diff .d2h-file-side-diff:last-child .d2h-diff-table` → #dcdee5
- `.bk-code-diff .d2h-code-side-linenumber` → #fafbfd
- `.bk-code-diff.dark .d2h-files-diff:last-child .d2h-diff-table` → #313238
- `.bk-code-diff.dark .d2h-file-side-diff:nth-child(n+2) .d2h-code-wrapper` → #313238
- `.bk-code-diff.dark .d2h-code-linenumber,.bk-code-diff.dark .d2h-code-side-linenumber` → #8f8f89 #212121
- `.bk-code-diff.dark .d2h-del` → #422321
- `.bk-code-diff.dark .d2h-ins` → #212121
- `.bk-code-diff.dark .d2h-code-side-emptyplaceholder,.bk-code-diff.dark .d2h-emptyplaceholder` → #292929
- `.bk-cascader` → #63656e #ffffff #c4c6cc
- `.bk-cascader.is-hover:not(.is-disabled)` → #979ba5
- `.bk-cascader.is-focus` → #3a84ff
- `.bk-cascader.is-unselected:before` → #c3cdd7
- `.bk-cascader .bk-icon-angle-up,.bk-cascader .bk-icon-clear-icon` → #979ba5
- `.bk-cascader .bk-icon-clear-icon` → #c4c6cc
- `.bk-cascader .bk-icon-clear-icon:hover` → #979ba5
- `.bk-cascader .bk-cascader-name .bk-cascader-search-input::placeholder` → #c3cdd7
- `.bk-cascader .bk-cascader-name .cascader-tag-list .tag-item` → #f0f1f5
- `.bk-cascader .bk-cascader-name .cascader-tag-list .tag-item:hover` → #dcdee5
- `.bk-cascader-popover` → #000000
- `.bk-cascader-popover .bk-cascader-panel-wrapper .bk-cascader-panel-empty-wrapper` → #63656e
- `.bk-cascader-popover .bk-cascader-panel-wrapper .bk-cascader-search-empty` → #63656e
- `.bk-color-picker` → #63656e #dcdee5
- `.bk-color-picker:hover,.bk-color-picker:focus` → #3a84ff
- `.bk-color-picker.bk-color-picker-show-dropdown` → #3a84ff #2d8cf0
- `.bk-color-picker.bk-color-picker-disabled` → #e1ecff #699df4
- `.bk-color-picker.bk-color-picker-disabled .bk-color-picker-text,.bk-color-picker.bk-color-picker-disabled .bk-color-picker-icon .bk-icon-angle-down` → #3a84ff
- `.bk-color-picker .bk-color-picker-color .bk-color-picker-color-square` → #3a84ff #000000
- `.bk-color-picker .bk-color-picker-text` → #63656e
- `.bk-color-picker .bk-color-picker-icon .bk-icon-angle-down` → #979ba5
- `.bk-color-picker-saturation .bk-color-picker-saturation-white` → #ffffff
- `.bk-color-picker-saturation .bk-color-picker-saturation-black` → #000000
- `.bk-color-picker-hue` → #ffff00 #00ff00 #00ffff #0000ff #ff00ff
- `.bk-color-picker-hue .bk-color-picker-hue-pointer .bk-color-picker-hue-rectangle` → #ffffff
- `.bk-color-picker-input` → #63656e
- `.bk-color-picker-input .bk-color-picker-input-part .bk-color-picker-input-value` → #c4c6cc
- `.bk-color-picker-input .bk-color-picker-input-part .bk-color-picker-input-value:focus` → #3a84ff
- `.bk-color-picker-input .bk-color-picker-input-part .bk-color-picker-input-value.error` → #3a84ff
- `.bk-color-picker-recommend-container` → #f0f1f5
- `.bk-color-picker-recommend-container .bk-color-picker-recommend .bk-color-picker-recommend-color` → #000000
- `.bk-color-picker-recommend-container .bk-color-picker-recommend .bk-color-picker-recommend-color.bk-color-picker-recommend-selected-color` → #3a84ff
- `.bk-color-picker-saturation:focus,.bk-color-picker-hue:focus,.bk-color-picker-recommend:focus` → #2d8cf0
- `.bk-color-picker-pointer .bk-color-picker-circle` → #ffffff #000000
- `.bk-color-picker-empty:after` → #ea3536
- `.bk-image-placeholder` → #c4c6cc #f0f1f5
- `.bk-image-viewer-wrapper` → 
- `.bk-image-viewer-header` → #c4c6cc #000000
- `.bk-image-viewer-header .quit-tips` → #979ba5
- `.bk-image-viewer-btn` → #dcdee5 #000000
- `.bk-image-viewer-btn:hover` → #ffffff
- `.bk-image-viewer-close` → #c4c6cc
- `.bk-image-viewer-close:hover` → #ffffff
- `.bk-image-viewer-error` → #313238
- `.bk-image-viewer-actions` → #ffffff
- `.bk-image-viewer-actions:hover` → #000000
- `.bk-image-viewer-actions-inner` → #c4c6cc
- `.bk-image-viewer-actions-inner .bk-icon:hover` → #ffffff
- `.bk-scrollbar .bk__rail-x:hover,.bk-scrollbar .bk__rail-y:hover,.bk-scrollbar .bk__rail-x:focus,.bk-scrollbar .bk__rail-y:focus,.bk-scrollbar .bk__rail-x.bk--clicking,.bk-scrollbar .bk__rail-y.bk--clicking` → #f0f1f5
- `.bk-scrollbar .bk__thumb-x` → #dcdee5
- `.bk-scrollbar .bk__thumb-y` → #dcdee5
- `.bk-scrollbar .bk__rail-x:hover>.bk__thumb-x,.bk-scrollbar .bk__rail-x:focus>.bk__thumb-x,.bk-scrollbar .bk__rail-x.bk--clicking .bk__thumb-x` → #979ba5
- `.bk-scrollbar .bk__rail-y:hover>.bk__thumb-y,.bk-scrollbar .bk__rail-y:focus>.bk__thumb-y,.bk-scrollbar .bk__rail-y.bk--clicking .bk__thumb-y` → #979ba5

## 未收录 hex（需补录 mapping/pending/keep 后重跑）

- #0000ff：`.bk-color-picker-hue`
- #00ff00：`.bk-color-picker-hue`
- #00ffff：`.bk-color-picker-hue`
- #1f2d3d：`.bk-swiper-nav`、`.bk-swiper-nav:hover`
- #ff00ff：`.bk-color-picker-hue`
- #ffff00：`.bk-color-picker-hue`
