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
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
-->
<template>
  <Teleport to="body">
    <button
      v-if="!panelVisible"
      class="fixed bottom-[20px] right-[20px] z-[9998] cursor-pointer rounded-bkms-full border-[1px] bkms-line-default bkms-bg-card px-[14px] py-[8px] text-[12px] bkms-text-title shadow-[0_4px_16px_var(--bkms-shadow-hover)]"
      data-element-inspector
      type="button"
      @click="handleTogglePanel"
    >
      ⌖ 元素审查
    </button>

    <div
      v-if="panelVisible"
      ref="panelRef"
      class="fixed z-[9999] flex max-h-[70vh] w-[320px] flex-col overflow-hidden rounded-bkms-card border-[1px] bkms-line-default bkms-bg-card text-[12px] bkms-text-body shadow-[0_8px_24px_var(--bkms-shadow-popover)]"
      data-element-inspector
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <div
        class="flex cursor-move items-center justify-between border-b-[1px] bkms-line-default px-[12px] py-[8px]"
        @pointercancel="onPointerUp"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      >
        <span class="font-bold bkms-text-title">元素审查</span>
        <button
          class="cursor-pointer border-none bg-transparent text-[16px] leading-none bkms-text-secondary"
          type="button"
          @click="handleTogglePanel"
        >
          ×
        </button>
      </div>

      <div class="flex items-center gap-[8px] px-[12px] py-[8px]">
        <button
          class="cursor-pointer rounded-bkms-control bg-bkms-brand-2 px-[8px] py-[4px] text-[12px] bkms-text-inverse"
          type="button"
          @click="handleTogglePick"
        >
          {{ picking ? '退出选取 (Esc)' : '⌖ 选取元素' }}
        </button>
        <span class="truncate text-[11px] bkms-text-secondary">
          {{ selected ? selected.name : '点页面节点查看属性' }}
        </span>
      </div>

      <div v-if="selected">
        <div class="truncate px-[12px] pb-[6px] text-[10px] bkms-text-secondary">
          {{ breadcrumb }}
        </div>
        <div class="mx-[12px] max-h-[160px] overflow-y-auto rounded-bkms-card border-[1px] bkms-line-default">
          <div
            v-for="node in visibleNodes"
            :key="node.id"
            class="flex h-[22px] cursor-pointer items-center gap-[5px] whitespace-nowrap px-[6px]"
            :class="selected?.id === node.id ? 'bkms-bg-active bkms-text-brand' : 'hover:bkms-bg-page'"
            :style="{ paddingLeft: `${8 + node.depth * 12}px` }"
            @click="handleSelectNode(node)"
            @mouseenter="hoverId = node.id"
            @mouseleave="hoverId = null"
          >
            <span
              class="w-[10px] shrink-0 text-[10px] bkms-text-secondary"
              :style="{ transform: expanded.has(node.id) ? 'rotate(90deg)' : 'none' }"
              @click.stop="handleToggleExpand(node.id)"
              >›</span
            >
            <span class="w-[12px] shrink-0 text-center text-[10px] bkms-text-secondary">{{
              ICON_CHAR[node.icon]
            }}</span>
            <span class="truncate">{{ node.name }}</span>
          </div>
        </div>

        <div class="max-h-[240px] overflow-y-auto px-[12px] py-[8px]">
          <div
            v-for="row in props"
            :key="row.label"
            class="flex flex-wrap items-center gap-[6px] border-b-[1px] bkms-line-default py-[5px]"
          >
            <span class="w-[48px] shrink-0 bkms-text-secondary">{{ row.label }}</span>
            <span class="flex items-center gap-[6px] font-mono">
              <i
                v-if="row.swatch"
                class="inline-block h-[12px] w-[12px] rounded-bkms-tag border-[1px] bkms-line-default"
                :style="{ background: row.swatch }"
              ></i>
              {{ row.value }}
            </span>
            <span
              v-if="row.token"
              class="rounded-bkms-tag px-[4px] text-[10px]"
              :class="
                row.warn
                  ? 'bkms-bg-danger bkms-text-body'
                  : row.near
                    ? 'bkms-bg-warning bkms-text-body'
                    : 'bkms-bg-active bkms-text-brand'
              "
            >
              {{ row.token }}
            </span>
            <span
              v-else-if="row.warn"
              class="rounded-bkms-tag bkms-bg-danger px-[4px] text-[10px] bkms-text-body"
              >未命中档位</span
            >
          </div>
        </div>
      </div>

      <div
        v-else
        class="px-[12px] py-[16px] bkms-text-secondary"
      >
        点「选取元素」后在页面里点任意节点，可查看图层层级与设计属性。
      </div>
    </div>

    <div
      v-if="box"
      class="pointer-events-none fixed z-[9997] border-[1px] border-bkms-brand-2"
      data-element-inspector
      :style="boxStyle"
    >
      <i class="absolute -left-[4px] -top-[4px] h-[6px] w-[6px] border-[1px] border-bkms-brand-2 bg-white"></i>
      <i class="absolute -right-[4px] -top-[4px] h-[6px] w-[6px] border-[1px] border-bkms-brand-2 bg-white"></i>
      <i class="absolute -bottom-[4px] -left-[4px] h-[6px] w-[6px] border-[1px] border-bkms-brand-2 bg-white"></i>
      <i class="absolute -bottom-[4px] -right-[4px] h-[6px] w-[6px] border-[1px] border-bkms-brand-2 bg-white"></i>
      <span
        class="absolute -bottom-[19px] right-[-1px] bg-bkms-brand-2 px-[5px] text-[10px] leading-[16px] bkms-text-inverse"
        >{{ `${Math.round(box.width)} × ${Math.round(box.height)}` }}</span
      >
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

  import { useDrag } from '@root/dev/palette/src/util/useDrag';
  import { type LayerIcon, type LayerNode, buildTree, describe } from '~/utils/element-inspector';

  interface Box {
    height: number;
    left: number;
    top: number;
    width: number;
  }

  const ICON_CHAR: Record<LayerIcon, string> = { frame: '▣', group: '▤', image: '▧', rect: '▢', text: 'T' };
  const INSPECTOR_SELECTOR = '[data-element-inspector]';

  // ref
  const panelRef = ref<HTMLElement | null>(null);

  // hooks
  const { onPointerDown, onPointerMove, onPointerUp, pos } = useDrag({ target: panelRef });

  // ref
  const panelVisible = ref(false);
  const picking = ref(false);
  const nodes = ref<LayerNode[]>([]);
  const byId = ref(new Map<number, LayerNode>());
  const expanded = ref(new Set<number>());
  const hoverId = ref<null | number>(null);
  const selectedId = ref<null | number>(null);
  const tick = ref(0);
  const elToNode = new Map<HTMLElement, LayerNode>();

  // computed
  const visibleNodes = computed(() => {
    const result: LayerNode[] = [];
    const walk = (node: LayerNode): void => {
      result.push(node);
      if (expanded.value.has(node.id)) node.children.forEach(walk);
    };
    nodes.value.filter(node => node.depth === 0).forEach(walk);
    return result;
  });

  const selected = computed(() => (selectedId.value === null ? null : (byId.value.get(selectedId.value) ?? null)));

  const activeEl = computed(() => {
    if (hoverId.value !== null) return byId.value.get(hoverId.value)?.el ?? null;
    return selected.value?.el ?? null;
  });

  const box = computed<Box | null>(() => {
    void tick.value;
    const el = activeEl.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { height: rect.height, left: rect.left, top: rect.top, width: rect.width };
  });

  const boxStyle = computed(() => {
    const value = box.value;
    if (!value) return {};
    return {
      height: `${value.height}px`,
      left: `${value.left}px`,
      top: `${value.top}px`,
      width: `${value.width}px`,
    };
  });

  const props = computed(() => {
    void tick.value;
    return selected.value ? describe(selected.value.el) : [];
  });

  const breadcrumb = computed(() => {
    const chain: string[] = [];
    let current = selected.value;
    while (current) {
      chain.unshift(current.name);
      current = current.parent === null ? null : (byId.value.get(current.parent) ?? null);
    }
    return chain.join(' / ');
  });

  function findNode(target: HTMLElement): LayerNode | null {
    let el: HTMLElement | null = target;
    while (el) {
      const node = elToNode.get(el);
      if (node) return node;
      el = el.parentElement;
    }
    return null;
  }

  function handleDocumentClick(event: MouseEvent): void {
    if (!picking.value) return;
    const target = event.target as HTMLElement;
    if (target.closest(INSPECTOR_SELECTOR)) return;
    event.preventDefault();
    event.stopPropagation();
    const node = findNode(target);
    if (node) handleSelectNode(node);
  }

  function handleDocumentMove(event: MouseEvent): void {
    if (!picking.value) return;
    const target = event.target as HTMLElement;
    hoverId.value = target.closest(INSPECTOR_SELECTOR) ? null : (findNode(target)?.id ?? null);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (picking.value) {
      picking.value = false;
      hoverId.value = null;
      return;
    }
    panelVisible.value = false;
  }

  function handleRefresh(): void {
    tick.value += 1;
  }

  function handleSelectNode(node: LayerNode): void {
    selectedId.value = node.id;
    let parent = node.parent;
    while (parent !== null) {
      expanded.value.add(parent);
      parent = byId.value.get(parent)?.parent ?? null;
    }
    picking.value = false;
    hoverId.value = null;
  }

  function handleToggleExpand(id: number): void {
    if (expanded.value.has(id)) expanded.value.delete(id);
    else expanded.value.add(id);
  }

  function handleTogglePanel(): void {
    panelVisible.value = !panelVisible.value;
    if (!panelVisible.value) {
      picking.value = false;
      hoverId.value = null;
      return;
    }
    pos.value = {
      x: Math.min(pos.value.x, Math.max(12, window.innerWidth - 332)),
      y: Math.min(pos.value.y, Math.max(12, window.innerHeight - 480)),
    };
    rebuildTree();
  }

  function handleTogglePick(): void {
    picking.value = !picking.value;
    if (picking.value) rebuildTree();
    else hoverId.value = null;
  }

  // function
  function rebuildTree(): void {
    const root = document.getElementById('app');
    if (!root) return;
    nodes.value = buildTree(root);
    byId.value = new Map(nodes.value.map(node => [node.id, node]));
    elToNode.clear();
    nodes.value.forEach(node => elToNode.set(node.el, node));
    expanded.value = new Set(nodes.value.filter(node => node.depth < 2).map(node => node.id));
  }

  // 生命周期
  onMounted(() => {
    pos.value = { x: Math.max(12, window.innerWidth - 332), y: 72 };
    document.addEventListener('mousemove', handleDocumentMove, true);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', handleRefresh, true);
    window.addEventListener('resize', handleRefresh);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleDocumentMove, true);
    document.removeEventListener('click', handleDocumentClick, true);
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('scroll', handleRefresh, true);
    window.removeEventListener('resize', handleRefresh);
  });
</script>
