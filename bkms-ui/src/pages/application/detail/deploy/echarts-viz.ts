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

import { invalidateVizCache, readVizVar } from '~/common/theme/viz-theme';

type ChartOptions = Record<string, unknown>;

const asRecord = (value: unknown): ChartOptions =>
  value !== null && typeof value === 'object' ? (value as ChartOptions) : {};

/** ExploreChart 不透传 theme/initOptions，结构色只能在 options(options) 回调里注入 */
export function applyEchartsViz(options: ChartOptions): ChartOptions {
  // eslint-disable-next-line theme/no-hardcoded-color
  const axisColor = readVizVar('--bkms-viz-axis-line', '#E4E9F2');
  // eslint-disable-next-line theme/no-hardcoded-color
  const splitColor = readVizVar('--bkms-viz-split-line', '#E9EDF5');
  // eslint-disable-next-line theme/no-hardcoded-color
  const tooltipSurface = readVizVar('--bkms-viz-tooltip-surface', '#FFFFFF');
  // eslint-disable-next-line theme/no-hardcoded-color
  const tooltipBorder = readVizVar('--bkms-viz-tooltip-border', '#C1CDE5');
  // eslint-disable-next-line theme/no-hardcoded-color
  const legendText = readVizVar('--bkms-viz-legend-text', '#8F9FBD');
  // eslint-disable-next-line theme/no-hardcoded-color
  const titleText = readVizVar('--bkms-viz-text-title', '#111214');

  if (options.xAxis !== undefined) options.xAxis = applyAxis(options.xAxis, axisColor, splitColor);
  if (options.yAxis !== undefined) options.yAxis = applyAxis(options.yAxis, axisColor, splitColor);

  const legend = asRecord(options.legend);
  const tooltip = asRecord(options.tooltip);
  options.textStyle = { ...asRecord(options.textStyle), color: legendText };
  options.legend = { ...legend, textStyle: { ...asRecord(legend.textStyle), color: legendText } };
  options.tooltip = {
    ...tooltip,
    backgroundColor: tooltipSurface,
    borderColor: tooltipBorder,
    textStyle: { ...asRecord(tooltip.textStyle), color: titleText },
  };
  options.grid = { ...asRecord(options.grid), borderColor: splitColor };
  return options;
}

export function refreshEchartsViz(): void {
  invalidateVizCache();
}

function applyAxis(axis: unknown, axisColor: string, splitColor: string): ChartOptions | ChartOptions[] {
  const list = Array.isArray(axis) ? axis : [axis];
  const mapped = list.map(item => {
    const target = asRecord(item);
    return {
      ...target,
      axisLine: withLineStyle(target.axisLine, axisColor),
      splitLine: withLineStyle(target.splitLine, splitColor),
    };
  });
  return Array.isArray(axis) ? mapped : mapped[0];
}

function withLineStyle(source: unknown, color: string): ChartOptions {
  const target = asRecord(source);
  return { ...target, lineStyle: { ...asRecord(target.lineStyle), color } };
}
