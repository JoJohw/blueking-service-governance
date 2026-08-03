<template>
  <div class="text-[12px] flex w-full h-[30px]">
    <div
      class="text-[#979BA5] text-right shrink-0"
      :style="{
        minWidth: labelStyle,
      }"
    >
      {{ label }}：
    </div>
    <div class="text-[#313238] text-wrap break-all">
      <slot>{{ value ?? '--' }}</slot>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps({
    label: {
      type: String,
      default: '',
    },
    labelWidth: {
      type: [String, Number],
      default: 100,
    },
    value: {
      type: String,
      default: '',
    },
  });

  const labelStyle = computed(() =>
    typeof props.labelWidth === 'string' ? props.labelWidth : `${props.labelWidth}px`,
  );
</script>
