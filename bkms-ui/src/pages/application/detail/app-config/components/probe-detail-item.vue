<template>
  <div
    class="text-[12px] flex items-center"
    :style="{ lineHeight: resolvedLineHeight }"
  >
    <span class="text-[#979BA5]">{{ label }}：</span>
    <span class="text-[#313238]">
      <slot>{{ value ?? '--' }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      label: string;
      lineHeight?: number | string;
      value?: number | string;
    }>(),
    {
      lineHeight: 32,
    },
  );

  const resolvedLineHeight = computed(() =>
    typeof props.lineHeight === 'number' ? `${props.lineHeight}px` : props.lineHeight,
  );
</script>

<style lang="postcss" scoped>
  .probe-detail-label {
    color: var(--probe-detail-label-color, #979ba5);
  }

  .probe-detail-value {
    color: var(--probe-detail-value-color, #313238);
  }
</style>
