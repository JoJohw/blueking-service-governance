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
import { envTypeMap } from './use-env-manager';

/** 作用域展示配置 */
export interface ScopeDisplay {
  label: string;
  tagType: string;
}

const WORKSPACE_DISPLAY: ScopeDisplay = { label: '所有', tagType: 'default' };

/** 获取作用域展示配置（label + tagType） */
export function getScopeDisplay(scopeType: string, scopeValue: string): ScopeDisplay {
  if (scopeType === 'workspace') return WORKSPACE_DISPLAY;
  if (scopeType === 'envType') {
    const cfg = envTypeMap[scopeValue];
    return cfg ? { label: cfg.name, tagType: cfg.theme } : { label: scopeValue, tagType: 'info' };
  }
  return { label: scopeValue || '--', tagType: 'default' };
}

/** 获取作用域展示标签文本 */
export function getScopeLabel(scopeType: string, scopeValue: string): string {
  return getScopeDisplay(scopeType, scopeValue).label;
}
