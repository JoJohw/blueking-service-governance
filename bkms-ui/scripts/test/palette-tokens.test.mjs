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

/** palette 的 token 解析契约：分组标记、viz 独立 kind、@viz-locked 不吞掉「用在」说明 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { radiusSampleOf } from '../../dev/palette/src/components/previews/radiusSamples.ts';
import { parse } from '../../dev/palette/src/util/tokens.ts';

const tokensDir = new URL('../../src/styles/theme/tokens/', import.meta.url);
const vizGroups = parse(readFileSync(new URL('viz.css', tokensDir), 'utf8'), 'viz', 'viz').groups;
const radiusGroups = parse(readFileSync(new URL('radius.css', tokensDir), 'utf8'), 'rad').groups;

describe('palette viz 解析', () => {
  it('viz.css 按语义分七组，token 全是 viz kind', () => {
    expect(vizGroups.map(group => group.label)).toEqual([
      '连线',
      '底色',
      '节点状态',
      '文字',
      '图表结构',
      '选中高亮',
      '曲线配色',
    ]);
    expect(vizGroups.every(group => group.tokens.every(token => token.kind === 'viz'))).toBe(true);
  });

  it('viz 组 id 与颜色 / 圆角视图不撞', () => {
    expect(vizGroups.every(group => group.id.startsWith('viz-'))).toBe(true);
    expect(radiusGroups.every(group => group.id.startsWith('rad-'))).toBe(true);
  });

  it('@viz-locked 标记不污染变量上方的「用在」说明', () => {
    const series = vizGroups.find(group => group.label === '曲线配色');
    expect(series.tokens).toHaveLength(8);
    expect(series.tokens[0].note).toBe('对比曲线配色 1（红）');
    expect(series.tokens.every(token => /^#[\da-f]{6,8}$/i.test(token.value))).toBe(true);
  });

  it('分组描述来自 @note，实色值不走 var() 链解析', () => {
    const line = vizGroups.find(group => group.label === '连线');
    expect(line.note).toContain('拓扑图');
    expect(line.tokens.every(token => token.ref === '')).toBe(true);
  });
});

describe('palette 圆角语义', () => {
  it('档位层六个尺度档 + 两个形状档，值即字面量', () => {
    const scale = radiusGroups.find(group => group.layer === 'scale');
    expect(scale.tokens.map(token => token.name)).toEqual([
      '--bkms-radius-hairline',
      '--bkms-radius-xs',
      '--bkms-radius-sm',
      '--bkms-radius-md',
      '--bkms-radius-lg',
      '--bkms-radius-xl',
      '--bkms-radius-none',
      '--bkms-radius-full',
    ]);
    expect(scale.tokens.find(token => token.name === '--bkms-radius-md')?.value).toBe('6px');
    expect(scale.tokens.every(token => token.ref === '')).toBe(true);
  });

  it('base 是通用基准，menu 与主体控件同指 md 档，tag 指 sm 档', () => {
    const semantic = radiusGroups.find(group => group.layer === 'semantic');
    expect(semantic.tokens.find(token => token.name === '--bkms-radius-base')?.ref).toBe('--bkms-radius-md');
    expect(semantic.tokens.find(token => token.name === '--bkms-radius-menu')?.ref).toBe('--bkms-radius-md');
    expect(semantic.tokens.find(token => token.name === '--bkms-radius-tag')?.ref).toBe('--bkms-radius-sm');
  });

  it('形状档有自己的仿制小样，尺度档回落到三尺寸方框', () => {
    expect(radiusSampleOf('--bkms-radius-none')).toBe('none');
    expect(radiusSampleOf('--bkms-radius-full')).toBe('full');
    expect(radiusSampleOf('--bkms-radius-md')).toBeNull();
  });
});
