<template>
  <div
    class="flex items-center border-[1px] border-[#C4C6CC] border-solid h-[32px] leading-[32px] text-[#4D4F56] bg-[#fff] min-w-[160px]"
  >
    <div
      class="text-center bg-[#FAFBFD] text-center h-full border-r-[1px] border-solid border-[#C4C6CC]"
      :style="`min-width: ${keyWidth ? keyWidth : 0}px`"
    >
      {{ keyName }}
    </div>
    <div class="flex items-center min-w-[100px]">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
  interface IProps {
    keyName: string;
    keyWidth: number;
  }

  defineProps<IProps>();
</script>
