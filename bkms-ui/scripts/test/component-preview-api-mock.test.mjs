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
 * 接口 mock 的样例契约：从 api 模块的 `v1Fetch.get<Req, ResponseData>('/url')` 里
 * 读出 url 模板与返回类型，按类型推导样例，让预览里的列表不再全是「暂无数据」。
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { collectApiMocks } from '../component-preview/internal/api-mock.mjs';

/** 临时工程：带 tsconfig paths + 一个 api 模块，验证「url 模板 + 返回类型」的提取与样例推导 */
function withDemoProject(run) {
  const root = mkdtempSync(join(tmpdir(), 'bkms-api-'));
  try {
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { paths: { '~/*': ['src/*'] } } }, null, 2),
    );
    const typesDir = join(root, 'src/@types');
    const apiDir = join(root, 'src/api/modules');
    mkdirSync(typesDir, { recursive: true });
    mkdirSync(apiDir, { recursive: true });
    writeFileSync(
      join(typesDir, 'demo.d.ts'),
      ['export interface DemoItem {', '  id: string;', "  status: 'ready' | 'failed';", '}', ''].join('\n'),
    );
    writeFileSync(
      join(apiDir, 'demo.ts'),
      [
        "import type { DemoItem } from '~/@types/demo';",
        '',
        'export const demoApi = {',
        '  listDemos: async <Request extends object = object, ResponseData = DemoItem[]>(params?: Request) =>',
        "    await v1Fetch.get<Request, ResponseData>('/demos')(params),",
        '  getDemo: async <Request extends object = object, ResponseData = DemoItem>(params?: Request) =>',
        "    await v1Fetch.get<Request, ResponseData>('/demos/{id}')(params),",
        '  getCached: async <Request extends object = object, ResponseData = DemoItem[]>(params?: Request) =>',
        "    await cache.get<Request, ResponseData>('/cached-demos')(params),",
        '};',
        '',
      ].join('\n'),
    );
    return run(apiDir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('接口 mock 样例', () => {
  it('数组返回的接口按类型生成样例，键是 METHOD + url 模板', () => {
    withDemoProject(apiDir => {
      expect(collectApiMocks(apiDir, [])).toEqual([
        {
          key: 'GET /demos',
          sample: [{ id: '占位文本', status: 'ready' }],
          source: 'demo.ts',
        },
      ]);
    });
  });

  it('对象返回的接口不进样例表，避免把详情接口当列表喂给组件', () => {
    withDemoProject(apiDir => {
      const entries = collectApiMocks(apiDir, []);
      expect(entries.some(entry => entry.key.includes('/demos/{id}'))).toBe(false);
      expect(entries.some(entry => entry.key === 'GET /cached-demos')).toBe(false);
    });
  });

  it('传入插件时可在扫描结果上追加样例', () => {
    withDemoProject(apiDir => {
      const entries = collectApiMocks(apiDir, [
        {
          transformSamples(map) {
            map.set('GET /injected', {
              key: 'GET /injected',
              sample: [{ id: 'from-plugin' }],
              source: 'plugin.mjs',
            });
          },
        },
      ]);
      expect(entries.map(entry => entry.key)).toContain('GET /injected');
    });
  });
});
