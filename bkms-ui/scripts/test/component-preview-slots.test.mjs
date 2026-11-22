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

import { parse } from '@vue/compiler-sfc';
import { describe, expect, it } from 'vitest';

import { findVisibilityProp } from '../component-preview/internal/slots.mjs';

describe('弹层显隐 prop 反查', () => {
  it('绑定 defineModel 变量时返回模型别名而非变量名', () => {
    const { descriptor } = parse(`
<template>
  <Sideslider v-model:is-show="visible" />
</template>
<script setup>
const visible = defineModel<boolean>('isShow', { default: false });
</script>
`);
    expect(findVisibilityProp(descriptor)).toBe('isShow');
  });
});
