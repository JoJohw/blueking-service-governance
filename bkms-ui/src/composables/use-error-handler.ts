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
import { Message } from 'bkui-vue';
import { appendTraceId, appendTraceIdToDetails } from '~/api/trace-id';

interface BackendError {
  [key: string]: unknown;
  code?: number | string;
  datas?: Record<string, unknown>;
  details?: Array<Record<string, unknown>> | Record<string, unknown> | string;
  message?: string;
  status?: number; // HTTP 状态码
  traceId?: string;
}

interface MessageAction {
  disabled?: boolean;
  id: string;
  render?: () => unknown;
}

interface MessageConfig {
  actions?: MessageAction[];
  delay?: number;
  extCls?: string;
  theme?: 'error' | 'primary' | 'success' | 'warning';
  message?:
    | string
    | {
        code?: number | string;
        details?: string;
        overview?: string;
        suggestion?: string;
        type?: string;
      };
}

/**
 * 自定义错误处理 Hook
 * @param error 错误对象
 * @param customCode 自定义错误代码
 * @param customMessage 错误消息配置
 */
export function useErrorHandler() {
  const handleError = (error: BackendError, customCode?: number, customMessageConfig?: MessageConfig) => {
    const httpStatus = error?.status || error?.code;
    const traceId = error?.traceId;
    // 自定义code处理
    if (customCode && customMessageConfig && httpStatus === customCode) {
      // 保留自定义 Message 的 actions、样式和详情，仅增强用户可见的错误概览。
      Message({
        ...customMessageConfig,
        message: buildTraceMessage(customMessageConfig.message, traceId),
      });
    } else {
      const message = (error?.msg || error?.datas?.msg || error?.message || error?.datas?.message || '') as string;
      Message({
        theme: 'error',
        message: {
          code: httpStatus,
          details: traceId
            ? appendTraceIdToDetails(error.details || message || {}, traceId)
            : error.details || message || '',
          overview: appendTraceId(message, traceId),
          suggestion: '',
          type: 'json',
        },
      });
    }
  };

  return { handleError };
}

/**
 * 构建包含 Trace ID 的自定义错误消息。
 * 无 Trace ID 时原样返回；字符串消息会转换为结构化消息，确保 Trace ID 同时展示在概览和详情中。
 * 已经是结构化的消息会保留原配置，仅增强 overview 和 details。
 */
function buildTraceMessage(message: MessageConfig['message'], traceId?: string): MessageConfig['message'] {
  if (!traceId) {
    return message;
  }

  if (typeof message === 'string') {
    return {
      overview: appendTraceId(message, traceId),
      details: appendTraceIdToDetails({}, traceId),
      type: 'json',
    };
  }

  return {
    ...message,
    overview: appendTraceId(message?.overview || '', traceId),
    details: appendTraceIdToDetails(message?.details || {}, traceId),
  };
}
