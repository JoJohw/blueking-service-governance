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
export const STORAGE_VERSION = '0.0.1';
export const STORAGE_KEY = '_pinia_storage';
export const BKMS_REGEX = {
  // 名称类型正则校验
  nameRegex: /^[a-z]+[-a-z0-9]*[a-z0-9]$/,
  IDRegex: /^[a-z][a-z0-9-]$/,
  appNameRegex: /^[a-z][a-z0-9-]{1,20}$/,
  envNameRegex: /^[a-z][a-z0-9-]{0,19}$/,
  envDisplayNameRegex: /^.{1,32}$/,
  fileNameRegex: /^[a-zA-Z0-9_-]{1,20}$/,
  spaceNameRegex: /^[a-z][a-z0-9-]{1,27}$/,
  spaceDisplayNameRegex: /^.{1,32}$/,
  instanceNameRegex: /^[a-z][a-z0-9-]{0,18}[a-z0-9]$/,
  serviceNameRegex: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
  laneNameRegex: /^[a-zA-Z0-9]([-_.a-zA-Z0-9]{0,61}[a-zA-Z0-9])?$/,
  componentNameRegex: /^[a-zA-Z][a-zA-Z0-9-]{0,18}[a-zA-Z0-9]$/,
  instanceKeyRegex: /^[a-zA-Z][a-zA-Z0-9_]{0,19}$/,
  instanceKeyNoLimitRegex: /^[a-zA-Z][a-zA-Z0-9_]*$/,
  envVarKeyRegex: /^[A-Za-z_][A-Za-z0-9_]*$/,
  polarisServiceNameRegex: /^[a-zA-Z0-9._-]{1,128}$/,
  kubernetesMetadataNameRegex: /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/,
  kubernetesMetadataPrefixRegex: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
  kubernetesLabelValueRegex: /^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$/,
  // 正整数正则
  positiveIntegerRegex: /^[1-9]\d*$/,
  // 0%-100%或非负整数正则（允许0）
  percentOrNonNegativeIntegerRegex: /^(0|[1-9]\d*|([0-9]|[1-9]\d?|100)%)$/,
};

// 文档地址常量
export const DOC_LINKS = {
  // 接入指引
  ACCESS_GUIDE: '/p/4017296948',
  // bkms-cli 使用文档
  BKMS_CLI: '/p/4017324213',
  // tRPC 开发模式文档
  TRPC_DEV_MODE: '/p/4017348583',
  // 流水线构建操作指引
  PIPELINE_BUILD_GUIDE: '/p/4017315972',
  // APM 观测配置指引 - tRPC Go
  APM_GUIDE_TRPC_GO: '/p/4013675212',
  // APM 观测配置指引 - tRPC C++
  APM_GUIDE_TRPC_CPP: '/p/4015427850',
  // APM 观测配置指引 - TAF
  APM_GUIDE_TAF: '/p/4013675229',
  // 扩缩容稳定性
  SCALE_STABILITY: '/p/1015455438#%E6%89%A9%E7%BC%A9%E5%AE%B9%E7%A8%B3%E5%AE%9A%E6%80%A7',
};
