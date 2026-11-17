<template>
  <span
    class="swatch-preview"
    :style="{ background: `var(${token.name})` }"
  />
</template>

<script setup lang="ts">
  import type { Token } from '../../util/tokens';

  defineProps<{ token: Token }>();
</script>

<style scoped>
  .swatch-preview {
    display: block;
    height: var(--swatch-h, 100px);
    border: 1px solid var(--pal-line);
    border-radius: 3px;
  }
</style>
