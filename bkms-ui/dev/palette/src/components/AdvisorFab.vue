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
  <button
    ref="fabRef"
    class="advisor-fab"
    :class="{ 'is-open': open, 'is-dragging': dragging }"
    :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }"
    :title="open ? '关闭色值建议' : '色值建议'"
    type="button"
    @click="onFabClick"
    @pointercancel="onFabUp"
    @pointerdown="onFabDown"
    @pointermove="onFabMove"
    @pointerup="onFabUp"
  >
    <span class="fab-icon">✦</span>
    <span class="fab-label">色值建议</span>
  </button>

  <ColorAdvisor
    :anchor="pos"
    :open="open"
    @copy="emit('copy', $event)"
    @update:open="open = $event"
  />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  import { useDrag } from '../util/useDrag';
  import ColorAdvisor from './ColorAdvisor.vue';

  const emit = defineEmits<{ copy: [text: string] }>();

  const open = ref(false);
  const fabRef = ref<HTMLElement | null>(null);
  const {
    pos,
    dragging,
    moved,
    onPointerDown: onFabDown,
    onPointerMove: onFabMove,
    onPointerUp: onFabUp,
  } = useDrag({ ignoreButtons: false, target: fabRef });

  function onFabClick(): void {
    if (moved.value) {
      moved.value = false;
      return;
    }
    open.value = !open.value;
  }

  onMounted(() => {
    const fab = fabRef.value;
    if (!fab) return;
    pos.value = {
      x: Math.max(12, window.innerWidth - fab.offsetWidth - 24),
      y: Math.max(12, window.innerHeight - fab.offsetHeight - 24),
    };
  });
</script>

<style scoped>
  .advisor-fab {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 40;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 7px 18px 7px 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--pal-text-inverse);
    touch-action: none;
    cursor: grab;
    user-select: none;
    background: var(--pal-brand);
    border: none;
    border-radius: 26px;
    box-shadow: var(--pal-shadow-popover);
    transition:
      transform 0.2s ease,
      background 0.2s ease;
  }

  .advisor-fab:hover,
  .advisor-fab.is-open {
    background: var(--pal-brand-deep);
  }

  .advisor-fab.is-dragging {
    cursor: grabbing;
    opacity: 0.9;
    transition: none;
  }

  .fab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 17px;
    line-height: 1;
    color: var(--pal-brand);
    background: var(--pal-text-inverse);
    border-radius: 50%;
  }

  .fab-label {
    color: var(--pal-text-inverse);
  }
</style>
