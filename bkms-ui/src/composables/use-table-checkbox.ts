import type { Ref } from 'vue';
import { computed, ref } from 'vue';

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
import { get } from 'lodash-es';

/**
 * 表格勾选（支持跨页全选）
 * @param data 当前页数据
 * @param path key路径
 * @param total 数据总数
 */
export default function useTableCheckbox<T>(data: Ref<Array<T>>, path: string, total?: Ref<number>) {
  const selections: Ref<T[]> = ref([]);
  const isCrossPageSelection = ref(false);
  const excludedIds = ref<Set<any>>(new Set());

  // 计算实际选中的数量
  const selection = computed(() =>
    isCrossPageSelection.value && total?.value
      ? Array.from({ length: total.value - excludedIds.value.size })
      : selections.value,
  );

  // 是否有选中项
  const hasSelection = computed(() =>
    isCrossPageSelection.value
      ? (total?.value ? total.value - excludedIds.value.size : 0) > 0
      : selections.value.length > 0,
  );

  // 当前页是否全选
  const isCurrentPageAllChecked = computed(() => {
    if (!data.value.length) return false;
    return isCrossPageSelection.value
      ? data.value.every(item => !excludedIds.value.has(get(item, path)))
      : data.value.every(item => selections.value.some(s => get(s, path) === get(item, path)));
  });

  // 表头 checkbox 的 indeterminate 状态
  const isIndeterminate = computed(() => {
    if (!data.value.length) return false;
    const checkedCount = data.value.filter(item => {
      const key = get(item, path);
      return isCrossPageSelection.value
        ? !excludedIds.value.has(key)
        : selections.value.some(s => get(s, path) === key);
    }).length;
    return checkedCount > 0 && checkedCount < data.value.length;
  });

  // 单选切换
  function handleCheckboxChange({ checked, row }: { checked: boolean; row: T }) {
    const key = get(row, path);
    if (isCrossPageSelection.value) {
      if (checked) {
        // 在跨页全选模式下重新勾选项，从排除列表中移除
        excludedIds.value.delete(key);
      } else {
        // 在跨页全选模式下取消勾选某一项，退出跨页全选模式，清除所有选择
        isCrossPageSelection.value = false;
        excludedIds.value.clear();
        selections.value = [];
      }
    } else {
      const index = selections.value.findIndex(item => get(item, path) === key);
      if (checked && index === -1) {
        selections.value.push(row);
      } else if (!checked && index > -1) {
        selections.value.splice(index, 1);
      }
    }
  }

  // 表头：全选/取消全选
  function handleCheckboxAll({ checked }: { checked: boolean }) {
    if (isCrossPageSelection.value) {
      data.value.forEach(item => {
        checked ? excludedIds.value.delete(get(item, path)) : excludedIds.value.add(get(item, path));
      });
    } else if (checked) {
      const existingKeys = new Set(selections.value.map(item => get(item, path)));
      data.value.forEach(item => {
        const key = get(item, path);
        if (!existingKeys.has(key)) selections.value.push(item);
      });
    } else {
      const currentPageKeys = new Set(data.value.map(item => get(item, path)));
      selections.value = selections.value.filter(item => !currentPageKeys.has(get(item, path)));
    }
  }

  // 跨页全选
  const handleSelectAllCrossPage = () => {
    isCrossPageSelection.value = true;
    excludedIds.value.clear();
    selections.value = [];
  };

  // 清除所有选择
  const handleClearSelection = () => {
    isCrossPageSelection.value = false;
    excludedIds.value.clear();
    selections.value = [];
  };

  return {
    selections,
    selection,
    hasSelection,
    isCrossPageSelection,
    excludedIds,
    isCurrentPageAllChecked,
    isIndeterminate,
    handleCheckboxChange,
    handleCheckboxAll,
    handleSelectAllCrossPage,
    handleClearSelection,
  };
}
