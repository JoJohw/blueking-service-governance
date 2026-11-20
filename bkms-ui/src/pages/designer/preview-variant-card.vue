<!--
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
-->

<template>
  <div
    class="box-border flex flex-1 flex-col min-w-[0] bkms-bg-card border-[1px] border-bkms-line-default rounded-[8px] overflow-hidden"
  >
    <div
      v-if="title"
      class="flex-none px-[16px] py-[12px] text-[14px] font-bold bkms-text-title border-b-[1px] border-bkms-line-default"
    >
      {{ title }}
    </div>
    <div class="flex h-[400px] flex-col items-center justify-center overflow-auto p-[16px]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{ title?: string }>(), { title: '' });
</script>
