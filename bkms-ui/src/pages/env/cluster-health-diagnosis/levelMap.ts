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

import { TagThemeEnum } from 'bkui-vue/lib/shared';
import { type CheckItemOutput } from '~/@types/v1/bkintegrations-kubeinsight';
/** 状态类型 */
export type LevelType = 'INFO' | 'RECOVERED' | 'RISK' | 'WARN' | Required<CheckItemOutput>['level'];

/** 状态类型对应的值 */
export const LEVEL_VALUE = {
  RISK: 'RISK',
  WARN: 'WARN',
  INFO: 'INFO',
  RECOVERED: 'RECOVERED',
} as const satisfies Record<LevelType, string>;
/** 状态类型用于ui展示的数据 */
export const LEVEL_FOR_UI: Record<
  LevelType,
  {
    // 用于状态列 是否已恢复
    isRecovered: boolean;
    // 告警资源列 左侧告警图标背景色
    resourceKeyColumnBg?: string;
    // Tag组件theme属性
    tagTheme: TagThemeEnum;
  }
> = {
  RISK: {
    resourceKeyColumnBg: '#EA3636',
    isRecovered: false,
    tagTheme: TagThemeEnum.DANGER,
  },
  WARN: {
    resourceKeyColumnBg: '#F59500',
    isRecovered: false,
    tagTheme: TagThemeEnum.DANGER,
  },
  INFO: {
    isRecovered: false,
    tagTheme: TagThemeEnum.DANGER,
  },
  RECOVERED: {
    isRecovered: true,
    tagTheme: TagThemeEnum.SUCCESS,
  },
};
