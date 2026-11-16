<template>
  <div class="line-preview">
    <span
      v-for="style in lineStyles"
      :key="style"
      class="line"
      :class="`line-${style}`"
      :style="{ borderColor: `var(${token.name})` }"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Token } from '../../util/tokens';

  defineProps<{ token: Token }>();

  const lineStyles = ['solid', 'dashed', 'dotted'];
</script>

<style scoped>
  .line-preview {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 30px;
    justify-content: center;
    width: 100%;
    height: var(--preview-h, 170px);
    padding: 0 24px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .line {
    width: 100%;
    border-top: 2px solid;
  }

  .line-dashed {
    border-top-style: dashed;
  }

  .line-dotted {
    border-top-style: dotted;
  }
</style>
