<!--
 - TencentBlueKing is pleased to support the open source community by making
 - 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 - Copyright (C) Tencent. All rights reserved.
 - Licensed under the MIT License (the "License"); you may not use this file except
 - in compliance with the License. You may obtain a copy of the License at
 -
 -  http://opensource.org/licenses/MIT
 -
 - Unless required by applicable law or agreed to in writing, software distributed under
 - the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 - either express or implied. See the License for the specific language governing permissions and
 - limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<template>
  <div :class="['leading-[22px] text-[12px] rounded-[2px] border-[1px] px-[5px] w-fit', theme]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue';
  type ITheme = 'danger' | 'default' | 'info' | 'success' | 'warning';
  defineProps({
    theme: {
      type: String as PropType<ITheme>,
      default: 'default',
    },
  });
</script>

<style lang="postcss" scoped>
  .default {
    background-color: var(--bkms-neutral-8);
    color: var(--bkms-neutral-2);
    border-color: var(--bkms-neutral-5);
  }
  .success {
    background-color: var(--bkms-success-6);
    color: var(--bkms-success-2);
    border-color: var(--bkms-success-4);
  }
  .danger {
    background-color: #fbe9e7;
    color: var(--bkms-danger-2);
    border-color: var(--bkms-danger-2);
  }
  .warning {
    background-color: var(--bkms-warning-7);
    color: var(--bkms-danger-2);
    border-color: var(--bkms-danger-2);
  }
  .info {
    background-color: var(--bkms-brand-6);
    color: var(--bkms-brand-2);
    border-color: var(--bkms-success-4);
  }
</style>
