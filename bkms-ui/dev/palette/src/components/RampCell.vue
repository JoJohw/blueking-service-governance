<template>
  <TokenCard
    :token="token"
    @copy="text => emit('copy', text)"
  >
    <span
      class="ramp-swatch"
      :style="{ background: `var(${token.name})` }"
    />
    <template #meta>
      <span class="ramp-value">{{ token.value }}</span>
    </template>
  </TokenCard>
</template>

<script setup lang="ts">
  import TokenCard from './TokenCard.vue';

  import type { Token } from '../util/tokens';

  defineProps<{ token: Token }>();
  const emit = defineEmits<{ copy: [text: string] }>();
</script>

<style scoped>
  .ramp-swatch {
    height: var(--swatch-h, 100px);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }

  .ramp-value {
    font-size: 13px;
    color: var(--pal-text-body);
  }
</style>
