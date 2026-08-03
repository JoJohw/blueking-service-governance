/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

const TRACE_ID_HEADER = 'X-Trace-Id';

type TraceableData = Record<string, unknown> & {
  error?: Record<string, unknown>;
  traceId?: string;
};

/**
 * 将 Trace ID 追加到已有错误文案末尾，便于用户反馈问题时提供链路标识。
 * 响应未携带 Trace ID 时保持原文案不变。
 */
export function appendTraceId(message: string, traceId?: string) {
  if (!traceId) {
    return message;
  }

  return message ? `${message}（Trace ID: ${traceId}）` : `Trace ID: ${traceId}`;
}

/**
 * 将 Trace ID 合并到 JSON 格式的错误详情中，避免错误概览过长被截断后无法获取链路标识。
 * 对象详情直接增加 traceId；字符串、数组等详情保留在 details 字段中。
 */
export function appendTraceIdToDetails(details: unknown, traceId?: string) {
  if (!traceId) {
    return JSON.stringify(details || {}, null, 2);
  }

  const traceableDetails =
    details && typeof details === 'object' && !Array.isArray(details)
      ? {
          ...details,
          traceId,
        }
      : {
          details: details || '',
          traceId,
        };

  return JSON.stringify(traceableDetails, null, 2);
}

/**
 * 将 Trace ID 透传到请求失败对象及后端 error 字段中。
 * 同时写入两层是为了兼容调用方使用完整响应或仅使用 error 字段的不同处理方式。
 */
export function attachTraceId<T>(data: T, traceId?: string) {
  if (!traceId || !data || typeof data !== 'object') {
    return data;
  }

  const traceableData = data as TraceableData;
  traceableData.traceId = traceId;
  if (traceableData.error && typeof traceableData.error === 'object') {
    traceableData.error.traceId = traceId;
  }

  return data;
}

/**
 * 从响应头读取链路追踪标识。
 * Headers.get 不区分响应头名称大小写；跨域请求需由服务端通过 CORS 暴露该响应头。
 */
export function getTraceId(response: Response) {
  return response.headers.get(TRACE_ID_HEADER) || undefined;
}
