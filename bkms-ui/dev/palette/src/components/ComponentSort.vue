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
 - either express or implied. See the License for the specific language governing permissions
 - and limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<template>
  <div class="component-sort">
    <button
      v-for="option in SORT_OPTIONS"
      :key="option.value"
      :class="{ 'is-active': modelValue === option.value }"
      :title="option.title"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import type { ComponentSortMode } from '../config/components';

  const SORT_OPTIONS: { label: string; title: string; value: ComponentSortMode }[] = [
    { label: '默认', title: '清单原顺序', value: 'default' },
    { label: '降序', title: '使用次数从多到少', value: 'desc' },
    { label: '升序', title: '使用次数从少到多', value: 'asc' },
  ];

  defineProps<{ modelValue: ComponentSortMode }>();

  const emit = defineEmits<{ 'update:modelValue': [value: ComponentSortMode] }>();
</script>

<style scoped>
  .component-sort {
    display: inline-flex;
    flex: none;
    gap: 2px;
    padding: 2px;
    background: var(--pal-bg-hover);
    border: 1px solid var(--pal-line);
    border-radius: 6px;
  }

  .component-sort button {
    padding: 1px 4px;
    font: inherit;
    font-size: 11px;
    line-height: 16px;
    color: var(--pal-text-body);
    white-space: nowrap;
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .component-sort button:hover {
    color: var(--pal-text-title);
    background: var(--pal-bg-card);
  }

  .component-sort button.is-active {
    color: var(--pal-brand);
    background: var(--pal-bg-card);
    box-shadow: 0 1px 3px var(--pal-shadow-popover);
  }
</style>
