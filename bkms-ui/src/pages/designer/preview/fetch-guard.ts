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
 * 预览 iframe 的 window.fetch 兜底。
 * ConsoleFetch.prototype.request 已覆盖业务请求，但 interceptors.ts 在模块加载时把
 * window.fetch 存进了 OriginFetch，第三方库若直接调 window.fetch 就绕过了打桩。
 *
 * 收窄口径：只拦「同源 + 路径命中业务 API 前缀」的请求，而不是按 origin 一刀切——
 * 否则同源的 worker / wasm / JSON / 字体等静态资源（`/assets/*`、`/favicon.svg` 等）
 * 会被替换成业务空响应，导致解析失败。跨源请求（字体/CDN/监控上报）始终原样放行。
 */

type FetchInput = Parameters<typeof window.fetch>[0];

/**
 * 业务 API 的路径前缀：与 vite.config.mts 的 server.proxy 代理路径、api/modules 里各 Fetch 实例
 * 的 prefix + url 首段对齐。BK_API_PREFIX 可能被部署注入为根路径 `/` 或绝对 URL，必须先归一化，
 * 否则 pathname.startsWith('/') 会退回旧的「同源一刀切」、误伤 /assets/*。
 */
const API_PATH_PREFIXES = normalizeApiPrefixes([
  import.meta.env.BK_API_PREFIX,
  '/bkms/',
  '/simple_account/',
  '/bcsapi/',
  '/ms/',
  '/generic/',
  '/api-bk-user-selector/',
]);

export function installFetchGuard(): () => void {
  const nativeFetch = window.fetch;
  const guard = (input: FetchInput, init?: RequestInit): Promise<Response> => {
    if (!isBusinessApi(input)) return nativeFetch(input, init);
    // 尊重调用方传入的 AbortSignal：已中止时直接抛 AbortError，而不是照样返回空响应
    if (init?.signal?.aborted) {
      return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ code: 0, data: [], result: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
  window.fetch = guard as typeof window.fetch;
  return () => {
    if (window.fetch === guard) window.fetch = nativeFetch;
  };
}

/** 把前缀归一化成 pathname 形式：绝对 URL 取 pathname，去掉根路径 `/` 与空值，并统一以 `/` 结尾。导出供单测覆盖边界 */
export function normalizeApiPrefixes(prefixes: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of prefixes) {
    const pathname = toPathname(raw);
    if (pathname === '/' || pathname.length === 0) continue;
    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

/** 只拦同源且路径命中 API 前缀的请求；静态资源与跨源请求一律放行 */
function isBusinessApi(input: FetchInput): boolean {
  const url = urlOf(input);
  if (!url) return false;
  return url.origin === window.location.origin && API_PATH_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
}

/** 绝对 URL（如 https://host/bkms）取 pathname；相对路径补前导 `/`，保证 startsWith 只按 pathname 比较 */
function toPathname(value: string): string {
  if (typeof value !== 'string' || value.length === 0) return '';
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).pathname;
    } catch {
      return '';
    }
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function urlOf(input: FetchInput): null | URL {
  try {
    const raw = typeof input === 'string' || input instanceof URL ? input : input.url;
    return new URL(String(raw), window.location.href);
  } catch {
    return null;
  }
}
