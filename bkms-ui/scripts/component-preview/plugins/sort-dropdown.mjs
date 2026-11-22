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
 * SortDropdown 预览插件：用应用列表页真实排序项做样例，避免触发器里全是「占位文本」。
 * option-label 走组件自带的动态 fallback，真实态不传该 slot，文案自然跟随选中项变化。
 */
export default {
  name: 'components/sort-dropdown',

  propOverrides: {
    'components/sort-dropdown': {
      modelValue: 'lastOperatedAt',
      order: 'desc',
      options: [
        { label: '应用名称', value: 'name', ascName: 'A → Z', descName: 'Z → A' },
        { label: '操作时间', value: 'lastOperatedAt', ascName: '升序', descName: '降序' },
        { label: '创建时间', value: 'createdAt', ascName: '升序', descName: '降序' },
      ],
    },
  },
};
