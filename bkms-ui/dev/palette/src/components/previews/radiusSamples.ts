/**
 * 圆角语义 → 仿制小样标识。
 *
 * 与 RadiusPreview.vue 解耦：新增语义令牌时只改本文件的 `radiusSampleMap`，
 * 再到 RadiusPreview.vue 的 `<template>` 里加一个 `v-else-if="sample === '<标识>'"` 分支即可。
 * 映射表里没有的语义（未知 / 未来新增）会由 RadiusPreview 回落到三尺寸方框。
 */

/** 语义小样的标识；标识与 RadiusPreview.vue 里的模板分支一一对应 */
export type RadiusSample = 'card' | 'checkbox' | 'control' | 'field' | 'menu' | 'overlay' | 'scroll' | 'tab' | 'tag';

/** token 名 → 小样标识。key 为去掉 `--bkms-` 前缀后的语义名 */
const radiusSampleMap: Record<string, RadiusSample> = {
  card: 'card',
  checkbox: 'checkbox',
  control: 'control',
  field: 'field',
  menu: 'menu',
  overlay: 'overlay',
  scroll: 'scroll',
  tab: 'tab',
  tag: 'tag',
};

/**
 * 取圆角令牌的语义小样标识。
 * @param name 令牌名，如 `--bkms-radius-field`
 * @returns 命中的小样标识；档位令牌（`--bkms-radius-3` 等）与未知语义返回 null
 */
export function radiusSampleOf(name: string): RadiusSample | null {
  const key = /^--bkms-radius-(.+)$/.exec(name)?.[1];
  if (!key) return null;
  return radiusSampleMap[key] ?? null;
}
