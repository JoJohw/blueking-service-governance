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
  <header class="palette-head">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </header>

  <nav
    v-if="sections.length"
    ref="navRef"
    class="palette-nav"
  >
    <!-- 每个分组独立包裹：吸顶标题的吸附范围限于本分组，滚出时被下一组顶走 -->
    <div
      v-for="section in sections"
      :key="section.label"
      class="nav-section"
    >
      <div class="nav-label">
        <span>{{ section.label }}</span>
        <slot
          name="section-tool"
          :section="section"
        />
      </div>
      <a
        v-for="group in section.groups"
        :key="`nav-${group.id}`"
        :class="{ 'is-active': activeId === group.id }"
        :data-nav-id="group.id"
        href="javascript:void(0)"
        :title="group.id"
        @click="emit('navigate', group.id)"
      >
        <span class="nav-item-label">{{ group.label }}</span>
        <span
          v-if="group.usage !== undefined"
          class="nav-usage-tag"
          :title="`在项目中使用 ${group.usage} 处`"
        >
          {{ group.usage }}
        </span>
      </a>
    </div>
  </nav>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import type { SidebarSection } from '../config';

  defineProps<{
    activeId: string;
    description: string;
    sections: SidebarSection[];
    title: string;
  }>();

  const emit = defineEmits<{ navigate: [id: string] }>();

  const navRef = ref<HTMLElement | null>(null);

  /**
   * 把侧栏列表滚动到指定条目，供搜索结果跳转后同步定位。
   * 顶部对齐并让出吸顶分组标题的高度，否则目标项会被标题盖住；
   * 目标靠近列表末尾时由浏览器自动收敛到底部。
   */
  function scrollToItem(id: string): void {
    const nav = navRef.value;
    if (!nav) return;
    const item = nav.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(id)}"]`);
    if (!item) return;
    const stickyHeight = nav.querySelector<HTMLElement>('.nav-label')?.offsetHeight ?? 0;
    const offset = item.getBoundingClientRect().top - nav.getBoundingClientRect().top;
    nav.scrollTop += offset - stickyHeight - 8;
  }

  defineExpose({ scrollToItem });
</script>

<style scoped>
  .palette-head {
    flex: none;
  }

  .palette-head h1 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .palette-head p {
    height: 60px;
    margin: 0;
    font-size: 13px;
    line-height: 20px;
    color: var(--pal-text-body);
  }

  /* 列表自身滚动，标题区不跟随；scrollbar-gutter 预留槽位避免出现滚动条时宽度抖动 */
  .palette-nav {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    margin-top: 12px;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .nav-section {
    display: flex;
    flex-direction: column;
  }

  /* 分组标题在侧栏滚动时吸顶，不随分组列表一起滚走 */
  .nav-label {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px 6px;
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--pal-text-title);
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--pal-bg-head);
    border-bottom: 1px solid var(--pal-line);
  }

  .palette-nav a {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    font-size: 14px;
    color: var(--pal-text-body);
    text-decoration: none;
    border-left: 2px solid transparent;
    border-start-start-radius: 0;
    border-start-end-radius: 3px;
    border-end-start-radius: 0;
    border-end-end-radius: 3px;
  }

  .palette-nav a:hover {
    background: var(--pal-bg-hover);
  }

  .palette-nav a.is-active {
    font-weight: 600;
    color: var(--pal-brand);
    background: var(--pal-bg-active);
    border-left-color: var(--pal-brand);
  }

  .nav-item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-usage-tag {
    flex: none;
    min-width: 20px;
    padding: 0 6px;
    font-size: 11px;
    line-height: 18px;
    color: var(--pal-text-body);
    text-align: center;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 9px;
  }

  .palette-nav a.is-active .nav-usage-tag {
    color: var(--pal-brand);
    border-color: var(--pal-brand);
  }
</style>
