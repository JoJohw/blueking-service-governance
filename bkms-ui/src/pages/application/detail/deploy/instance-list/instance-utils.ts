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
import { h } from 'vue';

import { type AppInstanceOutputObj } from '~/@types/v1/instance';
import { i18n } from '~/modules/i18n';

const { t } = i18n.global;

/** 判断实例是否可以灰度（只有 Running 和 Pending 状态可以灰度） */
export function canInstanceGrayDeploy(instance: AppInstanceOutputObj): boolean {
  return instance.status === 'Running' || instance.status === 'Pending';
}

/** 登录：仅 Running 状态可登录 */
export function canLogin(instance: AppInstanceOutputObj): boolean {
  return instance.status === 'Running';
}

/** 判断实例的北极星状态是否全部健康 */
export function isPolarisHealthy(instance: AppInstanceOutputObj): boolean {
  return instance.polarisInfos?.every(p => p.isHealthy) ?? false;
}

/** 日志：Running、CrashLoopBackOff、Error、Completed、Succeeded 状态可查看日志 */
const LOG_ALLOWED_STATUSES = new Set(['Running', 'CrashLoopBackOff', 'Error', 'Completed', 'Succeeded']);
export function canViewLog(instance: AppInstanceOutputObj): boolean {
  return LOG_ALLOWED_STATUSES.has(instance.status!);
}

/** 渲染删除确认 InfoBox 内容 */
export function renderDeleteInfoBoxContent(selectedInstances: AppInstanceOutputObj[]) {
  if (selectedInstances.length === 1) {
    return h('div', [
      h('div', { class: 'py-[12px]' }, [t('实例: {0}', [`${selectedInstances[0]?.id} (${selectedInstances[0]?.ip})`])]),
      h('div', { class: 'bg-[#F5F7FA] py-[12px] px-[16px]' }, [t('此操作将删除该实例，并调整实例数')]),
    ]);
  }

  const instances = selectedInstances.map((item, i) =>
    h('div', { class: ['px-[16px] leading-[32px]', { 'bg-[#FAFBFD]': i % 2 > 0 }] }, [`${item.id} (${item.ip})`]),
  );

  return h('div', [
    h('div', { class: 'bg-[#F5F7FA] py-[12px] px-[16px]' }, [t('此操作将删除以下实例，并调整实例数')]),
    h(
      'div',
      {
        class:
          'bg-[#F5F7FA] leading-[32px] px-[16px] mt-[16px] border-1 border-[#EAEBF0] rounded-[2px] border-b-transparent',
      },
      [h('span', [t('已选择以下 {0} 个实例', [selectedInstances.length])])],
    ),
    h(
      'div',
      {
        class: 'max-h-[200px] overflow-auto border-1 border-t-transparent border-[#EAEBF0] rounded-[2px] p-[12px]',
      },
      [...instances],
    ),
  ]);
}
