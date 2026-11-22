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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFetchGuard, normalizeApiPrefixes } from '~/pages/designer/preview/fetch-guard';

const originalFetch = window.fetch;

afterEach(() => {
  window.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** 兜底只拦「同源 + API 前缀」请求：ConsoleFetch 已打桩，这里是给「直接调 window.fetch 的第三方库」补的网 */
describe('预览页 window.fetch 兜底', () => {
  it('同源业务 API 被拦截，返回空的业务响应', async () => {
    const nativeFetch = vi.fn();
    window.fetch = nativeFetch as unknown as typeof window.fetch;
    const restore = installFetchGuard();
    const response = await window.fetch('/bkms/v1/foo');
    expect(nativeFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ code: 0, data: [], result: true });
    restore();
  });

  it('跨源资源放行，不破坏字体/CDN 加载', async () => {
    const nativeFetch = vi.fn(async () => new Response('ok'));
    window.fetch = nativeFetch as unknown as typeof window.fetch;
    const restore = installFetchGuard();
    await window.fetch('https://example.com/font.woff2');
    expect(nativeFetch).toHaveBeenCalledOnce();
    restore();
  });

  it('同源静态资源（worker/wasm/JSON/字体）放行，不被替换成业务空响应', async () => {
    const nativeFetch = vi.fn(async () => new Response('{"ok":true}'));
    window.fetch = nativeFetch as unknown as typeof window.fetch;
    const restore = installFetchGuard();
    await window.fetch('/assets/config.json');
    await window.fetch('/assets/editor.worker.js');
    await window.fetch('/favicon.svg');
    expect(nativeFetch).toHaveBeenCalledTimes(3);
    restore();
  });

  it('已中止的 signal 直接拒绝，而不是返回空响应', async () => {
    const nativeFetch = vi.fn();
    window.fetch = nativeFetch as unknown as typeof window.fetch;
    const restore = installFetchGuard();
    const controller = new AbortController();
    controller.abort();
    await expect(window.fetch('/bkms/v1/foo', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(nativeFetch).not.toHaveBeenCalled();
    restore();
  });

  it('卸载后恢复原生 fetch', () => {
    const nativeFetch = vi.fn();
    window.fetch = nativeFetch as unknown as typeof window.fetch;
    const restore = installFetchGuard();
    restore();
    expect(window.fetch).toBe(nativeFetch);
  });
});

/** BK_API_PREFIX 可能被部署注入为 `/` 或绝对 URL，归一化必须把这些边界收干净，否则退回「同源一刀切」 */
describe('API 前缀归一化', () => {
  it('根路径 / 与空串被过滤，避免 BK_API_PREFIX 为根路径时退回同源一刀切', () => {
    expect(normalizeApiPrefixes(['/', ''])).toEqual([]);
  });

  it('绝对 URL 取 pathname，而不是整个 URL 参与 startsWith', () => {
    expect(normalizeApiPrefixes(['https://host/bkms'])).toEqual(['/bkms/']);
  });

  it('无尾斜杠补 /，重复前缀去重', () => {
    expect(normalizeApiPrefixes(['/bkms', '/bkms/', '/ms'])).toEqual(['/bkms/', '/ms/']);
  });

  it('归一化结果不含根路径前缀，且统一为 / 开头、/ 结尾的非空 pathname', () => {
    const prefixes = normalizeApiPrefixes(['/', '/bkms', 'https://host', '/generic/']);
    expect(prefixes).not.toContain('/');
    expect(prefixes.every(prefix => prefix.length > 1 && prefix.startsWith('/') && prefix.endsWith('/'))).toBe(true);
  });
});
