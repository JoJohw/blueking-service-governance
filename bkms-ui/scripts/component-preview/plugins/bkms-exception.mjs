/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * BkmsException 预览插件：七种 type 各对应一张 Soft 3D 插图（见组件内 EXCEPTION_IMG_MAP），
 * 单一样例只能看到一个 type，故用 family 变体逐个切。
 * 变体只覆盖 props、不塞节点：type slot 有内置 <img> fallback，传节点会顶掉插图。
 */
export default {
  name: 'bkms-exception',

  propOverrides: {
    // imgClass 会被当 class 挂到 img 上，占位文本会顶掉默认的 h-full w-full 尺寸
    'components/bkms-exception': { imgClass: '' },
  },

  componentFamily: {
    entry: 'components/bkms-exception',
    variants: [
      { label: '空数据', nodes: [], props: { type: 'empty' } },
      { label: '搜索无结果', nodes: [], props: { type: 'search-empty' } },
      { label: '服务异常', nodes: [], props: { type: '500' } },
      { label: '无权限', nodes: [], props: { type: '403' } },
      { label: '页面不存在', nodes: [], props: { type: '404' } },
      { label: '建设中', nodes: [], props: { type: 'building' } },
      { label: '登录', nodes: [], props: { type: 'login' } },
    ],
  },
};
