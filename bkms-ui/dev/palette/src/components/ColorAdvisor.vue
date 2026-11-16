<template>
  <Transition name="advisor">
    <div
      v-if="open"
      ref="panelRef"
      aria-label="色值建议"
      class="advisor"
      role="dialog"
      :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }"
    >
      <header
        class="advisor-bar"
        @pointercancel="onPointerUp"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      >
        <strong class="advisor-title">色值建议</strong>
        <button
          aria-label="关闭"
          class="advisor-close"
          type="button"
          @click="emit('update:open', false)"
        >
          ×
        </button>
      </header>

      <div class="advisor-body">
        <p class="field-label">输入颜色</p>
        <div class="advisor-field">
          <input
            ref="inputRef"
            v-model="raw"
            aria-label="输入颜色"
            class="advisor-input"
            placeholder="输入 HEX 或 RGB 颜色值"
            spellcheck="false"
            type="text"
          />
          <label class="advisor-picker">
            <input
              aria-label="取色器"
              type="color"
              :value="normalized || DEFAULT_COLOR"
              @input="onPick"
            />
          </label>
        </div>

        <template v-if="normalized">
          <p class="field-label field-label-spaced">最接近的色板值</p>
          <div class="advisor-compare">
            <div class="compare-block">
              <span
                class="compare-swatch"
                :style="{ background: normalized }"
              />
              <span class="compare-label">输入</span>
              <code class="compare-value">{{ normalized }}</code>
            </div>
            <div class="compare-bridge">
              <span
                class="bridge-delta"
                :class="{ 'is-near': best && best.distance <= threshold }"
              >
                {{ best ? best.distance.toFixed(2) : '—' }}
              </span>
              <span class="bridge-unit">ΔE</span>
            </div>
            <div class="compare-block">
              <span
                class="compare-swatch"
                :style="{ background: best ? best.hex : 'transparent' }"
              />
              <span class="compare-label">建议</span>
              <code class="compare-value">{{ best ? best.label : '—' }}</code>
            </div>
          </div>

          <div class="advisor-list-head">
            <span>{{ near.length ? '贴近色板' : '阈值内无匹配 · 最接近参考' }}</span>
            <span>{{ near.length || all.length }} 项</span>
          </div>
          <ul class="advisor-list">
            <li
              v-for="item in near.length ? near : all"
              :key="item.name"
              class="advisor-item"
            >
              <span
                class="item-swatch"
                :style="{ background: item.hex }"
              />
              <span class="item-info">
                <code class="item-name">var({{ item.name }})</code>
                <span class="item-sub">{{ item.group }} · {{ item.hex }}</span>
              </span>
              <span
                class="item-delta"
                :class="{ 'is-near': item.distance <= threshold }"
              >
                {{ item.distance.toFixed(2) }}
              </span>
              <button
                class="item-copy"
                type="button"
                @click="emit('copy', `var(${item.name})`)"
              >
                复制
              </button>
            </li>
          </ul>
        </template>

        <p class="advisor-foot">CIEDE2000 · 阈值 ΔE ≤ {{ threshold }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import { normalizeHex } from '../util/color-diff';
  import { DEFAULT_COLOR, DISTANCE_THRESHOLD, suggestColors } from '../util/suggest';
  import { useDrag } from '../util/useDrag';

  const props = defineProps<{ anchor: { x: number; y: number }; open: boolean }>();
  const emit = defineEmits<{
    copy: [text: string];
    'update:open': [value: boolean];
  }>();

  const threshold = DISTANCE_THRESHOLD;
  const raw = ref('');
  const normalized = computed(() => normalizeHex(raw.value));
  const near = computed(() => suggestColors(raw.value, true));
  const all = computed(() => suggestColors(raw.value, false).slice(0, 5));
  const best = computed(() => (near.value.length ? near.value[0] : all.value[0]));

  const panelRef = ref<HTMLElement | null>(null);
  const inputRef = ref<HTMLInputElement | null>(null);
  const { pos, onPointerDown, onPointerMove, onPointerUp } = useDrag({ target: panelRef });

  function onKeydown(event: KeyboardEvent): void {
    if (props.open && event.key === 'Escape') emit('update:open', false);
  }

  function onPick(event: Event): void {
    raw.value = (event.target as HTMLInputElement).value.toUpperCase();
  }

  watch(
    () => props.open,
    open => {
      if (!open) return;
      nextTick(() => {
        const panel = panelRef.value;
        if (panel) {
          pos.value = {
            x: Math.max(12, Math.min(props.anchor.x - 40, window.innerWidth - panel.offsetWidth - 12)),
            y: Math.max(12, props.anchor.y - panel.offsetHeight - 12),
          };
        }
        inputRef.value?.focus();
      });
    },
  );

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
  .advisor {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    box-sizing: border-box;
    width: 520px;
    overflow: hidden;
    font:
      14px/1.5 -apple-system,
      'Segoe UI',
      sans-serif;
    color: var(--pal-text-body);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 12px;
    box-shadow:
      0 2px 8px var(--pal-shadow-popover),
      0 16px 48px var(--pal-shadow-dialog);
  }

  .advisor-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    cursor: grab;
    user-select: none;
    border-bottom: 1px solid var(--pal-line);
  }

  .advisor-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .advisor-close {
    padding: 0 2px;
    font-size: 20px;
    line-height: 1;
    color: var(--pal-text-muted, var(--pal-text-body));
    cursor: pointer;
    background: none;
    border: none;
  }

  .advisor-close:hover {
    color: var(--pal-text-title);
  }

  .advisor-body {
    padding: 20px 22px 16px;
  }

  .field-label {
    margin: 0 0 10px;
    font-size: 12px;
    color: var(--pal-text-muted, var(--pal-text-body));
    letter-spacing: 0.5px;
  }

  .field-label-spaced {
    padding-top: 18px;
    margin-top: 20px;
    border-top: 1px solid var(--pal-line);
  }

  .advisor-field {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .advisor-input {
    flex: 1;
    min-width: 0;
    padding: 10px 14px;
    font: inherit;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 14px;
    color: var(--pal-text-title);
    outline: none;
    background: var(--pal-bg-head);
    border: 1px solid transparent;
    border-radius: 8px;
  }

  .advisor-input:focus {
    border-color: var(--pal-brand);
  }

  .advisor-picker {
    position: relative;
    flex: none;
    width: 40px;
    height: 40px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--pal-line);
    border-radius: 8px;
  }

  .advisor-picker input {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 56px;
    height: 56px;
    padding: 0;
    cursor: pointer;
    border: none;
  }

  .advisor-compare {
    display: grid;
    grid-template-columns: 1fr 88px 1fr;
    gap: 14px;
    align-items: start;
  }

  .compare-block {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  .compare-swatch {
    width: 100%;
    height: 92px;
    border: 1px solid var(--pal-line);
    border-radius: 8px;
  }

  .compare-label {
    font-size: 12px;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .compare-value {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 600;
    color: var(--pal-text-title);
    white-space: nowrap;
  }

  .compare-bridge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 18px;
  }

  .bridge-delta {
    font-size: 22px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    color: var(--pal-warning, var(--pal-text-body));
  }

  .bridge-delta.is-near {
    color: var(--pal-success, var(--pal-text-body));
  }

  .bridge-unit {
    font-size: 11px;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .advisor-list-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-top: 16px;
    margin-top: 20px;
    border-top: 1px solid var(--pal-line);
  }

  .advisor-list-head span:first-child {
    font-size: 13px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .advisor-list-head span:last-child {
    font-size: 12px;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .advisor-list {
    max-height: 280px;
    padding: 0;
    margin: 8px 0 0;
    overflow-y: auto;
    list-style: none;
  }

  .advisor-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 13px 4px;
    border-radius: 6px;
  }

  .advisor-item:hover {
    background: var(--pal-bg-hover);
  }

  .item-swatch {
    flex: none;
    width: 42px;
    height: 42px;
    border: 1px solid var(--pal-line);
    border-radius: 6px;
  }

  .item-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
    color: var(--pal-text-title);
    white-space: nowrap;
  }

  .item-sub {
    font-size: 13px;
    color: var(--pal-text-muted, var(--pal-text-body));
  }

  .item-delta {
    flex: none;
    min-width: 50px;
    font-size: 16px;
    font-variant-numeric: tabular-nums;
    color: var(--pal-warning, var(--pal-text-body));
    text-align: right;
  }

  .item-delta.is-near {
    color: var(--pal-success, var(--pal-text-body));
  }

  .item-copy {
    flex: none;
    padding: 5px 14px;
    font-size: 14px;
    color: var(--pal-brand);
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 4px;
  }

  .item-copy:hover {
    background: var(--pal-bg-active);
  }

  .advisor-foot {
    padding-top: 14px;
    margin: 12px 0 0;
    font-size: 11px;
    color: var(--pal-text-muted, var(--pal-text-body));
    text-align: center;
    border-top: 1px solid var(--pal-line);
  }

  .advisor-enter-active,
  .advisor-leave-active {
    transition:
      opacity 0.18s ease,
      scale 0.18s ease;
  }

  .advisor-enter-from,
  .advisor-leave-to {
    opacity: 0;
    scale: 0.96;
  }
</style>
