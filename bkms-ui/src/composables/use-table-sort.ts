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
export default function useTableSort<T>() {
  interface SortParams {
    data: T[];
    sortList: {
      field: string;
      order: 'asc' | 'desc';
    }[];
  }
  type CustomLogic = (itemA: T[keyof T], itemB: T[keyof T]) => any;

  function sortMethod({ data, sortList }: SortParams, customLogic?: CustomLogic) {
    const curField = sortList[0].field as keyof T;
    const curOrder: 'asc' | 'desc' = sortList[0].order;
    return data.sort((a: T, b: T) => {
      let compareResult;
      // 日期字段比较
      if ((['createAt', 'updatedAt'] as (keyof T)[]).includes(curField)) {
        const timeA =
          a[curField] && !isNaN(new Date(a[curField] as string).getTime())
            ? new Date(a[curField] as string).getTime()
            : -Infinity;
        const timeB =
          b[curField] && !isNaN(new Date(b[curField] as string).getTime())
            ? new Date(b[curField] as string).getTime()
            : -Infinity;

        compareResult = timeA - timeB;
      } else if (customLogic) {
        compareResult = customLogic(a[curField], b[curField]);
      } else {
        // 其他字段按字符串比较
        const strA = String(a[curField] || '');
        const strB = String(b[curField] || '');
        compareResult = strA.localeCompare(strB);
      }
      return curOrder === 'asc' ? compareResult : -compareResult;
    });
  }

  return {
    sortMethod,
  };
}
