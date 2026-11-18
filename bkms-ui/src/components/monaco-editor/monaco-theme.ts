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

import * as monaco from 'monaco-editor';
import { hexWithAlpha, invalidateVizCache, readVizVar } from '~/common/theme/viz-theme';

const BKMS_DARK = 'bkms-dark';

let registered = false;

export function refreshBkmsMonacoTheme(): void {
  invalidateVizCache();
  registerBkmsMonacoTheme(true);
}

/** rules 留空：语法高亮 token 是 @locked，不随品牌主色漂移 */
export function registerBkmsMonacoTheme(force = false): void {
  if (registered && !force) return;
  monaco.editor.defineTheme(BKMS_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: themeColors(),
  });
  registered = true;
}

/** 只把默认深色映射到自定义主题，hc-black / hc-light / vs 仍走内置，对外 prop 契约不变 */
export function resolveMonacoTheme(theme: string): string {
  return theme === 'vs-dark' ? BKMS_DARK : theme;
}

function themeColors(): Record<string, string> {
  const brand = readVizVar('--bkms-viz-line-active', '#3B6EF5');
  const secondary = readVizVar('--bkms-viz-text-secondary', '#8F9FBD');
  return {
    'editorCursor.foreground': brand,
    'editor.selectionBackground': hexWithAlpha(brand, 0.3),
    'editor.lineHighlightBackground': hexWithAlpha(secondary, 0.12),
    'editorLineNumber.activeForeground': readVizVar('--bkms-viz-text-inverse', '#FFFFFF'),
    'editorWidget.background': readVizVar('--bkms-viz-surface-canvas', '#242A35'),
    'editorWidget.border': readVizVar('--bkms-viz-tooltip-border', '#C1CDE5'),
    'scrollbarSlider.background': hexWithAlpha(secondary, 0.3),
    'scrollbarSlider.hoverBackground': hexWithAlpha(secondary, 0.5),
  };
}
