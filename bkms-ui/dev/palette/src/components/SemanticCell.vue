<template>
  <TokenCard
    :token="token"
    variant="semantic"
    @copy="text => emit('copy', text)"
  >
    <component
      :is="preview"
      v-if="preview"
      :token="token"
    />
    <template #meta>
      <span
        v-if="token.ref"
        class="semantic-ref"
      >
        <span class="semantic-ref-label">引用</span>
        <code>{{ token.ref }}</code>
        <code class="semantic-ref-hex"
          ><span class="semantic-hex-tag">{{ resolved(token.value) }}</span></code
        >
      </span>
      <span
        v-else
        class="ramp-value"
        >{{ token.value }}</span
      >
      <span
        v-if="token.note"
        class="semantic-note"
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

  const props = defineProps<{ token: Token }>();
  const emit = defineEmits<{ copy: [text: string] }>();

  const preview = computed(() => previewFor(props.token));
</script>

<style scoped>
  .ramp-value {
    font-size: 15px;
    color: var(--pal-text-body);
  }

  .semantic-ref {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 15px;
    color: var(--pal-brand);
  }

  .semantic-ref-label {
    padding: 2px 8px;
    font-size: 13px;
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }

  .semantic-ref-hex {
    color: var(--pal-text-body);
  }

  .semantic-hex-tag {
    padding: 2px 8px;
    font-size: 13px;
    color: var(--pal-text-body);
    background: var(--pal-bg-subtle);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }

  .semantic-note {
    font-size: 14px;
    line-height: 1.4;
    color: var(--pal-text-body);
  }
</style>
