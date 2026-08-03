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
import type { TagConfig } from '~/@types/build';

/**
 * 获取 TagConfig 的显示文本
 * @param tagConfig - TagConfig 配置对象
 * @param t - i18n 翻译函数
 * @returns 显示文本
 */
export function getTagConfigDisplayText(tagConfig: null | TagConfig | undefined, t: (key: string) => string): string {
  if (!tagConfig?.type) return t('未开启');

  if (tagConfig.type === 'semver') {
    return t('语义化版本（格式：v1.0.0）');
  }

  if (tagConfig.type === 'custom') {
    const { prefix, withRevision, withBuildTime } = tagConfig.customOpts || {};
    const parts = [prefix, withRevision && `{${t('分支/Tag')}}`, withBuildTime && t('构建时间')].filter(Boolean);
    return parts.join('-') || t('自定义版本');
  }

  return '--';
}

/**
 * 标准化 tagConfig 值，当 type 为空字符串或不存在时返回 null。
 * @param tagConfig - TagConfig 配置对象
 * @returns 有效的 TagConfig 或 null
 */
export function normalizeTagConfig(tagConfig: null | TagConfig | undefined): null | TagConfig {
  if (!tagConfig?.type) return null;
  return tagConfig;
}
