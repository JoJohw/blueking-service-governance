<template>
  <ColorIcon
    v-bind="$attrs"
    :icon="statusIconMap[type]"
  ></ColorIcon>
</template>

<script setup lang="ts">
  import ColorIcon from '~/components/color-icon.vue';

  import { type NodeStatus } from './types';

  defineProps<{
    type: NodeStatus;
  }>();

  const statusIconMap: Record<NodeStatus, string> = {
    all: 'quanbu-xuanzhong',
    healthy: 'normal',
    error: 'abnormal',
    warning: 'warning-2',
    unknown: 'status-unknown',
  };
</script>
