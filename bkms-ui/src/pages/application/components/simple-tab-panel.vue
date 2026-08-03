<template>
  <slot v-if="active || parentTab?.activeID === id"></slot>
</template>
<script lang="ts" setup>
  import { getCurrentInstance, inject, onBeforeMount, onBeforeUnmount } from 'vue';

  import SimpleTabPanel from './simple-tab-panel.vue';

  import type { IProvide } from './simple-tab.vue';

  interface IProps {
    active?: boolean;
    id: number | string;
    name: string;
  }

  const props = defineProps<IProps>();
  const parentTab = inject<IProvide>('simple-tab');

  const instance = getCurrentInstance();

  onBeforeMount(() => {
    if (instance) {
      parentTab?.registry?.(props.id, instance.proxy as InstanceType<typeof SimpleTabPanel>);
    }
  });

  onBeforeUnmount(() => {
    parentTab?.unregistry?.(props.id);
  });
</script>
