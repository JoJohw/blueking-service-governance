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
import { type InjectionKey, inject, provide } from 'vue';

import { Message } from 'bkui-vue';
import { i18n } from '~/modules/i18n';

import type { InstanceActionContext } from '../types';

export const INSTANCE_ACTION_CONTEXT_KEY: InjectionKey<InstanceActionContext> = Symbol('instanceActionContext');

export function provideInstanceActionContext(context: InstanceActionContext) {
  provide(INSTANCE_ACTION_CONTEXT_KEY, context);
}

/** 操作提交成功后的统一副作用：提示、刷新、重启轮询 */
export async function runActionSuccess(context: InstanceActionContext, options?: { clearSelection?: boolean }) {
  Message({
    theme: 'success',
    message: i18n.global.t('操作成功'),
  });

  if (options?.clearSelection) {
    context.clearSelections();
  }

  context.timer?.stop();
  await context.refreshData();
  context.timer?.start();
}

export function useInstanceActionContext(): InstanceActionContext {
  const context = inject(INSTANCE_ACTION_CONTEXT_KEY);
  if (!context) {
    throw new Error('useInstanceActionContext must be used within a provider');
  }
  return context;
}
