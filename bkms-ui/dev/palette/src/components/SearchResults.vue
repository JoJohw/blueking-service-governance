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
  <div class="search-results">
    <template v-if="blocks.length">
      <p class="search-result-count">找到 {{ count }} 个 token</p>
      <section
        v-for="block in blocks"
        :key="block.key"
        class="search-block"
      >
        <h3 class="search-block-title">
          {{ block.title }} <span>{{ block.hits.length }}</span>
        </h3>
        <div class="search-grid">
          <TokenCell
            v-for="hit in block.hits"
            :key="hit.token.name"
            :token="hit.token"
            :variant="block.variant"
            @copy="emit('copy', $event)"
          />
        </div>
      </section>
    </template>
    <div
      v-else
      class="search-empty"
    >
      <span class="search-empty-icon">⌕</span>
      <p>没有找到匹配的 token</p>
      <small>{{ emptyHint }}</small>
      <button
        class="search-empty-reset"
        type="button"
        @click="emit('clear')"
      >
        清空搜索
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import TokenCell from './TokenCell.vue';

  import type { SearchBlock } from '../util/search';

  const props = defineProps<{ blocks: SearchBlock[]; emptyHint?: string }>();
  const emit = defineEmits<{ clear: []; copy: [text: string] }>();

  const count = computed(() => props.blocks.reduce((sum, block) => sum + block.hits.length, 0));
</script>

<style scoped>
  .search-results {
    padding-top: 72px;
  }

  .search-result-count {
    padding: 0 16px;
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--pal-text-body);
  }

  .search-block + .search-block {
    margin-top: 24px;
  }

  .search-block-title {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 0 16px;
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .search-block-title span {
    font-size: 12px;
    font-weight: 400;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .search-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .search-grid > :deep(.token-card-wrap) {
    width: auto;
  }

  .search-empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    padding: 96px 0;
    color: var(--pal-text-muted, var(--pal-text-body));
    text-align: center;
  }

  .search-empty-icon {
    font-size: 48px;
    line-height: 1;
  }

  .search-empty p {
    margin: 0;
    font-size: 16px;
    color: var(--pal-text-body);
  }

  .search-empty small {
    font-size: 13px;
  }

  .search-empty-reset {
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

  .search-empty-reset:hover {
    background: var(--pal-bg-active);
  }
</style>
