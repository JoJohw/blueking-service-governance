<template>
  <span
    v-bk-tooltips="{ content: description, placement }"
    class="!border-b-[1px] !border-[#AFAFAF] !border-dashed"
  >
    <slot></slot>
  </span>
</template>

<script lang="ts" setup>
  import { PlacementEnum } from 'bkui-vue/lib/shared';

  interface IProps {
    description: string;
    placement?: PlacementEnum;
  }

  withDefaults(defineProps<IProps>(), {
    placement: PlacementEnum.TOP,
  });
</script>
