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
import type { Component } from 'vue';

/**
 * 基础导航菜单项
 */
export interface BaseNavigationItem {
  /** 菜单对应的组件 */
  component?: Component;
  /** 是否禁用 */
  disabled?: boolean;
  /** 菜单图标 */
  icon?: string;
  /** 菜单唯一标识 */
  key: string;
  /** 菜单名称 */
  name: string;
  /** 额外的元数据 */
  meta?: {
    /** 自定义 class */
    class?: string;
    /** 布局类型：default（带默认 header 布局） | empty（无 header 布局），不配置默认为 default */
    layout?: 'default' | 'empty';
  };
}

/**
 * 导航配置项（联合类型）
 */
export type NavigationItem = BaseNavigationItem | NavigationGroup | NavigationSub;

/**
 * 分组导航菜单项
 */
interface NavigationGroup {
  /** 子菜单项 */
  children: BaseNavigationItem[];
  /** 折叠时显示的名称 */
  foldName: string;
  /** 分组唯一标识 */
  key: string;
  /** 分组名称 */
  name: string;
}

/**
 * 子导航菜单项
 */
interface NavigationSub {
  /** 子菜单项 */
  children: BaseNavigationItem[];
  /** 子导航唯一标识 */
  key: string;
  /** 子导航标题 */
  title: string;
}
