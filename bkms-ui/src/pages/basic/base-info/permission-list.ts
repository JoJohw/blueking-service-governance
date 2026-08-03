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
export type IRole = 'admin' | 'developer' | 'operator' | 'sre';
/** 外部调用时记得国际化处理 */
export const PERMISSION_LIST = [
  {
    resource: '空间',
    operation: '查看空间',
    admin: true,
    developer: true,
    sre: true,
    operator: true,
  },
  {
    resource: '空间',
    operation: '创建空间',
    admin: true,
    developer: false,
    sre: false,
    operator: false,
  },
  {
    resource: '空间',
    operation: '编辑空间',
    admin: true,
    developer: false,
    sre: false,
    operator: false,
  },
  {
    resource: '空间',
    operation: '删除空间',
    admin: true,
    developer: false,
    sre: false,
    operator: false,
  },
  {
    resource: '应用',
    operation: '创建应用',
    admin: true,
    developer: true,
    sre: true,
    operator: false,
  },
  {
    resource: '应用',
    operation: '查看应用',
    admin: true,
    developer: true,
    sre: true,
    operator: true,
  },
  {
    resource: '应用',
    operation: '编辑应用',
    admin: true,
    developer: true,
    sre: true,
    operator: false,
  },
  {
    resource: '应用',
    operation: '删除应用',
    admin: true,
    developer: true,
    sre: false,
    operator: false,
  },
  {
    resource: '环境',
    operation: '查看环境',
    admin: true,
    developer: true,
    sre: true,
    operator: true,
  },
  {
    resource: '环境',
    operation: '部署到环境',
    admin: true,
    developer: true,
    sre: true,
    operator: false,
  },
  {
    resource: '环境',
    operation: '创建环境',
    admin: true,
    developer: false,
    sre: true,
    operator: false,
  },
  {
    resource: '环境',
    operation: '编辑环境',
    admin: true,
    developer: false,
    sre: true,
    operator: false,
  },
  {
    resource: '环境',
    operation: '删除环境',
    admin: true,
    developer: false,
    sre: true,
    operator: false,
  },
];
