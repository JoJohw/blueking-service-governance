<template>
  <Tag
    class="ml-[6px] font-400 text-[10px] h-[20px] leading-[20px]"
    type="stroke"
  >
    {{ currentEnv?.isDefault ? $t('按环境') : $t('环境：{0}', [currentEnv?.displayName]) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from 'bkui-vue';

  import type { ExtendedEnv } from './types';

  interface Props {
    currentEnv: ExtendedEnv | null;
  }

  defineProps<Props>();
</script>
