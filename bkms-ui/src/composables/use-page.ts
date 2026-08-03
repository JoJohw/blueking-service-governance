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
import type { ComputedRef, Ref } from 'vue';
import { computed, reactive } from 'vue';

export interface IOptions extends IPageConf {
  onPageChange?: (current: number) => any;
  onPageSizeChange?: (limit: number) => any;
}

export interface IPageConf {
  count?: number;
  current: number;
  limit: number;
  remote: boolean; // 是否远程分页，触发table刷新
}

export interface IPageConfResult {
  curPageData: ComputedRef<any[]>;
  handleResetPage: Function;
  pageConf: IPageConf;
  pagination: ComputedRef<IPagination>;
  pageChange: (current: number) => void;
  pageSizeChange: (size: number) => void;
}

export interface IPagination extends IPageConf {
  count?: number;
  showTotalCount: boolean;
}

/**
 * 前端分页，支持全量数据或单页数据
 * @param data 全量数据
 * @param options 配置数据
 */
export default function usePageConf<T>(
  data: Ref<T[]>,
  options: IOptions = {
    current: 1,
    limit: 10,
    count: 0,
    remote: false,
  },
  count?: Ref<number>,
): IPageConfResult {
  const pageConf = reactive<IPageConf>({
    current: options.current,
    limit: options.limit,
    remote: options.remote,
  });

  const curPageData = computed<T[]>(() => {
    const { current, limit } = pageConf;
    return data.value.slice(limit * (current - 1), limit * current);
  });

  const pageChange = (current = 1) => {
    pageConf.current = current;
    const { onPageChange = null } = options;
    onPageChange && typeof onPageChange === 'function' && onPageChange(current);
  };

  const pageSizeChange = (limit = 10) => {
    pageConf.limit = limit;
    pageConf.current = 1;
    const { onPageSizeChange = null } = options;
    onPageSizeChange && typeof onPageSizeChange === 'function' && onPageSizeChange(limit);
  };

  const pagination = computed<IPagination>(() => {
    if (!count?.value) {
      return {
        ...pageConf,
        count: data.value.length,
        showTotalCount: false,
      };
    }
    return {
      ...pageConf,
      count: count.value,
      showTotalCount: true,
    };
  });

  const handleResetPage = () => {
    pageConf.current = 1;
  };

  return {
    pageConf,
    pagination,
    curPageData,
    pageChange,
    pageSizeChange,
    handleResetPage,
  };
}
