<template>
  <button
    class="token-card"
    :class="{ 'token-card-semantic': variant === 'semantic' }"
    :title="`点击复制 var(${token.name})`"
    type="button"
    @click="copy(token)"
  >
    <slot />
    <code class="token-card-name">{{ token.name }}</code>
    <slot name="meta" />
  </button>
</template>

<script setup lang="ts">
  import type { Token } from '../util/tokens';

  defineProps<{ token: Token; variant?: 'ramp' | 'semantic' }>();

  const emit = defineEmits<{ copy: [text: string] }>();

  function copy(token: Token): void {
    emit('copy', `var(${token.name})`);
  }
</script>

<style scoped>
  .token-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 240px;
    padding: 14px;
    color: var(--pal-text-body);
    text-align: left;
    cursor: pointer;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .token-card:hover {
    border-color: var(--pal-line-strong);
  }

  .token-card-semantic {
    gap: 14px;
    width: 360px;
    padding: 24px;
    border-radius: 6px;
  }

  .token-card-name {
    font-size: 14px;
    color: var(--pal-text-title);
  }

  .token-card-semantic .token-card-name {
    font-size: 18px;
  }
</style>
