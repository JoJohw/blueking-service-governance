<template>
  <div class="flex flex-col gap-[16px]">
    <template v-if="label">
      <div class="flex items-center gap-[5px]">
        <span class="text-[#313238] font-700 label">{{ label }}</span>
        <InfoLine
          v-if="showIcon"
          fill="#979BA5"
          :height="font"
          :width="font"
        />
      </div>
    </template>
    <template v-else-if="slots.label">
      <slot name="label" />
    </template>
    <slot />
  </div>
</template>

<script setup lang="ts">
  import { computed, useSlots } from 'vue';

  import { InfoLine } from 'bkui-vue/lib/icon';

  const props = defineProps({
    label: {
      type: String,
      default: '',
    },
    showIcon: {
      type: Boolean,
      default: false,
    },
    font: {
      type: String,
      default: '14',
    },
  });

  const fontSize = computed(() => `${props.font}px`);

  const slots = useSlots();
</script>

<style lang="postcss" scoped>
  .label {
    font-size: v-bind(fontSize);
  }
</style>
