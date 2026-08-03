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
import { type ComputedRef, type Ref, computed } from 'vue';

import useInterval from '~/composables/use-interval';

import { canInstanceGrayDeploy } from '../instance-utils';
import { type UseInstanceActionsOptions, useInstanceActions } from './use-instance-actions';

import type InstanceActionsHost from '../components/instance-actions-host.vue';
import type { InstanceRowActionPayload } from '../types';

interface UseInstanceListControllerOptions
  extends Omit<UseInstanceActionsOptions, 'isAllInstancesSelected' | 'selectedCount' | 'timer'> {
  actionsHostRef: Ref<InstanceType<typeof InstanceActionsHost> | null>;
  isAllInstancesSelected: ComputedRef<boolean>;
  pollInterval: number;
  selectedCount: ComputedRef<number> | Ref<number>;
  beforeRowAction?: (payload: InstanceRowActionPayload) => void;
}

// 统一收口实例列表的批量操作、轮询和行操作处理。
export function useInstanceListController(options: UseInstanceListControllerOptions) {
  const { actionsHostRef, beforeRowAction, isAllInstancesSelected, pollInterval, selectedCount, ...actionOptions } =
    options;

  const canGrayDeploy = computed(() => {
    const selections = actionOptions.getSelectedInstances();
    return selections.length > 0 && selections.every(instance => canInstanceGrayDeploy(instance));
  });

  const { start, stop, timer } = useInterval(async () => {
    await Promise.resolve(actionOptions.refreshData());
  }, pollInterval);

  const instanceActions = useInstanceActions(
    {
      ...actionOptions,
      isAllInstancesSelected,
      selectedCount,
      timer: { start, stop },
    },
    actionsHostRef,
  );

  // 在统一入口里执行行操作前置逻辑并分发动作。
  function handleRowAction(payload: InstanceRowActionPayload) {
    beforeRowAction?.(payload);
    instanceActions.handleRowAction(payload);
  }

  return {
    canGrayDeploy,
    handleRowAction,
    instanceActions,
    timer,
    startPolling: start,
    stopPolling: stop,
  };
}
