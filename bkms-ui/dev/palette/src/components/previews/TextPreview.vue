<template>
  <div
    class="text-preview"
    :style="{ color: `var(${token.name})` }"
  >
    <span class="text-caption">Aa 文字示例</span>
  </div>
</template>

<script setup lang="ts">
  import type { Token } from '../../util/tokens';

  defineProps<{ token: Token }>();
</script>

<style scoped>
  .text-preview {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    height: var(--preview-h, 170px);
    padding: 0 24px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .text-caption {
    font-size: 40px;
    font-weight: 600;
    line-height: 1.4;
  }
</style>
