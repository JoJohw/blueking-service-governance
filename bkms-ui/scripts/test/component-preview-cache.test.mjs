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
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { signatureOf } from '../component-preview/internal/cache.mjs';

const FIXED_MTIME = new Date('2020-01-01T00:00:00Z');
let dir = '';

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = '';
});

function fixture() {
  dir = mkdtempSync(path.join(tmpdir(), 'bkms-cache-'));
  const file = path.join(dir, 'source.ts');
  writeFileSync(file, 'export const a = 1;');
  utimesSync(file, FIXED_MTIME, FIXED_MTIME);
  return file;
}

/** mtime 在 CI checkout / 可复现构建里不可靠，签名应只看内容 */
describe('生成缓存签名', () => {
  it('内容变了但 mtime 保持不变，签名必须变化', () => {
    const file = fixture();
    const before = signatureOf([file]);
    writeFileSync(file, 'export const a = 2;');
    utimesSync(file, FIXED_MTIME, FIXED_MTIME);
    expect(signatureOf([file])).not.toBe(before);
  });

  it('mtime 变了但内容没变，签名保持稳定', () => {
    const file = fixture();
    const before = signatureOf([file]);
    utimesSync(file, new Date('2024-01-01T00:00:00Z'), new Date('2024-01-01T00:00:00Z'));
    expect(signatureOf([file])).toBe(before);
  });
});
