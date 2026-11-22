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

import apiMockSamples from '../generated/api-mock.json';
import { installFetchGuard } from './fetch-guard';

type RequestMethod = ConsoleFetch['request'];

/**
 * 样例表由 scripts/component-preview 生成，key 是 `METHOD url 模板`，与 src/api/modules 里的写法一致。
 * 值是接口返回类型推导出的占位数据：结构真实、值仍是「占位文本」，只为了让列表类组件有内容可渲染。
 *
 * 覆盖范围很有限，别指望它改善整体预览观感：实测只有极少数组件（如 git-selector、
 * modules/components-sideSlider）会真的发请求并命中样例，其余大多由 props 传入，
 * 请求根本没发生。样例只在「组件没有外部 props 入口、自己拉数据」时才有意义；
 * props 驱动的组件要改善，该修的是占位值语义（如枚举字段填真实枚举值），而不是补样例。
 */
const samples = apiMockSamples as Record<string, unknown>;

const originalRequest: RequestMethod = ConsoleFetch.prototype.request;
let isolateCount = 0;
let restoreFetchGuard: (() => void) | null = null;

/**
 * 预览环境把所有 API 请求改为返回本地样例：组件照常挂载、照常走自己的数据加载流程，
 * 但请求不会真正发出，避免缺上下文导致的 4xx/5xx 与全局错误提示。
 * 命中样例表就返回样例（克隆一份，防止组件改动污染下一次预览），未命中仍返回空数组兜底。
 * 引用计数保证嵌套调用时不会把已打桩函数当成 original，卸载顺序错乱也能还原。
 * ConsoleFetch 之外再补一层 window.fetch 兜底：第三方库直接调原生 fetch 时不漏网。
 */
export function isolateRequests(): () => void {
  if (isolateCount === 0) {
    ConsoleFetch.prototype.request = (async (method: string, url: string) => {
      const sample = samples[`${method} ${url}`];
      return sample === undefined ? [] : structuredClone(sample);
    }) as unknown as RequestMethod;
    restoreFetchGuard = installFetchGuard();
  }
  isolateCount += 1;
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    isolateCount -= 1;
    if (isolateCount === 0) {
      ConsoleFetch.prototype.request = originalRequest;
      restoreFetchGuard?.();
      restoreFetchGuard = null;
    }
  };
}
