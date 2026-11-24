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

/**
 * 色彩映射：bkui 存量写死色 → tokens/color.css 的规范令牌。
 * 键为 6 位或 8 位 hex（先按 8 位、再按基色 6 位匹配）；推不出来才会登记在这里，
 * 命中令牌值的不必写，字色位与 8 位阴影另有规则吸收。
 */
/* prettier 会重排键序与引号，破坏「hex 字面量 → 令牌」的对照关系 */
/* eslint-disable prettier/prettier */
export const HEX_TOKENS = {
  '14a568': '--bkms-success-2',
  '151d2c': '--bkms-navy-1',
  '182132': '--bkms-navy-1',
  '1890ff': '--bkms-brand-2',
  '1ab943': '--bkms-success-2',
  '2196f3': '--bkms-brand-2',
  '253047': '--bkms-navy-2',
  '26323d': '--bkms-mask',
  '263247': '--bkms-navy-2',
  '2c77f4': '--bkms-brand-1',
  '2d8cf0': '--bkms-brand-2',
  '2dcb56': '--bkms-success-2',
  '2dcb9d': '--bkms-cyan-3',
  '313238': '--bkms-neutral-1',
  '31394f': '--bkms-navy-2',
  '333333': '--bkms-navy-1',
  '3a84ff': '--bkms-brand-2',
  '3f87ff': '--bkms-brand-2',
  '424a5f': '--bkms-navy-3',
  '42b685': '--bkms-success-3',
  '45e35f': '--bkms-success-2',
  '5594fa': '--bkms-brand-3',
  '609cfe': '--bkms-brand-3',
  '63656e': '--bkms-neutral-2',
  '699df4': '--bkms-brand-3',
  '6e788b': '--bkms-neutral-2',
  '768197': '--bkms-neutral-3',
  '94f5a4': '--bkms-success-4',
  '96a2b9': '--bkms-navy-4',
  '979ba5': '--bkms-neutral-3',
  '9fa3ae': '--bkms-navy-4',
  'a0a0a0': '--bkms-navy-4',
  'a3c5fd': '--bkms-brand-4',
  'aaaaaa': '--bkms-navy-5',
  'acafb6': '--bkms-navy-4',
  'acb9d1': '--bkms-navy-5',
  'b0bdd5': '--bkms-navy-5',
  'c4c6cc': '--bkms-neutral-4',
  'c5daff': '--bkms-brand-5',
  'c9f5e2': '--bkms-success-5',
  'cccccc': '--bkms-navy-5',
  'cef0d7': '--bkms-success-5',
  'd3d9e4': '--bkms-neutral-4',
  'd8d8d8': '--bkms-neutral-5',
  'db2626': '--bkms-danger-1',
  'dcdee5': '--bkms-neutral-5',
  'dcffe2': '--bkms-success-6',
  'dddddd': '--bkms-neutral-5',
  'dde4eb': '--bkms-neutral-5',
  'e1e8f4': '--bkms-neutral-5',
  'e1ecff': '--bkms-brand-6',
  'e4faf0': '--bkms-success-7',
  'e6e9ea': '--bkms-neutral-5',
  'e8eaec': '--bkms-neutral-5',
  'ea3536': '--bkms-danger-2',
  'ea3636': '--bkms-danger-2',
  'eaebf0': '--bkms-neutral-6',
  'eaf3ff': '--bkms-brand-7',
  'eb9000': '--bkms-warning-1',
  'ebf2ff': '--bkms-brand-7',
  'ed5c5d': '--bkms-danger-3',
  'ede6db': '--bkms-warning-6',
  'edf4ff': '--bkms-brand-7',
  'f0f1f5': '--bkms-neutral-6',
  'f0f2f5': '--bkms-neutral-7',
  'f0f5ff': '--bkms-brand-7',
  'f0f8ff': '--bkms-brand-7',
  'f2fff4': '--bkms-bg-success',
  'f4f6fa': '--bkms-neutral-7',
  'f5f6fa': '--bkms-neutral-8',
  'f5f7fa': '--bkms-neutral-7',
  'f6dada': '--bkms-danger-5',
  'f7f7f7': '--bkms-neutral-8',
  'f9fafd': '--bkms-neutral-8',
  'fafbfd': '--bkms-neutral-8',
  'fd9c9c': '--bkms-danger-4',
  'fdaf32': '--bkms-warning-3',
  'fe9c00': '--bkms-warning-2',
  'fedddc': '--bkms-danger-5',
  'feebea': '--bkms-danger-6',
  'ff5656': '--bkms-danger-3',
  'ff9c01': '--bkms-warning-2',
  'ffb848': '--bkms-warning-alt',
  'ffd2d2': '--bkms-danger-5',
  'ffd5d5': '--bkms-danger-5',
  'ffd695': '--bkms-warning-4',
  'ffdddd': '--bkms-danger-5',
  'ffdfac': '--bkms-warning-5',
  'ffe8c3': '--bkms-warning-5',
  'ffeded': '--bkms-bg-danger',
  'fff1db': '--bkms-warning-6',
  'fff4e2': '--bkms-bg-warning',
  'ffffff': '--bkms-neutral-10',
  '0000001a': '--bkms-shadow-popover',
  '00000026': '--bkms-shadow-dialog',
  '00000073': '--bkms-neutral-1',
  '000000a6': '--bkms-neutral-1',
  '14a5684d': '--bkms-success-2',
  '1919290d': '--bkms-shadow-card',
  '2196f31a': '--bkms-brand-2',
  '333c481a': '--bkms-shadow-popover',
  '3a84ff29': '--bkms-brand-2',
  '3a84ff4d': '--bkms-brand-2',
  '3a84ff66': '--bkms-brand-2',
  '3a84ffe6': '--bkms-brand-2',
  '4070cb0f': '--bkms-brand-3',
  '979ba54d': '--bkms-neutral-3',
  'babcc033': '--bkms-navy-5',
  'cccccc4d': '--bkms-shadow-inset',
  'ea35364d': '--bkms-danger-2',
  'fea5004d': '--bkms-warning-2',
  'fedddc66': '--bkms-danger-5',
};
/* eslint-enable prettier/prettier */
