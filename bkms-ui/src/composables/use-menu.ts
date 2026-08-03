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
import { computed } from 'vue';

import { useSpaceStore } from '~/stores/space';

import { i18n } from '../modules/i18n';

export type MenuId = 'APP' | 'BASIC' | 'ENV' | 'PLATFORM' | 'PLUGIN';
export type MenuItem = (typeof navListArr)[number];
export interface NavItem {
  id: MenuId;
  name: string;
  params?: Record<string, string>;
  title: string;
}

const navListArr = [
  {
    id: 'APP',
    title: i18n.global.t('应用管理'),
    name: 'app',
  },
  {
    id: 'ENV',
    title: i18n.global.t('环境管理'),
    name: 'env',
  },
  // {
  //   id: 'COMPONENT',
  //   title: i18n.global.t('组件市场'),
  //   name: 'component',
  // },
  {
    id: 'PLUGIN',
    title: i18n.global.t('组件管理'),
    name: 'plugin',
  },
  {
    id: 'BASIC',
    title: i18n.global.t('空间设置'),
    name: 'basic',
  },
] as const;

export const getNavList = () => {
  const spaceStore = useSpaceStore();

  const navList = computed(() => {
    if (!spaceStore.currentSpace) return [];
    return navListArr.reduce<Array<NavItem>>((acc, item) => {
      acc.push({
        ...item,
        params: {
          space: spaceStore.currentSpace,
        },
      });
      return acc;
    }, []);
  });

  return navList;
};
