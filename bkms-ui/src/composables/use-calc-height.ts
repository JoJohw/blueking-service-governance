import type { Ref } from 'vue';
import { isRef, onBeforeUnmount, onMounted, ref } from 'vue';

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
import { throttle } from 'lodash-es';

type ElementType = HTMLElement | Ref<any> | string; // 节点

interface IConfig {
  calc?: ElementType | ElementType[]; // 要设置高度的元素
  el?: ElementType | ElementType[]; // 要设置高度的元素
  id?: number | string;
  offset?: number;
  prop?: 'height' | 'max-height';
}

/**
 * 动态计算元素高度
 * eg: useContentHeight({ el: { id: 'id1' }, els: { classes: ['class1', 'class2'], els: testRef } })
 * 上面案列表示: id元素高度 = 100vh - class1元素高度 - class2元素高度 - testRef元素高度
 * @param config
 * @returns
 */
export default function useContentHeight(config: IConfig | IConfig[]) {
  const style = ref<Record<string, any>>({});
  // 统一数据结构为数组
  const parseToArr = <T>(data?: T | T[]) => {
    if (!data) return [];

    return Array.isArray(data) ? data : [data];
  };

  // 统一dom数据格式
  const parseDomData = (el?: ElementType | ElementType[]): HTMLElement[] => {
    const data: ElementType[] = parseToArr<ElementType>(el);
    return data
      .map(el => {
        if (typeof el === 'string') {
          return document.querySelector(el);
        }
        if (isRef(el)) {
          return el.value instanceof HTMLElement ? el.value : (el.value as any)?.$el;
        }
        return el;
      })
      .filter(el => !!el);
  };

  // 设置内容高度
  const setContentHeight = (config: IConfig) => {
    const { prop } = config || {};

    const calcEleData = parseDomData(config.calc);
    if (!calcEleData.length) return;

    // 需要减去的元素高度
    const offset = calcEleData.reduce((pre, dom) => {
      pre += dom?.getBoundingClientRect()?.height || 0;
      return pre;
    }, config.offset || 0);

    const sty = {
      [prop || 'max-height']: `calc(100vh - ${offset}px)`,
    };

    if (config.id) {
      style.value[config.id] = sty;
    } else {
      style.value = sty;
    }
    // 设置元素高度
    const elData = parseDomData(config.el);
    elData.forEach(el => {
      Object.keys(sty).forEach(key => {
        el.style[key as any] = sty[key];
      });
    });
  };

  // 重新计算高度
  const init = () => {
    const configList = parseToArr(config);
    configList.forEach(item => setContentHeight(item));
  };

  onMounted(() => {
    const observer = new MutationObserver(
      throttle(
        () => {
          init();
        },
        300,
        {
          leading: false,
          trailing: true,
        },
      ),
    );

    observer.observe(document.body, {
      childList: true,
      attributes: true,
    });

    onBeforeUnmount(() => {
      observer.takeRecords();
      observer.disconnect();
    });
  });

  return {
    style,
    init,
  };
}
