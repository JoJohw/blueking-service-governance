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
import type { Directive, DirectiveBinding } from 'vue';

/**
 * v-test 指令：在非生产环境下为元素添加 data-testid 属性，用于 E2E 测试定位。
 *
 * 命名规范: {模块}-{组件}-{行为}
 *
 * @example
 * <!-- 字符串用法 -->
 * <input v-test="'login-email-input'" />
 * <button v-test="'login-submit-btn'" />
 *
 * <!-- 对象用法，支持动态 id 拼接 -->
 * <tr v-for="item in list" v-test="{ id: `app-list-row-${item.id}` }" />
 */

const isProd = import.meta.env.PROD;

function applyTestId(el: HTMLElement, binding: DirectiveBinding) {
  if (isProd) return;

  const value = binding.value;
  if (!value) return;

  const testId = typeof value === 'string' ? value : value.id;
  if (testId) {
    el.setAttribute('data-testid', testId);
  }
}

const TestDirective: Directive = {
  mounted: applyTestId,
  updated: applyTestId,
};

export default TestDirective;
