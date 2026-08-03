<template>
  <Tag
    v-if="enabled"
    v-bk-tooltips="{
      content: errorTips,
      disabled: !isError,
      modifiers: tooltipModifiers,
    }"
    :class="!isError ? '!bg-[#F0E7FF] !border-[#DFCFFF] !text-[#7A3EE6]' : ''"
    :size="size"
    :theme="isError ? 'danger' : ''"
  >
    <div class="flex items-center gap-[4px]">
      <ExclamationCircleShape
        v-if="isError"
        class="text-[12px]"
      />
      {{ $t('自动扩缩容') }}
    </div>
  </Tag>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  import { Tag } from 'bkui-vue';
  import { ExclamationCircleShape } from 'bkui-vue/lib/icon';
  import { useI18n } from 'vue-i18n';

  import type { GPAConfigOutputObj } from '~/@types/v1/gpa';

  type AutoScaleStatus = NonNullable<GPAConfigOutputObj['status']> & {
    message?: string;
  };

  interface Props {
    enabled?: boolean;
    size?: 'large' | 'medium' | 'small';
    status?: AutoScaleStatus | null;
  }

  type TooltipPopperState = {
    state: {
      styles: {
        popper: Record<string, string>;
      };
    };
  };

  const props = withDefaults(defineProps<Props>(), {
    enabled: false,
    size: undefined,
    status: null,
  });

  const { t } = useI18n();
  const normalPhases = new Set(['active', 'limited', 'initializing']);
  const tooltipMaxWidth = '500px';
  const tooltipModifiers = [
    {
      name: 'autoScaleTooltipStyle',
      enabled: true,
      phase: 'beforeWrite',
      fn({ state }: TooltipPopperState) {
        state.styles.popper.maxWidth = tooltipMaxWidth;
      },
    },
  ];

  const phase = computed(() => props.status?.phase?.trim() || '');
  const normalizedPhase = computed(() => phase.value.toLowerCase());
  const statusMessage = computed(() => props.status?.message || props.status?.statusMessage || '');

  const isError = computed(() => {
    if (!props.enabled) return false;
    return !normalPhases.has(normalizedPhase.value);
  });

  const errorTips = computed(() => {
    if (!isError.value) return '';
    const tips = [`${t('原因')}：${phase.value || '--'}`];
    if (statusMessage.value) {
      tips.push(`${t('失败详情')}：${statusMessage.value}`);
    }
    return tips.join('\n');
  });
</script>
