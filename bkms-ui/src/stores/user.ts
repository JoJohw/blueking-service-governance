import { computed, ref } from 'vue';

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
import { defineStore } from 'pinia';
import { getUser } from '~/api/modules/user';
import { AccountService } from '~/api/modules/v1/account';

import type { IUser } from '~/@types/api';
import type { RoleInfo } from '~/@types/v1/account';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<IUser>({
    user_id: '',
  });
  const roleInfo = ref<null | RoleInfo>(null);
  const currentUsername = computed(() => roleInfo.value?.username || userInfo.value.user_id || '');
  const hasPlatformRole = computed(() => !!roleInfo.value?.platRoleCode);

  async function getUserInfo() {
    userInfo.value = await getUser({}, { needRes: true }).catch(() => ({ user_id: '' }));
  }

  async function getRoleInfo() {
    roleInfo.value = await AccountService.getRole(undefined, { interceptorErr: false }).catch(() => null);
  }

  function setUserInfo(user: IUser) {
    userInfo.value = user;
  }

  return {
    userInfo,
    roleInfo,
    currentUsername,
    hasPlatformRole,
    getUserInfo,
    getRoleInfo,
    setUserInfo,
  };
});
