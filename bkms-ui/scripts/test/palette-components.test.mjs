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

/** palette 组件搜索契约：展示名与完整 id 双字段匹配、忽略大小写、空查询不返回全部 */
import { describe, expect, it } from 'vitest';

import { displayDirectoryOf, matchComponents, sortByUsage } from '../../dev/palette/src/config/components.ts';

const items = [
  { directory: '', id: 'bkms-content', label: 'content', usage: 17 },
  { directory: '', id: 'bkms-table', label: 'table', usage: 4 },
  { directory: 'bkms/legacy', id: 'bkms/legacy/card-radio', label: 'card-radio', usage: 9 },
  { directory: '', id: 'user-selector', label: 'user-selector', usage: 0 },
];

describe('palette 组件目录提取', () => {
  it('多级 id 取最后一段之前的目录', () => {
    expect(displayDirectoryOf('editable-variable-table/index')).toBe('editable-variable-table');
    expect(displayDirectoryOf('a/b/c')).toBe('a/b');
  });

  it('目录末段与组件名相同时剔除，避免菜单出现两行相同文字', () => {
    expect(displayDirectoryOf('skeleton/skeleton')).toBe('');
    expect(displayDirectoryOf('a/b/b')).toBe('a');
  });

  it('无目录的 id 返回空串', () => {
    expect(displayDirectoryOf('bkms-content')).toBe('');
  });
});

describe('palette 组件搜索', () => {
  it('空查询与纯空白不返回结果', () => {
    expect(matchComponents(items, '')).toEqual([]);
    expect(matchComponents(items, '   ')).toEqual([]);
  });

  it('按展示名匹配且忽略大小写', () => {
    expect(matchComponents(items, 'CONTENT').map(item => item.id)).toEqual(['bkms-content']);
    expect(matchComponents(items, 'Card').map(item => item.id)).toEqual(['bkms/legacy/card-radio']);
  });

  it('按完整 id 匹配，能命中多级路径片段', () => {
    expect(matchComponents(items, 'legacy').map(item => item.id)).toEqual(['bkms/legacy/card-radio']);
    expect(matchComponents(items, 'bkms').map(item => item.id)).toEqual([
      'bkms-content',
      'bkms-table',
      'bkms/legacy/card-radio',
    ]);
  });

  it('首尾空白不影响匹配', () => {
    expect(matchComponents(items, '  table  ').map(item => item.id)).toEqual(['bkms-table']);
  });

  it('无命中时返回空数组', () => {
    expect(matchComponents(items, 'zzzz')).toEqual([]);
  });

  it('结果可继续按使用次数排序，且默认模式不改动入参', () => {
    const hits = matchComponents(items, 'bkms');
    expect(sortByUsage(hits, 'desc').map(item => item.usage)).toEqual([17, 9, 4]);
    expect(sortByUsage(hits, 'asc').map(item => item.usage)).toEqual([4, 9, 17]);
    expect(sortByUsage(hits, 'default')).toBe(hits);
    expect(hits.map(item => item.id)).toEqual(['bkms-content', 'bkms-table', 'bkms/legacy/card-radio']);
  });
});
