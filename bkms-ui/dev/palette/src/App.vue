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
  <div
    class="palette"
    :class="{
      'is-aside-collapsed': isAsideCollapsed,
      'is-component': viewMode === 'component',
      'is-focus': isFocus,
      'is-searching': isSearching,
    }"
  >
    <PaletteAside
      ref="asideRef"
      :active-id="sidebarActiveId"
      :collapsed="isAsideCollapsed"
      :description="sidebarDescription"
      :sections="sidebarSections"
      :title="viewTitle"
      @navigate="navigate"
    >
      <template #section-tool="{ section }">
        <ComponentSort
          v-if="viewMode === 'component' && section.label === '业务组件'"
          v-model="componentSort"
        />
      </template>
    </PaletteAside>

    <main
      ref="mainRef"
      class="palette-main"
    >
      <div class="palette-toolbar">
        <ViewTabs
          :active="viewMode"
          :tabs="viewTabs"
          @change="switchView"
        />
        <SearchBar
          v-if="!isFocus"
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
        />
      </div>

      <SearchResults
        v-if="isSearching && viewMode !== 'component'"
        :blocks="searchBlocks"
        :empty-hint="searchEmptyHint"
        @clear="searchQuery = ''"
        @copy="copy"
      />

      <ComponentSearchResults
        v-if="isSearching && viewMode === 'component'"
        :empty-hint="searchEmptyHint"
        :hits="componentSearchHits"
        @clear="searchQuery = ''"
        @select="selectComponent"
      />

      <RouterView
        v-if="hasPaletteRouter && !isSearching"
        v-slot="{ Component }"
      >
        <component
          :is="Component"
          :focus-id="focusId"
          @copy="copy"
          @toggle-focus="toggleFocus"
        >
          <template #component-preview>
            <slot name="component-preview" />
          </template>
        </component>
      </RouterView>
      <component
        :is="fallbackPage"
        v-else-if="!isSearching"
        :focus-id="focusId"
        @copy="copy"
        @toggle-focus="toggleFocus"
      >
        <template #component-preview>
          <slot name="component-preview" />
        </template>
      </component>
    </main>

    <Toast :text="copied" />

    <AdvisorFab @copy="copy" />
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';

  import { useRoute, useRouter } from 'vue-router';

  import AdvisorFab from './components/AdvisorFab.vue';
  import ComponentSearchResults from './components/ComponentSearchResults.vue';
  import ComponentSort from './components/ComponentSort.vue';
  import PaletteAside from './components/PaletteAside.vue';
  import SearchBar from './components/SearchBar.vue';
  import SearchResults from './components/SearchResults.vue';
  import Toast from './components/Toast.vue';
  import ViewTabs from './components/ViewTabs.vue';
  import { viewConfig, viewTabs } from './config';
  import { type ComponentSortMode, componentNavItems, matchComponents, sortByUsage } from './config/components';
  import ColorPage from './pages/ColorPage.vue';
  import ComponentPage from './pages/ComponentPage.vue';
  import RadiusPage from './pages/RadiusPage.vue';
  import VizPage from './pages/VizPage.vue';
  import { type PaletteView, paletteViews } from './router';
  import { searchTokens } from './util/search';
  import { allSemanticGroups, radiusGroups, rampGroups, vizGroups } from './util/tokens';

  import './styles/main.css';
  import './styles/shell.css';

  const route = useRoute();
  const router = useRouter();
  const slots = useSlots();
  const hasPaletteRouter = !!router && paletteViews.every(view => router.hasRoute(view));
  const localView = ref<PaletteView>('color');

  const viewMode = computed<PaletteView>(() => {
    if (hasPaletteRouter && route && paletteViews.includes(route.name as PaletteView)) {
      return route.name as PaletteView;
    }
    const view = route?.query.view;
    return typeof view === 'string' && paletteViews.includes(view as PaletteView)
      ? (view as PaletteView)
      : localView.value;
  });
  const modulePages = {
    color: ColorPage,
    radius: RadiusPage,
    viz: VizPage,
    component: ComponentPage,
  };
  const fallbackPage = computed(() => modulePages[viewMode.value]);
  const activeConfig = computed(() => viewConfig[viewMode.value]);
  const viewTitle = computed(() => activeConfig.value.title);
  const sidebarDescription = computed(() => activeConfig.value.description);
  const asideRef = ref<InstanceType<typeof PaletteAside> | null>(null);
  const searchQuery = ref('');
  const isSearching = computed(() => searchQuery.value.trim().length > 0);
  const componentSort = ref<ComponentSortMode>('default');
  const sidebarSections = computed(() => {
    if (viewMode.value === 'component' && !slots['component-preview']) return [];
    if (viewMode.value !== 'component') return activeConfig.value.sections;
    return activeConfig.value.sections.map(section => ({
      ...section,
      groups: sortByUsage(section.groups, componentSort.value),
    }));
  });

  /** 组件预览没有 token 概念，按组件 id / 名称匹配，结果由独立结果页渲染 */
  const componentSearchHits = computed(() =>
    sortByUsage(matchComponents(componentNavItems, searchQuery.value), componentSort.value),
  );

  const activeId = ref('');

  const componentIds = componentNavItems.map(item => item.id);
  const componentId = computed(() => {
    const query = route?.query.component;
    if (typeof query === 'string' && componentIds.includes(query)) return query;
    return componentIds[0] ?? '';
  });
  const sidebarActiveId = computed(() => (viewMode.value === 'component' ? componentId.value : activeId.value));

  const mainRef = ref<HTMLElement | null>(null);
  const allGroups = computed(() => activeConfig.value.groups);
  const sectionIds = computed(() => allGroups.value.map(group => group.id));
  let clickLockId = '';

  const copied = ref('');
  const searchHits = computed(() => searchTokens(allGroups.value, searchQuery.value));
  const searchBlocks = computed(() => activeConfig.value.buildSearchBlocks(searchHits.value));
  const searchPlaceholder = computed(() => activeConfig.value.searchPlaceholder);
  const searchEmptyHint = computed(() => activeConfig.value.searchEmptyHint);
  let copyTimer = 0;
  let scrollTimer = 0;

  function copy(text: string): void {
    navigator.clipboard?.writeText(text).catch(() => {});
    copied.value = text;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      copied.value = '';
    }, 1400);
  }

  const focusId = ref<null | string>(null);
  const isFocus = computed(() => focusId.value !== null);
  /** 聚焦或搜索时收起侧栏，主区域全屏展示结果，各视图行为一致 */
  const isAsideCollapsed = computed(() => isFocus.value || isSearching.value);
  let scrollBeforeFocus = 0;

  /** 取顶部距容器上沿最近的分组；已到底部时取末尾分组（末尾分组无法滚到上沿） */
  function computeActive(): string {
    const container = mainRef.value;
    if (!container) return '';
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
      return sectionIds.value[sectionIds.value.length - 1];
    }
    const containerTop = container.getBoundingClientRect().top;
    let best = sectionIds.value[0];
    let bestDist = Infinity;
    for (const id of sectionIds.value) {
      const el = document.getElementById(id);
      if (!el) continue;
      const dist = Math.abs(el.getBoundingClientRect().top - containerTop);
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }
    return best;
  }

  function navigate(id: string): void {
    if (viewMode.value === 'component') {
      router.replace({ query: { ...route.query, component: id } });
      return;
    }
    scrollTo(id);
  }

  function onScroll(): void {
    if (!clickLockId) activeId.value = computeActive();
  }

  function onUserScroll(): void {
    if (!clickLockId) return;
    clickLockId = '';
    activeId.value = computeActive();
  }

  function readFocus(): void {
    const label = route?.query.focus;
    if (typeof label !== 'string' || !label) return;
    const group = [...rampGroups, ...allSemanticGroups, ...radiusGroups, ...vizGroups].find(
      item => item.label === label,
    );
    if (!group) return;
    const name: PaletteView = radiusGroups.includes(group) ? 'radius' : vizGroups.includes(group) ? 'viz' : 'color';
    if (hasPaletteRouter && router) {
      if (name !== viewMode.value) router.replace({ name, query: route.query });
    } else if (router) {
      router.replace({ query: { ...route.query, view: name } });
    } else {
      localView.value = name;
    }
    focusId.value = group.id;
  }

  if (router) router.isReady().then(readFocus);
  else readFocus();

  function scrollTo(id: string): void {
    const container = mainRef.value;
    const target = document.getElementById(id);
    if (!container || !target) return;
    clickLockId = id;
    activeId.value = id;
    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
  }

  /** 组件搜索结果点击：切到该组件、退出搜索态，并让侧栏同步滚到该项 */
  async function selectComponent(id: string): Promise<void> {
    navigate(id);
    searchQuery.value = '';
    await nextTick();
    // 侧栏展开有 0.3s 过渡，须等布局稳定后再定位，否则可用高度仍在变化，滚动量会算偏
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => asideRef.value?.scrollToItem(id), 320);
  }

  async function switchView(mode: PaletteView): Promise<void> {
    if (viewMode.value === mode) return;
    searchQuery.value = '';
    focusId.value = null;
    if (hasPaletteRouter && router) await router.push({ name: mode, query: {} });
    else if (router) await router.replace({ query: { view: mode } });
    else localView.value = mode;
    await nextTick();
    if (mainRef.value) mainRef.value.scrollTop = 0;
    activeId.value = computeActive();
  }

  function toggleFocus(id: string): void {
    searchQuery.value = '';
    if (!isFocus.value) scrollBeforeFocus = mainRef.value?.scrollTop ?? 0;
    focusId.value = focusId.value === id ? null : id;
    const group = allGroups.value.find(item => item.id === focusId.value);
    if (router) {
      const query = { ...route.query };
      if (group) query.focus = group.label;
      else delete query.focus;
      router.replace({ query });
    }
    nextTick(() => {
      if (!isFocus.value && mainRef.value) mainRef.value.scrollTop = scrollBeforeFocus;
      activeId.value = computeActive();
    });
  }

  watch(
    () => [route?.query.view, route?.query.focus, route?.query.component],
    () => {
      if (hasPaletteRouter || window.parent === window) return;
      window.parent.postMessage(
        {
          type: 'palette-query-sync',
          view: typeof route?.query.view === 'string' ? route.query.view : null,
          focus: typeof route?.query.focus === 'string' ? route.query.focus : null,
          component: typeof route?.query.component === 'string' ? route.query.component : null,
        },
        window.location.origin,
      );
    },
  );

  onMounted(() => {
    activeId.value = computeActive();
    mainRef.value?.addEventListener('scroll', onScroll, { passive: true });
    mainRef.value?.addEventListener('wheel', onUserScroll, { passive: true });
    mainRef.value?.addEventListener('touchmove', onUserScroll, { passive: true });
    // 直接带 component 参数刷新时，左侧菜单要停在当前组件上；
    // 侧栏展开有 0.3s 过渡，与搜索结果跳转一样等布局稳定后再定位
    if (viewMode.value === 'component' && componentId.value) {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => asideRef.value?.scrollToItem(componentId.value), 320);
    }
  });

  onBeforeUnmount(() => {
    window.clearTimeout(copyTimer);
    window.clearTimeout(scrollTimer);
    mainRef.value?.removeEventListener('scroll', onScroll);
    mainRef.value?.removeEventListener('wheel', onUserScroll);
    mainRef.value?.removeEventListener('touchmove', onUserScroll);
  });
</script>
