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
  <div class="component-results">
    <template v-if="hits.length">
      <p class="result-count">找到 {{ hits.length }} 个组件</p>
      <div class="result-grid">
        <button
          v-for="item in hits"
          :key="item.id"
          class="result-card"
          :title="item.id"
          type="button"
          @click="emit('select', item.id)"
        >
          <span class="card-label">{{ item.label }}</span>
          <span class="card-path">{{ item.id }}</span>
          <span
            v-if="item.usage"
            class="card-usage"
          >
            项目中使用 {{ item.usage }} 处
          </span>
        </button>
      </div>
    </template>
    <div
      v-else
      class="result-empty"
    >
      <span class="empty-icon">⌕</span>
      <p>没有找到匹配的组件</p>
      <small>{{ emptyHint }}</small>
      <button
        class="empty-reset"
        type="button"
        @click="emit('clear')"
      >
        清空搜索
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ComponentNavItem } from '../config/components';

  defineProps<{ emptyHint?: string; hits: ComponentNavItem[] }>();

  const emit = defineEmits<{ clear: []; select: [id: string] }>();
</script>

<style scoped>
  .component-results {
    padding-top: 72px;
  }

  .result-count {
    padding: 0 16px;
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--pal-text-body);
  }

  .result-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .result-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    padding: 14px 16px;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .result-card:hover {
    border-color: var(--pal-brand);
    box-shadow: 0 2px 8px var(--pal-shadow-popover);
  }

  .card-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .card-path {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--pal-text-body);
    white-space: nowrap;
  }

  .card-usage {
    font-size: 12px;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .result-empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    padding: 96px 0;
    color: var(--pal-text-muted, var(--pal-text-body));
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    line-height: 1;
  }

  .result-empty p {
    margin: 0;
    font-size: 16px;
    color: var(--pal-text-body);
  }

  .result-empty small {
    font-size: 13px;
  }

  .empty-reset {
    padding: 6px 18px;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--pal-brand);
    cursor: pointer;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-brand);
    border-radius: 4px;
  }

  .empty-reset:hover {
    background: var(--pal-bg-active);
  }
</style>
