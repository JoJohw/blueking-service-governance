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
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * 圆角语义 → 仿制小样标识。
 *
 * 与 RadiusPreview.vue 解耦：新增语义令牌时只改本文件的 `radiusSampleMap`，
 * 再到 RadiusPreview.vue 的 `<template>` 里加一个 `v-else-if="sample === '<标识>'"` 分支即可。
 * 映射表里没有的语义（未知 / 未来新增）会由 RadiusPreview 回落到三尺寸方框。
 */

/** 语义小样的标识；标识与 RadiusPreview.vue 里的模板分支一一对应 */
export type RadiusSample =
  'base' | 'card' | 'control' | 'field' | 'full' | 'menu' | 'none' | 'overlay' | 'scroll' | 'tab' | 'tag';

/** token 名 → 小样标识。key 为去掉 `--bkms-` 前缀后的语义名 */
const radiusSampleMap: Record<string, RadiusSample> = {
  base: 'base',
  card: 'card',
  control: 'control',
  field: 'field',
  full: 'full',
  menu: 'menu',
  none: 'none',
  overlay: 'overlay',
  scroll: 'scroll',
  tab: 'tab',
  tag: 'tag',
};

/**
 * 取圆角令牌的语义小样标识。
 * @param name 令牌名，如 `--bkms-radius-field`
 * @returns 命中的小样标识；尺度档令牌（`--bkms-radius-md` 等）与未知语义返回 null
 */
export function radiusSampleOf(name: string): RadiusSample | null {
  const key = /^--bkms-radius-(.+)$/.exec(name)?.[1];
  if (!key) return null;
  return radiusSampleMap[key] ?? null;
}
