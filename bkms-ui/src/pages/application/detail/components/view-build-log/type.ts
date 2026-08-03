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
export type BuildAlertTheme = 'error' | 'info' | 'success' | 'warning';
/** 构建提示和流水线跳转所需的构建信息。 */
export interface BuildInfo {
  /** 蓝盾构建 ID */
  buildID: string;
  /** 镜像 Tag */
  imageTag: string;
  /** 构建操作人 */
  operator: string;
  /** 蓝盾流水线 ID */
  pipelineID: string;
  /** 代码分支 */
  revision: string;
  /** 构建状态 */
  status: BuildStatus;
}

/** SSE error 事件数据，兼容后端旧版字符串错误格式。 */
export interface BuildLogError {
  error?:
    | string
    | {
        details?: BuildLogErrorDetail[];
        message?: string;
      };
}

/** SSE error 事件中的业务错误详情。 */
export interface BuildLogErrorDetail {
  code?: string;
  message?: string;
}

/** 蓝盾返回的单行构建日志。 */
export interface BuildLogLine {
  /** 实际接口返回 PascalCase，camelCase 用于兼容接口文档。 */
  LineNo?: number;
  lineNo?: number;
  Message?: string;
  message?: string;
  Timestamp?: number;
  timestamp?: number;
}

/** SSE message 事件数据。 */
export interface BuildLogMessage {
  /** 实际接口返回 PascalCase，camelCase 用于兼容接口文档。 */
  Finished?: boolean;
  finished?: boolean;
  HasMore?: boolean;
  hasMore?: boolean;
  Logs?: BuildLogLine[];
  logs?: BuildLogLine[];
}

/** 无侧滑外壳的构建日志面板参数。 */
export interface BuildLogPanelProps extends BuildTipsProps {
  active: boolean;
}

/** 构建日志查询和下载接口的公共参数。 */
export interface BuildLogRequest {
  appID: string;
  buildID: string;
}

export type BuildStatus = 'failed' | 'pollingBroken' | 'running' | 'success' | 'warning';

/** 构建状态提示组件参数。 */
export interface BuildTipsProps {
  buildInfo: BuildInfo;
  needClose?: boolean;
}

/** 构建日志侧滑组件参数。 */
export interface ViewBuildLogProps {
  buildInfo: BuildInfo;
}
