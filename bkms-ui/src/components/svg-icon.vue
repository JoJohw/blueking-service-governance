<template>
  <svg
    aria-hidden="true"
    :style="{
      width: typeof width === 'string' ? `${width}` : `${width}px`,
      height: typeof height === 'string' ? `${height}` : `${height}px`,
    }"
  >
    <use :xlink:href="`#${icon}`"></use>
  </svg>
</template>
<script lang="ts" setup>
  interface SvgIconProps {
    height?: number | string;
    icon: string;
    width?: number | string;
  }

  withDefaults(defineProps<SvgIconProps>(), {
    width: '24px',
    height: '24px',
  });
</script>
