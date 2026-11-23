/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */
/**
 * bkui 覆写生成器（gen-overrides/color.mjs）的组件族白名单。
 * 只放「按组件库事实增补」的归属与别名；算法参数留在生成器里。
 */

/**
 * 台账收编：真实渲染但不在 usage 白名单的类前缀。
 * 依据：Popover 浮层基础类 .bk-popper（styles/mixins/popper.css）、Input textarea 形态（lib/input/index.js）；
 * monitor-vue3-components 渲染 .bk-collapse/.bk-slider；@blueking/bk-user-selector 等第三方包渲染 .scroll-bar-style；
 * @blueking/table 的 :pagination 内部渲染 .bk-pagination（项目无直接 <bk-pagination>，stats-usage 判为未使用）。
 * prefixes 对 .bk-<prefix> 族（含 - 后代类）；rawPrefixes 对无 bk- 前缀的独立工具类。
 */
export const EXTRA_OWNERS = [
  { kebab: 'popper', name: 'Popper（Popover 浮层）', prefixes: ['popper'] },
  { kebab: 'collapse', name: 'Collapse（monitor 渲染）', prefixes: ['collapse'] },
  { kebab: 'slider', name: 'Slider（monitor 渲染）', prefixes: ['slider'] },
  { kebab: 'textarea', name: 'Textarea（Input textarea 形态）', prefixes: ['textarea'] },
  {
    kebab: 'scroll-util',
    name: 'ScrollUtil（第三方滚动条）',
    prefixes: ['scroll-y', 'scroll-x', 'f-scroll-x'],
    rawPrefixes: ['scroll-bar-style'],
  },
  { kebab: 'pagination', name: 'Pagination（@blueking/table 渲染）', prefixes: ['pagination'] },
];

/** 组件 -> 类前缀别名：部分组件的 DOM 类前缀与导出名 kebab 不一致 */
export const PREFIX_ALIAS = {
  dialog: ['dialog', 'modal'], // Dialog 渲染 .bk-modal-wrapper 等类
  'date-picker': ['date-picker', 'picker-panel', 'picker-confirm'], // 面板类 .bk-picker-panel-*
};
