<template>
  <span
    v-bk-tooltips="{
      arrow: false,
      content: desc,
      disabled: !desc,
      placement,
    }"
    :class="[
      'flex items-center justify-center rounded-sm',
      sizeMap[size],
      fontSizeMap[fontSize as keyof typeof fontSizeMap],
      clickable ? 'cursor-pointer' : '',
    ]"
  >
    <slot name="icon">
      <i
        :class="icon"
        :style="{ color: props.color || '#979BA5' }"
      >
      </i>
    </slot>
    <slot></slot>
  </span>
</template>
<script lang="ts" setup>
  import type { PropType } from 'vue';

  import { bkTooltips } from 'bkui-vue';

  const props = defineProps({
    icon: {
      type: String,
      default: '',
    },
    desc: {
      type: String,
      default: '',
    },
    clickable: {
      type: Boolean,
      default: true,
    },
    size: {
      type: String as PropType<'default' | 'large' | 'none'>,
      default: 'default',
    },
    color: {
      type: String,
      default: '',
    },
    fontSize: {
      type: String as PropType<keyof typeof fontSizeMap | string>,
      default: 'large',
    },
    placement: {
      type: String,
      default: 'bottom',
    },
    spin: {
      type: Boolean,
      default: false,
    },
  });

  const vBkTooltips = bkTooltips;

  const sizeMap = {
    default: 'w-[24px] h-[24px]',
    large: 'w-[32px] h-[32px]',
    none: '',
  };

  const fontSizeMap = {
    small: 'text-[10px]',
    default: 'text-[12px]',
    large: 'text-[14px]',
  };
</script>
