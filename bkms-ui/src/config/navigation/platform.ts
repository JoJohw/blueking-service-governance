/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 */
import administrator from '~/pages/platform/administrator/index.vue';
import workspace from '~/pages/platform/workspace/index.vue';

import { i18n } from '../../modules/i18n';

import type { NavigationItem } from './types';

export const PLATFORM_NAVIGATION: NavigationItem[] = [
  {
    key: 'workspace',
    name: i18n.global.t('空间管理'),
    icon: 'space-basic',
    component: workspace,
  },
  {
    key: 'admin',
    name: i18n.global.t('平台管理员'),
    icon: 'user-line',
    component: administrator,
  },
];
