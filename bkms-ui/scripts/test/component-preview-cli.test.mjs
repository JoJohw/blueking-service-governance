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
 * CLI 参数解析的单测：覆盖「静默忽略危险参数组合」的回归——
 * 拼错 flag / --only 缺值 / --prune 不带 --baseline / --check 与 --baseline 互斥 等，
 * 这些以前都会落到日常生成，把 flag 静默吞掉。
 */
import { describe, expect, it } from 'vitest';

import { parseArgs } from '../component-preview/index.mjs';

describe('parseArgs CLI 参数解析', () => {
  it('无参数返回默认 flags', () => {
    expect(parseArgs([])).toEqual({
      check: false,
      baseline: false,
      prune: false,
      force: false,
      yes: false,
      only: null,
    });
  });

  it('--only 缺值报错', () => {
    expect(parseArgs(['--baseline', '--only']).error).toBe('--only 需要一个组件 id');
  });

  it('--only 值以 -- 开头报错（值缺失的另一种形态）', () => {
    expect(parseArgs(['--baseline', '--only', '--force']).error).toBe('--only 需要一个组件 id');
  });

  it('--prune 不带 --baseline 报错', () => {
    expect(parseArgs(['--prune']).error).toContain('必须配合 --baseline');
  });

  it('--only 不带 --baseline 报错', () => {
    expect(parseArgs(['--only', 'components/tab']).error).toContain('必须配合 --baseline');
  });

  it('--force / --yes 不带 --baseline 报错', () => {
    expect(parseArgs(['--force', '--yes']).error).toContain('必须配合 --baseline');
  });

  it('--check 与 --baseline 互斥', () => {
    expect(parseArgs(['--check', '--baseline']).error).toContain('互斥');
  });

  it('--prune 与 --only 互斥', () => {
    expect(parseArgs(['--baseline', '--prune', '--only', 'components/tab']).error).toContain('互斥');
  });

  it('--only 与 --force 互斥', () => {
    expect(parseArgs(['--baseline', '--only', 'components/tab', '--force', '--yes']).error).toContain('互斥');
  });

  it('--prune 与 --force 互斥', () => {
    expect(parseArgs(['--baseline', '--prune', '--force', '--yes']).error).toContain('互斥');
  });

  it('重复 --only 报错', () => {
    expect(parseArgs(['--baseline', '--only', 'a', '--only', 'b']).error).toBe('--only 只能出现一次');
  });

  it('--yes 不带 --force 报错', () => {
    expect(parseArgs(['--baseline', '--yes']).error).toBe('--yes 必须配合 --force 使用');
  });

  it('未知参数报错', () => {
    expect(parseArgs(['--checkk']).error).toBe('未知参数: --checkk');
  });

  it('正常 --baseline --only <id> 解析正确', () => {
    expect(parseArgs(['--baseline', '--only', 'components/tab'])).toEqual({
      check: false,
      baseline: true,
      prune: false,
      force: false,
      yes: false,
      only: 'components/tab',
    });
  });

  it('正常 --check 解析正确', () => {
    expect(parseArgs(['--check']).check).toBe(true);
  });

  it('正常 --baseline --force --yes 解析正确', () => {
    const args = parseArgs(['--baseline', '--force', '--yes']);
    expect(args.baseline).toBe(true);
    expect(args.force).toBe(true);
    expect(args.yes).toBe(true);
  });
});
