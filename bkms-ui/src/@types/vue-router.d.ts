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

import 'vue-router';

import type { MenuId } from '~/composables/use-menu';

export {};

declare module 'vue-router' {
  import type { RouteLocationRaw } from 'vue-router';

  interface RouteMeta {
    layout?: 'content' | 'default' | 'empty' | 'main';
    menuId?: 'COMPONENT' | MenuId;
    title?: string;
  }

  interface Router {
    /**
     * 智能返回导航（覆写原始 back）
     * - 有浏览历史时使用 history.back()，体验更自然
     * - 无历史时优先使用 fallback > 自动推导 parent > history.back()
     * @param fallback 兜底路由，当无历史记录时跳转到此路径
     */
    back(fallback?: RouteLocationRaw): void;

    /**
     * 原始 back()，跳过智能返回逻辑，直接调用浏览器 history.back()
     * 仅在需要绕过智能返回的极少数场景下使用
     */
    originalBack(): void;
  }
}
