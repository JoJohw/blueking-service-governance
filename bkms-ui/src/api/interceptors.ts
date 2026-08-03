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
import { merge, uniqueId } from 'lodash-es';
import { addQueue, removeQueue } from '~/api/request-queue';

export type Config = {
  id?: string; // 唯一ID
  interceptorErr?: boolean; // 是否自动拦截http异常弹出message
  irrevocable?: boolean; // 请求不能取消
  isBodyParam?: boolean; // 是否将请求参数放在body中
  needRes?: boolean;
  needStatus?: boolean; // 是否需要返回 status 等响应信息
  originalResponse?: boolean; // 返回原始res对象
  prefix?: string;
  responseType?: 'blob' | 'json' | 'text';
  validateCode?: boolean; // 校验code是否正确，默认true
} & RequestInit;

export type FetchReturnType<T, P extends Config> = P['originalResponse'] extends true ? Response : T;

export type ResCallback = (res: Response, config: Partial<Config>) => unknown;

/** 请求拦截器 */
type ReqInterceptor = (config: Partial<Config>) => Partial<Config>;
/** 响应错误拦截器 */
type ResErrorInterceptor = (error: unknown, config: Partial<Config>) => unknown;

const interceptorsReq: ReqInterceptor[] = [];
const interceptorsRes: Array<ResCallback> = [];
const interceptorsResError: ResErrorInterceptor[] = [];

const OriginFetch = window.fetch;

// fetch
function fetch<T, C extends Config>(input: RequestInfo | URL, init: Partial<C>) {
  interceptorsReq.forEach(fn => {
    init = fn(init) as Partial<C>;
  });

  return new Promise<FetchReturnType<T, C>>((resolve, reject) => {
    const controller = new AbortController();
    const requestID = uniqueId();
    const defaultHeaders = {
      'Access-Control-Allow-Origin': '*',
      'X-Bkapi-Request-Id': requestID,
    };

    const request = OriginFetch(
      input,
      merge(
        {
          headers: defaultHeaders,
          signal: controller.signal,
        },
        init,
      ),
    )
      .then(res => {
        interceptorsRes.forEach(fn => {
          res = fn(res, init) as Response;
        });
        resolve(res as FetchReturnType<T, C>);
        removeQueue(requestID);
      })
      .catch(err => {
        interceptorsResError.forEach(fn => {
          err = fn(err, init);
        });
        reject(err);
        removeQueue(requestID);
      });

    // const route = useRoute();
    addQueue({
      id: init?.id || requestID,
      controller,
      request,
      config: init,
      // routeName: route?.name,
    });
  });
}

const interceptors = {
  request: {
    use(callback: ReqInterceptor) {
      interceptorsReq.push(callback);
    },
  },
  response: {
    use(callback: ResCallback, errorCallback?: ResErrorInterceptor) {
      interceptorsRes.push(callback);
      errorCallback && interceptorsResError.push(errorCallback);
    },
  },
};

export { fetch, interceptors };
