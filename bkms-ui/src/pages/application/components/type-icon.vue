<template>
  <div
    v-if="curTypeIconData"
    class="flex items-center"
  >
    <i :class="[curTypeIconData.icon, classes]"></i>
    <span v-if="!$slots.label && showLabel">{{ curTypeIconData.label }}</span>
    <slot
      v-else
      :label="curTypeIconData?.label || emptyPlaceholder"
      name="label"
    ></slot>
  </div>
  <template v-else>
    {{ emptyPlaceholder }}
  </template>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  import type { AppType } from '~/composables/app-type';

  /**
   * @description 若使用slot自定义label，props.type建议直接给出类型而非变量 否则可能会出现type与label不一致的情况
   *
   */

  interface IProps {
    classes?: string;
    emptyPlaceholder?: string;
    showLabel?: boolean;
    type?: AppType | string;
  }

  const props = withDefaults(defineProps<IProps>(), {
    classes: '',
    showLabel: true,
    emptyPlaceholder: '--',
  });

  const typeIconMap: Record<
    AppType,
    {
      icon: string;
      label: string;
    }
  > = {
    trpc: {
      icon: 'bkms-icon bkms-icon-trpc text-[#1B44C8] text-[8px]',
      label: 'trpc',
    },
    taf: {
      icon: 'bkms-icon bkms-icon-taf text-[#1b44c8] text-[20px]',
      label: 'taf',
    },
    helm: {
      icon: 'bkms-icon bkms-icon-HelmCharts text-[#0F1689] text-[16px]',
      label: 'helm',
    },
    agones: {
      icon: 'bkms-icon bkms-icon-agones text-[#0F1689] text-[16px]',
      label: 'agones',
    },
  };

  const curTypeIconData = computed(() => {
    const result = props?.type && typeIconMap?.[props.type as AppType] ? typeIconMap[props.type as AppType] : null;
    return result;
  });
</script>
