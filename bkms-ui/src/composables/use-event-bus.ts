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
import { getCurrentInstance, onUnmounted } from 'vue';

type EventCallback<T = any> = (data: T) => void;

// 全局事件监听器存储
const listeners = new Map<string, EventCallback[]>();

export function useEventBus() {
  // 记录当前组件注册的监听器,用于自动清理
  const componentListeners: Array<{ callback: EventCallback; event: string }> = [];
  const instance = getCurrentInstance();

  /**
   * 注册事件监听
   */
  const on = <T = any>(event: string, callback: EventCallback<T>) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)?.push(callback);

    // 如果在组件内调用,记录下来以便自动清理
    if (instance) {
      componentListeners.push({ event, callback });
    }
  };

  /**
   * 触发事件
   */
  const emit = <T = any>(event: string, data?: T) => {
    listeners.get(event)?.forEach(callback => callback(data));
  };

  /**
   * 移除特定事件的特定回调
   */
  const off = <T = any>(event: string, callback?: EventCallback<T>) => {
    if (!callback) {
      // 如果没有指定回调,移除该事件的所有监听器
      listeners.delete(event);
      return;
    }

    const callbacks = listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      // 如果该事件没有监听器了,删除该事件
      if (callbacks.length === 0) {
        listeners.delete(event);
      }
    }
  };

  /**
   * 清空所有事件监听器
   */
  const clear = () => {
    listeners.clear();
  };

  // 组件卸载时,自动清理该组件注册的监听器
  if (instance) {
    onUnmounted(() => {
      componentListeners.forEach(({ event, callback }) => {
        off(event, callback);
      });
      componentListeners.length = 0;
    });
  }

  return { on, emit, off, clear };
}
