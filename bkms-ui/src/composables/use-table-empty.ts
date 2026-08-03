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
import { computed, ref, watch } from 'vue';
import type { WatchSource } from 'vue';

import { debounce } from 'lodash-es';

interface FilterOptions {
  filters: WatchSource<unknown> | WatchSource<unknown>[];
  ignoreKeys?: string[];
}
type TableEmptyType = 'empty' | 'error' | 'search';
/**
 * 表格空状态管理 Hook
 *
 * 用于自动判断表格的空状态类型（空数据/搜索无结果/错误）
 *
 * @example
 * const { curExceptionType, setTypeToError, clearErrorType } = useTableEmpty({
 *   filters: searchValue,           // 监听的筛选条件
 *   ignoreKeys: ['dateRange']       // 可选：忽略某些字段的监听
 * });
 *
 * // curExceptionType 会自动返回: 'empty' | 'search' | 'error'
 */
export default function useTableEmpty(opts: FilterOptions) {
  const isSearch = ref(false);
  const isError = ref(false);

  const curExceptionType = computed((): TableEmptyType => {
    if (isError.value) return 'error';
    else if (isSearch.value) return 'search';
    return 'empty';
  });

  /**
   * 设置当前表格状态为错误状态
   * 通常在接口请求失败时调用
   */
  function setTypeToError() {
    isError.value = true;
  }

  /**
   * 清除错误状态
   * 通常在重新请求数据前调用
   */
  function clearErrorType() {
    isError.value = false;
  }

  function deepFindFilter(curFilter: unknown[]): boolean {
    for (const item of curFilter) {
      if (item === null || item === undefined) {
        continue;
      }
      if (typeof item !== 'object' || item instanceof Date) {
        // 如果是基本类型或 Date 类型，检查是否非空
        if (!isValueEmpty(item)) {
          return true;
        }
      } else if (Array.isArray(item)) {
        // 如果是数组，递归检查
        if (deepFindFilter(item)) {
          return true;
        }
      } else {
        // 如果是对象，检查其值
        if (deepFindFilter(Object.values(item as Record<string, unknown>))) {
          return true;
        }
      }
    }
    return false;
  }

  function isValueEmpty(value: unknown) {
    return value === '' || value === null || value === undefined;
  }

  // 使用防抖优化，避免频繁触发导致的性能问题
  const updateSearchState = debounce((val: unknown) => {
    let result = false;
    if (Array.isArray(val)) {
      result = deepFindFilter(val);
    } else if (val !== null && typeof val === 'object') {
      const values = Object.entries(val)
        .filter(([key]) => !opts?.ignoreKeys?.includes(key))
        .map(([, value]) => value);
      result = deepFindFilter(values);
    } else {
      result = !isValueEmpty(val);
    }
    isSearch.value = result;
  }, 300);

  watch(
    opts.filters as WatchSource<unknown>,
    val => {
      updateSearchState(val);
    },
    { deep: true, immediate: true },
  );

  return {
    setTypeToError,
    clearErrorType,
    curExceptionType,
  };
}
