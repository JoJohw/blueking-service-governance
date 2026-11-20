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
 * the License is distributed on an "AS IS" BASIS, either express or implied. See the
 * License for the specific language governing permissions and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

import ConsoleFetch from '~/api/fetch';

type RequestMethod = ConsoleFetch['request'];

const originalRequest: RequestMethod = ConsoleFetch.prototype.request;
let isolateCount = 0;

/**
 * 预览环境把所有 API 请求短接为空响应：组件照常挂载、照常走自己的数据加载流程，
 * 但请求不会真正发出，避免缺上下文导致的 4xx/5xx 与全局错误提示。
 * 引用计数保证嵌套调用时不会把已打桩函数当成 original，卸载顺序错乱也能还原。
 */
export function isolateRequests(): () => void {
  if (isolateCount === 0) {
    ConsoleFetch.prototype.request = (async () => [] as never) as RequestMethod;
  }
  isolateCount += 1;
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    isolateCount -= 1;
    if (isolateCount === 0) {
      ConsoleFetch.prototype.request = originalRequest;
    }
  };
}
