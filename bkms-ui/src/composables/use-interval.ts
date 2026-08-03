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
import { type Ref, getCurrentInstance, onBeforeUnmount, onDeactivated, onUnmounted, ref } from 'vue';

export type Fn = () => void;

export interface ITimeoutFnResult {
  isPending: Ref<boolean>;
  start: Fn;
  stop: Fn;
  timer: Ref<null | number>;
}

/**
 * 轮询
 * @param cb 回调
 * @param interval 轮询周期（支持数字或 Ref，动态更新时外部只需改 ref 值后重新 start）
 * @param immediate 立即执行
 */
export default function useIntervalFn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cb: (...args: any[]) => Promise<void>,
  interval: number | Ref<number> = 5000,
  immediate = false,
): ITimeoutFnResult {
  const isPending = ref(false);
  const flag = ref(false);
  const timer = ref<null | number>(null);
  /** 内部 ref：传数字也转为 ref，保证 start() 始终读取最新值 */
  const intervalRef = typeof interval === 'number' ? ref(interval) : interval;

  const instance = getCurrentInstance();

  // 清空轮询
  function clear() {
    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
  }
  // 停止轮询
  function stop() {
    isPending.value = false;
    flag.value = false;
    clear();
  }
  // 开始轮询
  function start(...args: unknown[]) {
    // 若此时组件已卸载，不开启轮询(异步调用场景)
    if (instance?.isUnmounted) return;
    clear();
    const ms = intervalRef.value;
    if (!ms) return;

    flag.value = true;
    async function timerFn() {
      // 上一个接口未执行完，不执行本次轮询
      if (isPending.value || !flag.value) return;

      isPending.value = true;
      await cb(...args);
      isPending.value = false;
      if (flag.value) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        timer.value = setTimeout(timerFn, ms) as unknown as number;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    timer.value = setTimeout(() => timerFn(), immediate ? 0 : ms) as unknown as number;
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(stop);
    onUnmounted(stop);
    onDeactivated(stop);
  }

  return {
    isPending,
    timer,
    start,
    stop,
  };
}
