<template>
  <div class="w-full flex items-center gap-[4px] content-hover">
    <div
      v-bk-tooltips="{ content: tooltip, disabled: !tooltip }"
      class="max-w-[calc(100%-20px)]"
      :class="{ 'border-b border-dashed border-[#979ba5] cursor-pointer': tooltip }"
    >
      <OverflowTitle :type="tooltip ? undefined : 'tips'">
        {{ text || emptyPlaceholder }}
      </OverflowTitle>
    </div>
    <slot />
    <Copy
      v-if="copyValue"
      class="cursor-pointer content-item hover:text-[#3A84FF]"
      fill="#3a84ff"
      height="16"
      :title="$t('复制')"
      width="16"
      @click.stop="copyText(copyValue)"
    />
  </div>
</template>

<script lang="ts" setup>
  import { OverflowTitle } from 'bkui-vue';
  import { Copy } from 'bkui-vue/lib/icon';
  import { copyText } from '~/common/util';
  interface IProps {
    copyValue: string;
    emptyPlaceholder?: string;
    text: number | string;
    tooltip?: string;
  }

  withDefaults(defineProps<IProps>(), {
    emptyPlaceholder: '--',
  });
</script>
