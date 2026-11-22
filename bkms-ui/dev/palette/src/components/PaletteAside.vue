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
  <aside
    class="palette-aside"
    :class="{ 'is-collapsed': collapsed }"
  >
    <PaletteSidebar
      ref="sidebarRef"
      :active-id="activeId"
      :description="description"
      :sections="sections"
      :title="title"
      @navigate="emit('navigate', $event)"
    >
      <template #section-tool="slotProps">
        <slot
          name="section-tool"
          v-bind="slotProps"
        />
      </template>
    </PaletteSidebar>
  </aside>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import PaletteSidebar from './PaletteSidebar.vue';

  import type { SidebarSection } from '../config';

  defineProps<{
    activeId: string;
    collapsed: boolean;
    description: string;
    sections: SidebarSection[];
    title: string;
  }>();

  const emit = defineEmits<{ navigate: [id: string] }>();

  const sidebarRef = ref<InstanceType<typeof PaletteSidebar> | null>(null);

  /** 透传侧栏的条目定位能力，供上层在搜索结果跳转后同步滚动 */
  defineExpose({
    scrollToItem: (id: string, behavior?: ScrollBehavior) => sidebarRef.value?.scrollToItem(id, behavior),
  });
</script>

<style scoped>
  /* 侧栏本身不滚动：标题区固定，仅内部列表 .palette-nav 滚动 */
  .palette-aside {
    position: sticky;
    top: 0;
    z-index: 2;
    box-sizing: border-box;
    display: flex;
    flex: none;
    flex-direction: column;
    width: 280px;
    height: 100%;
    padding: 28px 16px;
    overflow: hidden;
    background: var(--pal-bg-head);
    border-right: 1px solid var(--pal-line);
    transition:
      width 0.3s ease,
      padding 0.3s ease;
  }

  .palette-aside.is-collapsed {
    width: 0;
    padding-right: 0;
    padding-left: 0;
    border-right: none;
  }

  /* 折叠时保持内容宽度（= 展开态内容宽 280 - 16 * 2）：
     宽度归零会让列表文字整体折行，条目高度剧变，
     既造成展开瞬间的抖动，也会让跳转定位算错 */
  .palette-aside.is-collapsed :deep(.palette-head),
  .palette-aside.is-collapsed :deep(.palette-nav) {
    min-width: calc(280px - 16px * 2);
  }
</style>
