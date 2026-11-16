<template>
  <div
    class="palette"
    :class="{ 'is-focus': isFocus, 'is-searching': isSearching }"
  >
    <aside class="palette-aside">
      <header class="palette-head">
        <h1>BKMS 主题色板</h1>
        <p>源自 <code>colors.css</code> / <code>semantic.css</code>。点色块复制 <code>var()</code>。</p>
      </header>

      <nav class="palette-nav">
        <p class="nav-label">色阶</p>
        <a
          v-for="group in rampGroups"
          :key="`nav-${group.id}`"
          :class="{ 'is-active': activeId === group.id }"
          href="javascript:void(0)"
          @click="scrollTo(group.id)"
        >
          {{ group.label }}
        </a>
        <p class="nav-label">语义层</p>
        <a
          v-for="group in allSemanticGroups"
          :key="`nav-sem-${group.id}`"
          :class="{ 'is-active': activeId === group.id }"
          href="javascript:void(0)"
          @click="scrollTo(group.id)"
        >
          {{ group.label }}
        </a>
      </nav>
    </aside>

    <div
      v-if="!isFocus"
      class="search-bar"
    >
      <span class="search-icon">⌕</span>
      <input
        v-model="searchQuery"
        aria-label="搜索色值 token"
        class="search-input"
        placeholder="搜索 token 名 / 用途 / 分组，或输入颜色值（hex / rgb / hsl）"
        spellcheck="false"
        type="text"
      />
      <button
        v-if="searchQuery"
        aria-label="清空搜索"
        class="search-clear"
        type="button"
        @click="searchQuery = ''"
      >
        ×
      </button>
    </div>

    <main
      ref="mainRef"
      class="palette-main"
    >
      <div
        v-if="isSearching"
        class="search-results"
      >
        <template v-if="searchHits.length">
          <p class="search-result-count">找到 {{ searchHits.length }} 个 token</p>
          <section
            v-for="block in searchBlocks"
            :key="block.key"
            class="search-block"
          >
            <h3 class="search-block-title">
              {{ block.title }} <span>{{ block.hits.length }}</span>
            </h3>
            <div class="ramp ramp-grid">
              <template
                v-for="hit in block.hits"
                :key="hit.token.name"
              >
                <RampCell
                  v-if="block.key === 'ramp'"
                  :token="hit.token"
                  @copy="copy"
                />
                <SemanticCell
                  v-else
                  :token="hit.token"
                  @copy="copy"
                />
              </template>
            </div>
          </section>
        </template>
        <div
          v-else
          class="search-empty"
        >
          <span class="search-empty-icon">⌕</span>
          <p>没有找到匹配的 token</p>
          <small>换个关键字，或试试 hex / rgb() / hsl() 颜色值</small>
          <button
            class="search-empty-reset"
            type="button"
            @click="searchQuery = ''"
          >
            清空搜索
          </button>
        </div>
      </div>

      <TransitionGroup
        v-else
        class="section-list"
        name="section"
        tag="div"
      >
        <SectionPanel
          v-for="group in visibleRampGroups"
          :id="group.id"
          :key="group.id"
          :count="group.tokens.length"
          :focus="isFocus"
          :title="group.label"
        >
          <template #tools>
            <button
              class="focus-toggle"
              type="button"
              @click="toggleFocus(group.id)"
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
            <RampCell
              v-for="token in group.tokens"
              :key="token.name"
              :token="token"
              @copy="copy"
            />
          </TransitionGroup>
        </SectionPanel>

        <SectionPanel
          v-for="group in visibleSemanticGroups"
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
              @click="toggleFocus(group.id)"
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
            <SemanticCell
              v-for="token in group.tokens"
              :key="token.name"
              :token="token"
              @copy="copy"
            />
          </TransitionGroup>
        </SectionPanel>
      </TransitionGroup>
    </main>

    <Transition name="toast">
      <div
        v-if="copied"
        class="toast"
        role="status"
      >
        <span class="toast-icon">✓</span>
        <span>
          已复制 <code>{{ copied }}</code>
        </span>
      </div>
    </Transition>

    <button
      ref="fabRef"
      class="advisor-fab"
      :class="{ 'is-open': advisorOpen, 'is-dragging': fabDragging }"
      :style="{ transform: `translate(${fabPos.x}px, ${fabPos.y}px)` }"
      :title="advisorOpen ? '关闭色值建议' : '色值建议'"
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
      :anchor="fabPos"
      :open="advisorOpen"
      @copy="copy"
      @update:open="advisorOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

  import ColorAdvisor from './components/ColorAdvisor.vue';
  import RampCell from './components/RampCell.vue';
  import SectionPanel from './components/SectionPanel.vue';
  import SemanticCell from './components/SemanticCell.vue';
  import { registerSearchGroups, searchTokens } from './util/search';
  import { allSemanticGroups, rampGroups } from './util/tokens';
  import { useDrag } from './util/useDrag';

  registerSearchGroups([
    ...rampGroups.map(group => ({ ...group, kind: 'ramp' as const })),
    ...allSemanticGroups.map(group => ({ ...group, kind: 'semantic' as const })),
  ]);

  const copied = ref('');
  const advisorOpen = ref(false);
  const searchQuery = ref('');
  const isSearching = computed(() => searchQuery.value.trim().length > 0);
  const searchHits = computed(() => searchTokens(searchQuery.value));
  const searchBlocks = computed(() =>
    [
      { key: 'ramp', title: '色阶', hits: searchHits.value.filter(hit => hit.kind === 'ramp') },
      {
        key: 'semantic',
        title: '语义层',
        hits: searchHits.value.filter(hit => hit.kind === 'semantic'),
      },
    ].filter(block => block.hits.length > 0),
  );
  let copyTimer = 0;

  function copy(text: string): void {
    navigator.clipboard?.writeText(text).catch(() => {});
    copied.value = text;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      copied.value = '';
    }, 1400);
  }

  const fabRef = ref<HTMLElement | null>(null);
  const {
    pos: fabPos,
    dragging: fabDragging,
    moved: fabMoved,
    onPointerDown: onFabDown,
    onPointerMove: onFabMove,
    onPointerUp: onFabUp,
  } = useDrag({ ignoreButtons: false, target: fabRef });

  function onFabClick(): void {
    if (fabMoved.value) {
      fabMoved.value = false;
      return;
    }
    advisorOpen.value = !advisorOpen.value;
  }

  const activeId = ref('');
  const mainRef = ref<HTMLElement | null>(null);
  const allGroups = [...rampGroups, ...allSemanticGroups];
  const sectionIds = allGroups.map(group => group.id);
  let clickLockId = '';

  const focusId = ref<null | string>(null);
  const isFocus = computed(() => focusId.value !== null);
  let scrollBeforeFocus = 0;
  const visibleRampGroups = computed(() =>
    focusId.value ? rampGroups.filter(group => group.id === focusId.value) : rampGroups,
  );
  const visibleSemanticGroups = computed(() =>
    focusId.value ? allSemanticGroups.filter(group => group.id === focusId.value) : allSemanticGroups,
  );

  function readFocus(): void {
    const label = new URLSearchParams(window.location.search).get('focus');
    if (!label) return;
    const group = allGroups.find(item => item.label === label);
    if (group) focusId.value = group.id;
  }

  function toggleFocus(id: string): void {
    searchQuery.value = '';
    if (!isFocus.value) scrollBeforeFocus = mainRef.value?.scrollTop ?? 0;
    focusId.value = focusId.value === id ? null : id;
    const group = allGroups.find(item => item.id === focusId.value);
    const url = new URL(window.location.href);
    if (group) url.searchParams.set('focus', group.label);
    else url.searchParams.delete('focus');
    window.history.replaceState(null, '', url);
    nextTick(() => {
      if (!isFocus.value && mainRef.value) mainRef.value.scrollTop = scrollBeforeFocus;
      activeId.value = computeActive();
    });
  }

  readFocus();

  /** 取顶部距容器上沿最近的分组；已到底部时取末尾分组（末尾分组无法滚到上沿） */
  function computeActive(): string {
    const container = mainRef.value;
    if (!container) return '';
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
      return sectionIds[sectionIds.length - 1];
    }
    const containerTop = container.getBoundingClientRect().top;
    let best = sectionIds[0];
    let bestDist = Infinity;
    for (const id of sectionIds) {
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

  function onScroll(): void {
    if (!clickLockId) activeId.value = computeActive();
  }

  function onUserScroll(): void {
    if (!clickLockId) return;
    clickLockId = '';
    activeId.value = computeActive();
  }

  function scrollTo(id: string): void {
    const container = mainRef.value;
    const target = document.getElementById(id);
    if (!container || !target) return;
    clickLockId = id;
    activeId.value = id;
    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
  }

  onMounted(() => {
    activeId.value = computeActive();
    const fab = fabRef.value;
    if (fab) {
      fabPos.value = {
        x: Math.max(12, window.innerWidth - fab.offsetWidth - 24),
        y: Math.max(12, window.innerHeight - fab.offsetHeight - 24),
      };
    }
    mainRef.value?.addEventListener('scroll', onScroll, { passive: true });
    mainRef.value?.addEventListener('wheel', onUserScroll, { passive: true });
    mainRef.value?.addEventListener('touchmove', onUserScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    window.clearTimeout(copyTimer);
    mainRef.value?.removeEventListener('scroll', onScroll);
    mainRef.value?.removeEventListener('wheel', onUserScroll);
    mainRef.value?.removeEventListener('touchmove', onUserScroll);
  });
</script>

<style scoped>
  .palette {
    --preview-h: 170px;
    --swatch-h: 100px;

    display: flex;
    align-items: flex-start;
    min-height: 100vh;
    font:
      13px/1.6 -apple-system,
      'Segoe UI',
      sans-serif;
    color: var(--pal-text-body);
  }

  .palette.is-focus {
    --preview-h: 240px;
    --swatch-h: 150px;
  }

  code {
    font-family: ui-monospace, Menlo, Consolas, monospace;
  }

  .palette-aside {
    position: sticky;
    top: 0;
    box-sizing: border-box;
    flex: none;
    width: 220px;
    height: 100vh;
    padding: 28px 16px;
    overflow: hidden auto;
    background: var(--pal-bg-head);
    border-right: 1px solid var(--pal-line);
    transition:
      width 0.3s ease,
      padding 0.3s ease;
  }

  .is-focus .palette-aside,
  .is-searching .palette-aside {
    width: 0;
    padding-right: 0;
    padding-left: 0;
    border-right: none;
  }

  .palette-main {
    position: relative;
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    height: 100vh;
    padding: 0 32px 80px;
    overflow-y: scroll;
    scrollbar-gutter: stable;
  }

  .search-bar {
    position: fixed;
    top: 18px;
    left: calc(50% + 110px);
    z-index: 45;
    box-sizing: border-box;
    display: flex;
    gap: 8px;
    align-items: center;
    width: min(680px, 64vw);
    padding: 12px 18px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 24px;
    box-shadow: 0 4px 16px var(--pal-shadow-popover);
    transform: translateX(-50%);
    transition: left 0.3s ease;
  }

  .is-searching .search-bar {
    left: 50%;
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

  .section-list {
    padding-top: 72px;
  }

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

  .palette-head h1 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .palette-head p {
    margin: 0;
    line-height: 1.5;
    color: var(--pal-text-body);
  }

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

  .palette-nav {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
  }

  .nav-label {
    padding: 0 12px 6px;
    margin: 24px 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--pal-text-title);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--pal-line);
  }

  .palette-nav a {
    padding: 12px;
    font-size: 14px;
    color: var(--pal-text-body);
    text-decoration: none;
    border-left: 2px solid transparent;
    border-radius: 0 3px 3px 0;
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

  .ramp {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }

  .ramp-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ramp-grid > :deep(*) {
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

  .toast {
    position: fixed;
    top: 24px;
    right: 36px;
    z-index: 60;
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 280px;
    max-width: 80vw;
    padding: 10px 18px;
    font-size: 14px;
    color: var(--pal-text-title);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 6px;
    box-shadow: 0 4px 16px var(--pal-shadow-popover);
  }

  .toast-icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 13px;
    color: var(--pal-text-inverse);
    background: var(--pal-success);
    border-radius: 50%;
  }

  .toast code {
    color: var(--pal-brand);
  }

  .toast-enter-active,
  .toast-leave-active {
    transition:
      opacity 0.2s ease,
      margin-top 0.2s ease;
  }

  .toast-enter-from,
  .toast-leave-to {
    margin-top: -12px;
    opacity: 0;
  }
</style>
