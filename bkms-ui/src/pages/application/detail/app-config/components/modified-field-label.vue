<template>
  <div
    class="flex items-center justify-end gap-[6px] text-[#979BA5]"
    :style="{ width: `${labelWidth}px`, lineHeight: `${lineHeight}px` }"
  >
    <i
      v-if="modified"
      class="w-[3px] h-[18px] bg-[#ff9c01]"
    ></i>
    {{ label }}：
  </div>
</template>

<script lang="ts" setup>
  interface Props {
    /** 字段名文本 */
    label: string;
    /** label 宽度，默认 205px */
    labelWidth?: number;
    /** 行高，默认 30px */
    lineHeight?: number;
    /** 是否显示修改标识 */
    modified?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    labelWidth: 205,
    lineHeight: 30,
    modified: false,
  });
</script>
