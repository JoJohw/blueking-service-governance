<template>
  <div class="shadow-preview">
    <span
      class="shadow-box"
      :style="{ boxShadow: `0 2px 8px 0 ${resolved(token.value)}` }"
    />
  </div>
</template>

<script setup lang="ts">
  import { resolved, type Token } from '../../util/tokens';

  defineProps<{ token: Token }>();
</script>

<style scoped>
  .shadow-preview {
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

  .shadow-box {
    width: 70%;
    height: 100px;
    background: var(--pal-bg-card);
    border-radius: 3px;
  }
</style>
