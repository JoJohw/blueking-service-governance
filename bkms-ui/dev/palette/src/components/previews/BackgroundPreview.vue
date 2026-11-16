<template>
  <div
    class="bg-preview"
    :style="{ background: `var(${token.name})` }"
  >
    <span class="bg-caption">{{ token.note || '背景' }}</span>
  </div>
</template>

<script setup lang="ts">
  import type { Token } from '../../util/tokens';

  defineProps<{ token: Token }>();
</script>

<style scoped>
  .bg-preview {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--preview-h, 170px);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .bg-caption {
    padding: 6px 16px;
    font-size: 20px;
    color: var(--pal-text-title);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }
</style>
