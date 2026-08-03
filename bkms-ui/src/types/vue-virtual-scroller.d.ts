/*
 * Tencent is pleased to support the open source community by making
 * 钃濋哺鏅轰簯PaaS骞冲彴 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 钃濋哺鏅轰簯PaaS骞冲彴 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 钃濋哺鏅轰簯PaaS骞冲彴 (BlueKing PaaS):
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
declare module 'vue-virtual-scroller' {
  import type { Component } from 'vue';

  type ItemKey = number | string;

  interface RecycleScrollerProps<T = unknown> {
    buffer?: number;
    class?: unknown;
    direction?: 'horizontal' | 'vertical';
    items?: T[];
    itemSecondarySize?: number;
    itemSize?: number;
    keyField?: string;
    listClass?: unknown;
    listTag?: string;
    minItemSize?: number;
    pageMode?: boolean;
    prerender?: number;
    skipHover?: boolean;
    style?: unknown;
    typeField?: string;
    viewClass?: unknown;
    viewTag?: string;
  }

  interface RecycleScrollerSlotProps<T = unknown> {
    active: boolean;
    index: number;
    item: T;
    itemKey: ItemKey;
  }

  interface RecycleScrollerInstance<T = unknown> {
    $props: RecycleScrollerProps<T>;
    $slots: {
      after?: () => unknown;
      before?: () => unknown;
      default?: (props: RecycleScrollerSlotProps<T>) => unknown;
      empty?: () => unknown;
    };
  }

  // vue-virtual-scroller@2.0.0-beta.8 does not ship type declarations.
  // The generic constructor lets Vue infer slot item types from `items` where possible.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export const RecycleScroller: new <T = unknown>() => Component & {
    $props: RecycleScrollerProps<T>;
    $slots: {
      [key: string]: (...args: unknown[]) => unknown;
      after?: () => unknown;
      before?: () => unknown;
      default: (props: RecycleScrollerSlotProps<T>) => unknown;
      empty?: () => unknown;
    };
  };
}
