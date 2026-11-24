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
  <div class="search-bar">
    <span class="search-icon">⌕</span>
    <input
      aria-label="搜索令牌"
      class="search-input"
      :placeholder="placeholder"
      spellcheck="false"
      type="text"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      aria-label="清空搜索"
      class="search-clear"
      type="button"
      @click="emit('update:modelValue', '')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ modelValue: string; placeholder?: string }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<style scoped>
  /* 窄屏退回工具栏的 flex 布局，此时由剩余空间决定宽度；断点与 main.css 的 --pal-tabs-w 联动 */
  @media (width <= 1412px) {
    .search-bar {
      flex: 1 1 auto;
      width: auto;
    }
  }

  /* 位于工具栏网格的中间列，宽度由列决定，因此中心与工具栏中心重合 */
  .search-bar {
    box-sizing: border-box;
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    min-width: 0;
    padding: 12px 18px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 24px;
    box-shadow: 0 4px 16px var(--pal-shadow-popover);
  }

  .search-icon {
    flex: none;
    font-size: 22px;
    line-height: 1;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .search-input {
    flex: 1;
    min-width: 0;
    padding: 0;
    font: inherit;
    font-size: 16px;
    color: var(--pal-text-title);
    outline: none;
    background: none;
    border: none;
  }

  .search-input::placeholder {
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .search-clear {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    font-size: 20px;
    line-height: 1;
    color: var(--pal-text-body);
    cursor: pointer;
    background: var(--pal-bg-head);
    border: none;
    border-radius: 50%;
  }

  .search-clear:hover {
    color: var(--pal-text-title);
    background: var(--pal-bg-hover);
  }
</style>
