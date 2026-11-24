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
    <template v-if="themes && themes.length > 1">
      <span class="view-tabs-divider" />
      <div
        ref="themeRef"
        class="view-tabs-theme"
      >
        <button
          :aria-expanded="open"
          aria-label="词典主题"
          class="theme-trigger"
          :class="{ 'is-active': open }"
          type="button"
          @click="open = !open"
        >
          {{ currentLabel }}
          <span
            class="view-tabs-caret"
            :class="{ 'is-open': open }"
          />
        </button>
        <div
          v-if="open"
          class="theme-menu"
        >
          <button
            v-for="theme in themes"
            :key="theme.id"
            :class="{ 'is-active': activeTheme === theme.id }"
            type="button"
            @click="selectTheme(theme.id)"
          >
            {{ theme.label }}
          </button>
        </div>
      </div>
    </template>
  </nav>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

  import type { PaletteView } from '../router';
  import type { PaletteThemeId, PaletteThemeOption } from '../util/tokens';

  const props = defineProps<{
    active: PaletteView;
    activeTheme?: PaletteThemeId;
    tabs: { label: string; value: PaletteView }[];
    themes?: PaletteThemeOption[];
  }>();

  const emit = defineEmits<{
    change: [value: PaletteView];
    themeChange: [value: PaletteThemeId];
  }>();

  const open = ref(false);
  const themeRef = ref<HTMLElement | null>(null);
  const currentLabel = computed(() => props.themes?.find(theme => theme.id === props.activeTheme)?.label ?? '');

  function onDocumentClick(event: MouseEvent): void {
    if (themeRef.value && !themeRef.value.contains(event.target as Node)) open.value = false;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') open.value = false;
  }

  function selectTheme(id: PaletteThemeId): void {
    open.value = false;
    emit('themeChange', id);
  }

  onMounted(() => {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown);
  });
</script>

<style scoped>
  .view-tabs {
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

  .view-tabs-divider {
    width: 1px;
    margin: 6px 2px;
    background: var(--pal-line);
  }

  .view-tabs-theme {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .view-tabs-theme button:hover {
    transform: none;
  }

  .theme-trigger {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    padding: 6px 10px;
  }

  .view-tabs-caret {
    width: 5px;
    height: 5px;
    border-right: 1.5px solid currentcolor;
    border-bottom: 1.5px solid currentcolor;
    transform: rotate(45deg) translateY(-2px);
    transition: transform 0.2s ease;
  }

  .view-tabs-caret.is-open {
    transform: rotate(225deg) translateY(-2px);
  }

  .theme-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 132px;
    padding: 6px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 10px;
    box-shadow: 0 8px 24px var(--pal-shadow-popover);
  }

  .view-tabs-theme .theme-menu button {
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    border-radius: 6px;
  }

  .view-tabs-theme .theme-menu button.is-active {
    color: var(--pal-brand);
    background: var(--pal-bg-active);
    box-shadow: none;
  }
</style>
