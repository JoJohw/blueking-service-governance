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
import { effectScope, nextTick, onScopeDispose, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import { useResizeObserver } from '@vueuse/core';

interface UseElementHeightOptions {
  /** 默认高度 */
  defaultHeight?: number;
  /** 是否立即获取初始高度，默认 true */
  immediate?: boolean;
  /** 监听的数据源，当值从 true 变为 false 时重新获取高度（常用于 loading 状态） */
  watchSource?: MaybeRefOrGetter<boolean>;
}

/**
 * 监听元素高度，并在容器尺寸变化时自动更新
 *
 * 支持在组件内和组件外使用：
 * - 组件内：随组件销毁自动清理
 * - 组件外：调用返回的 stop() 手动清理
 *
 * @param target 目标元素的 ref
 * @param options 配置项
 * @returns 元素高度的响应式引用及控制方法
 */
export function useElementHeight(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseElementHeightOptions = {},
) {
  const { watchSource, defaultHeight = 0, immediate = true } = options;

  const height = ref(defaultHeight);

  const scope = effectScope();

  function updateHeight() {
    const el = toValue(target);
    if (el) {
      height.value = el.offsetHeight;
    }
  }

  scope.run(() => {
    // 监听容器尺寸变化
    useResizeObserver(target, () => {
      updateHeight();
    });

    // 监听指定属性变化
    if (watchSource) {
      watch(
        () => toValue(watchSource),
        (newVal, oldVal) => {
          if (oldVal && !newVal) {
            nextTick(updateHeight);
          }
        },
      );
    }

    // 立即获取初始高度
    if (immediate) {
      nextTick(updateHeight);
    }
  });

  function stop() {
    scope.stop();
  }

  // 若在组件/外层 scope 内调用，随其销毁自动清理
  onScopeDispose(stop);

  return {
    height,
    updateHeight,
    stop,
  };
}
