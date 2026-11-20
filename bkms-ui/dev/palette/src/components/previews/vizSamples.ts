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
 * 可视化语义 → 仿制小样标识。
 *
 * 与 VizPreview.vue 解耦：新增 viz 前缀时只改 prefixRules，再到模板里补一个分支。
 * 映射表里没有的 token（未来新增族）由 VizPreview 回落到纯色块。
 */

/** 小样标识；与 VizPreview.vue 里的模板分支一一对应 */
export type VizSample = 'chart' | 'line' | 'series' | 'state' | 'status' | 'surface' | 'text';

const prefixRules: [RegExp, VizSample][] = [
  [/^--bkms-viz-line/, 'line'],
  [/^--bkms-viz-(?:bg-|surface-|mask)/, 'surface'],
  [/^--bkms-viz-status-/, 'status'],
  [/^--bkms-viz-text-/, 'text'],
  [/^--bkms-viz-(?:axis-|split-|tooltip-|legend-)/, 'chart'],
  [/^--bkms-viz-selection/, 'state'],
  [/^--bkms-viz-series-/, 'series'],
];

/** 8 色分类色带，顺序与 viz.css 的 series 档一致 */
export const VIZ_SERIES_NAMES = Array.from({ length: 8 }, (_, index) => `--bkms-viz-series-${index + 1}`);

/** 分类色在 viz.css 里标了 @viz-locked：任何主题下都不漂移 */
export function isVizLocked(name: string): boolean {
  return /^--bkms-viz-series-\d+$/.test(name);
}

/**
 * 取可视化令牌的语义小样标识。
 * @param name 令牌名，如 `--bkms-viz-status-healthy`
 */
export function vizSampleOf(name: string): null | VizSample {
  return prefixRules.find(([re]) => re.test(name))?.[1] ?? null;
}
