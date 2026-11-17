<template>
  <TokenCard
    :class="`token-cell token-cell-${variant}`"
    :token="token"
    :variant="variant"
    @copy="text => emit('copy', text)"
  >
    <component
      :is="preview"
      :token="token"
    />
    <template #meta>
      <span
        v-if="token.ref"
        class="cell-ref"
      >
        <span class="cell-ref-label">引用</span>
        <code>{{ token.ref }}</code>
        <code
          v-if="refValue"
          class="cell-ref-hex"
        >
          <span class="cell-hex-tag">{{ refValue }}</span>
        </code>
      </span>
      <span
        v-else
        class="cell-value"
        >{{ token.value }}</span
      >
      <span
        v-if="token.note"
        class="cell-note"
        >{{ token.note }}</span
      >
    </template>
  </TokenCard>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { type Token, resolved } from '../util/tokens';
  import { previewFor } from './previews';
  import TokenCard from './TokenCard.vue';

  const props = defineProps<{ token: Token; variant: 'ramp' | 'semantic' }>();
  const emit = defineEmits<{ copy: [text: string] }>();

  const preview = computed(() => previewFor(props.token));

  /** var() 链解析不到色值时（圆角等长度令牌）不展示重复的引用名 */
  const refValue = computed(() => {
    const value = resolved(props.token.value);
    return value.startsWith('var(') ? '' : value;
  });
</script>

<style scoped>
  /* 分区只影响卡片尺寸与预览高度，不决定展示形态 */
  .token-cell-ramp {
    --preview-h: 120px;
    --swatch-h: 100px;
  }

  .token-cell-semantic {
    --preview-h: 170px;
  }

  .cell-value {
    font-size: 15px;
    color: var(--pal-text-body);
  }

  .token-cell-ramp .cell-value {
    font-size: 13px;
  }

  .cell-ref {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 15px;
    color: var(--pal-brand);
  }

  .cell-ref-label {
    padding: 2px 8px;
    font-size: 13px;
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }

  .cell-ref-hex {
    color: var(--pal-text-body);
  }

  .cell-hex-tag {
    padding: 2px 8px;
    font-size: 13px;
    color: var(--pal-text-body);
    background: var(--pal-bg-subtle);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }

  .cell-note {
    font-size: 14px;
    line-height: 1.4;
    color: var(--pal-text-body);
  }

  .token-cell-ramp .cell-note {
    font-size: 13px;
  }
</style>
