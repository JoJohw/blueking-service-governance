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

import { getPlatformConfig, setDocumentTitle, setShortcutIcon } from '@blueking/platform-config';
import { useI18n } from 'vue-i18n';
import { usePlatformConfigStore } from '~/stores/platform-config';
export default function usePlatform() {
  const platformConfig = usePlatformConfigStore();
  async function getPlatformInfo() {
    const { t } = useI18n();
    const defaults = {
      name: '服务治理',
      nameEn: 'BKMS-GOVERN',
      appLogo: '',
      brandName: '蓝鲸智云',
      brandNameEn: 'Tencent BlueKing',
      productName: '蓝鲸服务治理',
      productNameEn: 'BKMS-GOVERN',
      favicon: '/favicon.svg',
      helperLink: 'wxwork://message?uin=8444252571319680',
      helperText: t('技术支持'),
      footerInfoHTML: '',
      version: '',
      i18n: {
        footerInfoHTML: '',
      },
    };
    let data: { [key: string]: any } = {};
    if (import.meta.env.BK_SHARED_RES_BASE_JS_URL) {
      data = await getPlatformConfig(import.meta.env.BK_SHARED_RES_BASE_JS_URL, defaults);
    } else {
      data = await getPlatformConfig(defaults);
    }
    Object.keys(platformConfig.$state).forEach(key => {
      platformConfig.$patch({
        [key]: data[key],
      });
    });
    return data;
  }
  return {
    platformConfig,
    getPlatformInfo,
    setDocumentTitle,
    setShortcutIcon,
  };
}
