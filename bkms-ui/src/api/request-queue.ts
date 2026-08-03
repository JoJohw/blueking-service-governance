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
import { type RouteRecordName } from 'vue-router';

import type { Config } from './interceptors';

export interface IQueue {
  config?: Config;
  controller: AbortController;
  id: string;
  request: Promise<unknown>;
  routeName?: RouteName;
}

export type RouteName = null | RouteRecordName | undefined;

// 请求队列
const requestQueue: Array<IQueue> = [];
// 添加队列
function addQueue(data: IQueue) {
  const index = requestQueue.findIndex(q => q.id === data?.id);
  if (index === -1) {
    requestQueue.push(data);
  }
}
// 取消队列请求
async function cancelRequest(id?: string | string[]) {
  let queues = requestQueue.filter(queue => !queue.config?.irrevocable); // 过滤配置了不可取消请求的配置
  if (id?.length) {
    const ids = Array.isArray(id) ? id : [id];
    queues = queues.filter(queue => ids.includes(queue.id));
  }
  queues.forEach(queue => queue.controller?.abort());
  await Promise.all(queues.map(item => item.request)).catch(() => {});
  clearQueue(id);
}
// 清空队列（不取消请求）
function clearQueue(id?: string | string[]) {
  if (id?.length) {
    const ids = Array.isArray(id) ? id : [id];
    ids.forEach(id => {
      const index = requestQueue.findIndex(queue => queue.id === id);
      index > -1 && requestQueue.splice(index, 1);
    });
  } else {
    requestQueue.length = 0;
  }
}
// 移除队列
function removeQueue(id: string) {
  const index = requestQueue.findIndex(q => q.id === id);
  if (index > -1) {
    requestQueue.splice(index, 1);
  }
}

export {
  addQueue,
  cancelRequest,
  clearQueue,
  removeQueue,
  requestQueue, // 内部数据结构，只读模式
};
