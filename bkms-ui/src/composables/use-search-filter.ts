import { type Ref, computed } from 'vue';

import { mapKeys } from '~/common/util';

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
import type { ISearchItem, ISearchValue } from 'bkui-vue/lib/search-select/utils';

/**
 * 筛选选项接口
 */
export interface IFilters {
  /** 是否选中 */
  checked?: boolean;
  /** 显示标签 */
  label: string;
  /** 选项值 */
  value: string;
}

/**
 * 搜索筛选 Hook
 *
 * ⚠️ 重要：TableColumn 的 field 属性必须与 filterKeys 中的字段 id 完全一致
 *
 * @param searchSelectData - 搜索选择器的配置数据
 * @param searchValue - 当前选中的搜索值（响应式）
 * @param filterKeys - 需要生成 filterOptions 的字段 id 列表（使用 as const 获得类型提示）
 */
export default function useSearchFilter<T extends readonly string[]>(
  searchSelectData: Ref<ISearchItem[]>,
  searchValue: Ref<ISearchValue[]>,
  filterKeys: T,
) {
  /** 筛选选项（自动从 searchSelectData 派生并标记选中状态） */
  const filterOptions = computed(() => {
    const result = {} as Record<T[number], IFilters[]>;
    filterKeys.forEach(id => {
      result[id as T[number]] = createFilterOptions(id);
    });
    return result;
  });
  /** 创建筛选选项（从 searchSelectData 提取并转换为 filter 格式） */
  function createFilterOptions(id: string): IFilters[] {
    // 从 searchSelectData 中找到对应 id 的配置项
    const data = searchSelectData.value.find(item => item.id === id);
    // 获取当前该字段已选中的值
    const curItemSearchData = searchValue.value.find(item => item.id === id)?.values || [];

    // 如果没有 children 数据，返回空数组
    if (!data?.children || !Array.isArray(data.children)) {
      return [];
    }

    // 将 children 数据转换为 filter 选项格式，并标记选中状态
    return mapKeys(data.children, {
      label: 'name',
      value: 'id',
    }).map(item => {
      const isSelected = curItemSearchData.some(curItem => curItem.id === item.value);
      return {
        ...item,
        checked: isSelected,
      } as IFilters;
    });
  }

  /** 处理筛选条件变化（将 filter 变化同步到 searchValue） */
  function handleFilterChange({ field, values }: { field: string; values: string[] }) {
    // 从 searchSelectData 中找到对应 field 的配置项
    const searchItem = searchSelectData.value.find(item => item.id === field);
    if (!searchItem) return;

    // 查找 searchValue 中是否已存在该 id 的数据
    const existingIndex = searchValue.value.findIndex(item => item.id === searchItem.id);

    // 如果 values 为空，删除该项（用户取消了所有选择）
    if (values.length === 0) {
      if (existingIndex > -1) {
        searchValue.value.splice(existingIndex, 1);
      }
      return;
    }

    // 将 values 转换为 ISearchValue 格式
    const valuesList = values.map(value => {
      // 从 children 中找到对应的 name（用于显示）
      const child = searchItem.children?.find((item: any) => item.id === value);
      return {
        id: value,
        name: child?.name || value,
      };
    });

    // 构造新的 ISearchValue 对象
    const newSearchValue: ISearchValue = {
      id: searchItem.id,
      name: searchItem.name,
      values: valuesList,
    };

    // 如果已存在，替换；否则新增
    if (existingIndex > -1) {
      searchValue.value[existingIndex] = newSearchValue;
    } else {
      searchValue.value.push(newSearchValue);
    }
  }

  return {
    filterOptions,
    handleFilterChange,
  };
}
