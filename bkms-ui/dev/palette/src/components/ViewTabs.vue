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
  <nav class="view-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :class="{ 'is-active': active === tab.value }"
      type="button"
      @click="emit('change', tab.value)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
  import type { PaletteView } from '../router';

  defineProps<{
    active: PaletteView;
    tabs: { label: string; value: PaletteView }[];
  }>();

  const emit = defineEmits<{ change: [value: PaletteView] }>();
</script>

<style scoped>
  .view-tabs {
    position: fixed;
    top: 18px;
    left: 296px;
    z-index: 45;
    box-sizing: border-box;
    display: flex;
    flex: 0 0 auto;
    gap: 4px;
    padding: 3px;
    background: color-mix(in srgb, var(--pal-bg-card) 72%, transparent);
    border: 1px solid color-mix(in srgb, var(--pal-bg-card) 55%, transparent);
    border-radius: 999px;
    box-shadow: 0 4px 16px var(--pal-shadow-popover);
    backdrop-filter: blur(12px) saturate(160%);
  }

  .view-tabs button {
    padding: 6px 16px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: var(--pal-text-body);
    white-space: nowrap;
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 999px;
    transition: all 0.2s ease;
  }

  .view-tabs button:hover {
    color: var(--pal-text-title);
    background: color-mix(in srgb, var(--pal-bg-card) 45%, transparent);
    transform: translateY(-1px);
  }

  .view-tabs button.is-active {
    color: var(--pal-brand);
    background: color-mix(in srgb, var(--pal-bg-card) 88%, transparent);
    box-shadow: 0 1px 3px var(--pal-shadow-popover);
  }
</style>
