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
import { appNavigationConfig } from '~/config/navigation/app';
import { BASIC_NAVIGATION } from '~/config/navigation/basic';
import { PLATFORM_NAVIGATION } from '~/config/navigation/platform';
import { PLUGIN_NAVIGATION } from '~/config/navigation/plugin';
import { useSpaceStore } from '~/stores/space';

import type { AppNavigationType } from '~/config/navigation/app';
import type { NavigationItem } from '~/config/navigation/types';

// 根据 menuId 获取对应的菜单列表
export type MenuIdType = 'APP' | 'BASIC' | 'PLATFORM' | 'PLUGIN';

// 获取空间设置导航菜单
export function getBasicMenuList(): NavigationItem[] {
  const spaceStore = useSpaceStore();

  if (!spaceStore.currentSpace) return [];
  return BASIC_NAVIGATION;
}

// 获取应用管理导航菜单（指定type）
export function getMenuList(type: AppNavigationType): NavigationItem[] {
  const spaceStore = useSpaceStore();

  if (!spaceStore.currentSpace || !type) return [];
  return appNavigationConfig[type] || [];
}

// 获取平台管理导航菜单
export function getPlatformMenuList(): NavigationItem[] {
  return PLATFORM_NAVIGATION;
}

// 获取组件管理导航菜单
export function getPluginMenuList(): NavigationItem[] {
  const spaceStore = useSpaceStore();

  if (!spaceStore.currentSpace) return [];
  return PLUGIN_NAVIGATION;
}

const menuGetterMap: Record<MenuIdType, (type?: AppNavigationType) => NavigationItem[]> = {
  APP: (type?: AppNavigationType) => (type ? getMenuList(type) : []),
  BASIC: () => getBasicMenuList(),
  PLATFORM: () => getPlatformMenuList(),
  PLUGIN: () => getPluginMenuList(),
};

export function getMenuListByMenuId(menuId: MenuIdType, type?: AppNavigationType): NavigationItem[] {
  const getter = menuGetterMap[menuId];
  return getter ? getter(type) : [];
}
