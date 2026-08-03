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
import { onBeforeUnmount } from 'vue';

/**
 * 提供打开新标签页的功能，如果标签页已存在则聚焦到已有标签页
 */
export function useTabManager() {
  // 存储已打开的窗口引用
  const openedWindows = new Map<string, Window>();

  /**
   * 打开新标签页或聚焦已存在的标签页
   * @param url - 要打开的 URL
   * @param key - 用于标识标签页的唯一键，如果不提供则使用 URL 作为键
   * @returns Promise<Window | null> - 返回打开的窗口对象，如果打开失败则返回 null
   */
  const openTab = async (url: string, key?: string): Promise<null | Window> => {
    const windowKey = key || url;
    const existingWindow = openedWindows.get(windowKey);

    // 检查是否已有打开的窗口且未关闭
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      return existingWindow;
    }

    // 打开新窗口
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      openedWindows.set(windowKey, newWindow);

      // 监听窗口关闭事件，清理引用
      const checkWindowClosed = () => {
        if (newWindow.closed) {
          openedWindows.delete(windowKey);
        } else {
          setTimeout(checkWindowClosed, 1000);
        }
      };
      checkWindowClosed();
    }

    return newWindow;
  };

  /**
   * 关闭指定的标签页
   * @param key - 标签页的唯一键
   */
  const closeTab = (key: string) => {
    const window = openedWindows.get(key);
    if (window && !window.closed) {
      window.close();
    }
    openedWindows.delete(key);
  };

  /**
   * 检查指定标签页是否已打开
   * @param key - 标签页的唯一键
   * @returns boolean - 是否已打开
   */
  const isTabOpen = (key: string): boolean => {
    const window = openedWindows.get(key);
    return window ? !window.closed : false;
  };

  /**
   * 清理所有已打开的标签页引用
   */
  const clearAllTabs = () => {
    openedWindows.clear();
  };

  // 组件卸载时清理所有窗口引用
  onBeforeUnmount(() => {
    clearAllTabs();
  });

  return {
    openTab,
    closeTab,
    isTabOpen,
    clearAllTabs,
  };
}
