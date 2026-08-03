<template>
  <span class="flex items-center gap-[4px]">
    <!-- 加密占位 -->
    <span
      v-for="dot in count"
      :key="dot"
      class="inline-block w-[6px] h-[6px] rounded-full bg-[#63656e]"
    ></span>
  </span>
</template>

<script setup lang="ts">
  interface IProps {
    count?: number;
  }

  withDefaults(defineProps<IProps>(), {
    count: 6,
  });
</script>
