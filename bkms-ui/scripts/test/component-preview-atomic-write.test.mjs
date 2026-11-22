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
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { writeFileAtomic } from '../component-preview/internal/atomic-write.mjs';

let dir = '';

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = '';
});

function fixture() {
  dir = mkdtempSync(path.join(tmpdir(), 'bkms-atomic-'));
  return path.join(dir, 'catalog.js');
}

describe('产物原子写入', () => {
  it('写入的内容可读，重复写会覆盖旧值', () => {
    const file = fixture();
    writeFileAtomic(file, 'first');
    expect(readFileSync(file, 'utf8')).toBe('first');
    writeFileAtomic(file, 'second');
    expect(readFileSync(file, 'utf8')).toBe('second');
  });

  it('目标目录不存在时自动创建', () => {
    const file = path.join(dir || mkdtempSync(path.join(tmpdir(), 'bkms-atomic-')), 'nested', 'catalog.js');
    dir = path.dirname(path.dirname(file));
    writeFileAtomic(file, 'nested');
    expect(readFileSync(file, 'utf8')).toBe('nested');
  });

  it('写入失败时保留原产物，且不残留临时文件', () => {
    const file = fixture();
    writeFileSync(file, 'last-good');
    expect(() => writeFileAtomic(file, { invalid: true })).toThrow();
    expect(readFileSync(file, 'utf8')).toBe('last-good');
    expect(readdirSync(dir)).toEqual(['catalog.js']);
  });
});
