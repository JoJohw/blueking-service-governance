<template>
  <div class="flex items-center">
    <slot name="title">
      <span
        class="text-[#313238] mr-[6px]"
        :style="{ fontSize: parseCss(props.titleSize) }"
        >{{ title || '--' }}</span
      >
    </slot>
    <Divider
      v-if="showDivider"
      class="h-[14px] text-[12px]"
      color="#DCDEE5"
      direction="vertical"
      type="solid"
    />
    <span class="flex items-center gap-[20px] text-[14px] text-[#979BA5] flex-1 overflow-hidden">
      <slot></slot>
    </span>
  </div>
</template>
<script lang="ts" setup>
  import { Divider } from 'bkui-vue';
  import { parseCss } from '~/common/util';
  interface IProps {
    showDivider?: boolean;
    title?: string;
    titleSize?: number | string;
  }
  const props = withDefaults(defineProps<IProps>(), {
    showDivider: true,
    titleSize: 20,
  });
</script>
