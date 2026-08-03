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

/**
 * 事实上 `~/@types/v1` 并未提供对应 type，这里仍保留deprecated，待后续补充
 */

/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export interface Component {
  // 管理员
  administrator: string;
  // 组件可见范围，如果为空，组件属于市场组件，不为空属于空间组件
  allowedRange: string;
  // 组件创建时间
  createTime: Date;
  // 组件创建者
  creator: string;
  // 组件描述
  definition: ComponentDefinition;
  // 中文名字
  displayName: string;
  labels: Record<string, string>;
  // 组件名字，全局唯一
  name: string;
  // 组件输出，yaml直接放到这个字段就好
  output: string;
  // 是否公开
  public: boolean;
  // 引用次数
  referenceCount: number;
  // 组件操作
  restOperations: RestOperations;
  // 组件状态
  status: string;
  // 组件类型，Component/Strategy/Storage/Deploy
  type: string;
  // 组件更新者
  updatedBy: string;
  // 组件更新时间
  updatedTime: Date;
  // 版本
  version: string;
}
/**
 * @deprecated 请改用 `~/@types/v1` 下对应 type（本属性已绑定 v1 实现）。
 */
export interface ComponentDefinition {
  description: string;
  properties: Record<string, any>[];
}
