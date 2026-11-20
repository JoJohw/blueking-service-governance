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
  <TransitionGroup
    class="section-list"
    name="section"
    tag="div"
  >
    <SectionPanel
      v-for="group in groups"
      :id="group.id"
      :key="group.id"
      :count="group.tokens.length"
      :focus="isFocus"
      :note="group.note"
      :title="group.label"
    >
      <template #tools>
        <button
          class="focus-toggle"
          type="button"
          @click="emit('toggleFocus', group.id)"
        >
          {{ focusId === group.id ? '退出专注' : '专注模式' }}
        </button>
      </template>
      <TransitionGroup
        class="ramp"
        :class="{ 'ramp-grid': isFocus }"
        name="card"
        tag="div"
      >
        <TokenCell
          v-for="token in group.tokens"
          :key="token.name"
          :token="token"
          :variant="variant"
          @copy="emit('copy', $event)"
        />
      </TransitionGroup>
    </SectionPanel>
  </TransitionGroup>
</template>

<script setup lang="ts">
  import SectionPanel from '../components/SectionPanel.vue';
  import TokenCell from '../components/TokenCell.vue';

  import type { Group } from '../util/tokens';

  defineProps<{
    focusId: null | string;
    groups: Group[];
    isFocus: boolean;
    variant: 'ramp' | 'semantic';
  }>();

  const emit = defineEmits<{
    copy: [text: string];
    toggleFocus: [id: string];
  }>();
</script>

<style scoped>
  .section-list {
    padding-top: 8px;
  }

  .ramp {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }

  .ramp-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ramp-grid > :deep(.token-card-wrap) {
    width: auto;
  }

  .focus-toggle {
    padding: 5px 14px;
    font-size: 13px;
    color: var(--pal-brand);
    cursor: pointer;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-brand);
    border-radius: 4px;
  }

  .focus-toggle:hover {
    background: var(--pal-bg-active);
  }

  .section-move,
  .section-enter-active,
  .section-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .section-enter-from,
  .section-leave-to {
    opacity: 0;
    transform: translateY(-12px);
  }

  .section-leave-active {
    position: absolute;
  }

  .card-move {
    transition: transform 0.35s ease;
  }

  .card-enter-active,
  .card-leave-active {
    transition: opacity 0.3s ease;
  }

  .card-enter-from,
  .card-leave-to {
    opacity: 0;
  }
</style>
