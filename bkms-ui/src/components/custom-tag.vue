<template>
  <div :class="['leading-[22px] text-[12px] rounded-[2px] border-[1px] px-[5px] w-fit', theme]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue';
  type ITheme = 'danger' | 'default' | 'info' | 'success' | 'warning';
  defineProps({
    theme: {
      type: String as PropType<ITheme>,
      default: 'default',
    },
  });
</script>

<style lang="postcss" scoped>
  .default {
    background-color: #fafbfd;
    color: #4d4f56;
    border-color: #dcdee5;
  }
  .success {
    background-color: #daf6e5;
    color: #299e56;
    border-color: #a1e3ba;
  }
  .danger {
    background-color: #fbe9e7;
    color: #e02020;
    border-color: #e02020;
  }
  .warning {
    background-color: #fdf6e5;
    color: #e02020;
    border-color: #e02020;
  }
  .info {
    background-color: #e8f8ff;
    color: #0052d9;
    border-color: #a1e3ba;
  }
</style>
