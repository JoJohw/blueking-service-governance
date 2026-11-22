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
 * PasswordInput 预览插件：默认 isEditMode=false 只会渲染成普通密码框。
 * 打开编辑模式且标记已有凭证，才能看到「圆点占位 → 点击进入编辑 → 重置」这条状态链。
 */
export default {
  name: 'components/password-input',

  propOverrides: {
    'components/password-input': {
      isEditMode: true,
      hasCredential: true,
    },
  },

  // 输入类控件的宽度由表单列决定，组件自身没有宽度概念；
  // 给个固定宽度，预览里才不会退化成「一行只剩几个圆点的超宽空框」
  containerWidth: {
    'components/password-input': 240,
  },
};
