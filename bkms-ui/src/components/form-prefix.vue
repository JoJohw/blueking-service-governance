<template>
  <span class="flex items-center justify-center border-r-[1px] border-[#C4C6CC] bg-[#FAFBFD] px-[8px] text-[#4D4F56]">
    {{ label }}
  </span>
</template>
<script lang="ts" setup>
  interface IProps {
    label: string;
  }
  defineProps<IProps>();
</script>
