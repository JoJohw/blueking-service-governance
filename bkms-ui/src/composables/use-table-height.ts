import { onMounted, onUnmounted, ref } from 'vue';

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
import { debounce } from 'lodash-es';

export default function useDynamicsHeight(offsetHeight: number, influenceClassNames: string[] = []) {
  const maxHeight = ref<number>(0);
  const observersMap = new Map<Element, ResizeObserver>();

  // 根据影响高度的DOM元素计算最大高度
  const calcHeight = debounce(() => {
    const influenceDomsHeight = influenceClassNames?.reduce((total, className) => {
      const el = document.querySelector(className);
      return (el?.clientHeight ?? 0) + total;
    }, 0);
    maxHeight.value = window.innerHeight - offsetHeight - influenceDomsHeight;
  }, 100);

  // 初始化观察器
  const initObserversMap = () => {
    // 先清除所有现有观察器
    observersMap.forEach(observer => observer.disconnect());
    observersMap.clear();

    // 观察窗口大小变化
    createNewObserver(document.body);

    // 观察影响高度的DOM元素
    influenceClassNames?.forEach(className => {
      const elements = document.querySelectorAll(className);
      elements.forEach(el => createNewObserver(el));
    });
  };

  // 创建新的观察器
  const createNewObserver = (element: Element) => {
    const observer = new ResizeObserver(calcHeight);
    observer.observe(element);
    observersMap.set(element, observer);
  };

  // 刷新高度计算（供外部调用）
  const refresh = () => {
    calcHeight();
    initObserversMap();
  };

  onMounted(() => {
    refresh();
  });

  onUnmounted(() => {
    observersMap.forEach(observer => observer.disconnect());
    observersMap.clear();
  });

  return {
    maxHeight,
    refresh,
  };
}
