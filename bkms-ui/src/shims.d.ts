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
interface Window {
  readonly BK_API_PREFIX: string;
  readonly BK_BCS: string;
  readonly BK_DOC_URL: string;
  readonly BK_LOGIN_URL: string;
  readonly BK_SHARED_RES_BASE_JS_URL: string;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  i18n: import('vue-i18n').I18nGlobal;
  MonacoEnvironment?: {
    getWorker(workerId: string, label: string): Worker;
  };
}

declare const BK_BKMS_WELCOME: string;

declare const BK_BKMS_VERSION: string;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '*.svg' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent;
  export default component;
}

declare module '@blueking/platform-config';

declare module '@blueking/notice-component';

declare module '@blueking/user-selector';

declare module '@blueking/xss-filter';

declare module 'bkui-vue';

declare module 'pluralize';

declare module '@blueking/monitor-vue3-components';

declare module 'highlight.js/lib/languages/*';
