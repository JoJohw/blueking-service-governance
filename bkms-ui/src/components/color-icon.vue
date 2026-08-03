<template>
  <svg :style="iconSize">
    <use :xlink:href="`${iconPrefix}${icon}`"></use>
  </svg>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  interface IProps {
    icon: string;
    iconPrefix?: string;
    size?: number;
  }
  /**
   * @description 用于彩色图标展示，请事先在静态资源添加好彩色图标(example: #bkms-icon-exmpale, #other-icon-prefix-example)
   */
  const props = withDefaults(defineProps<IProps>(), {
    iconPrefix: '#bkms-icon-',
    size: 16,
  });

  const iconSize = computed(() => ({
    height: `${props.size}px`,
    width: `${props.size}px`,
  }));
</script>
