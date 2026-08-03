<script setup lang="ts">
  import { toRefs } from 'vue';

  import Layout from './skeleton-layout';

  const props = withDefaults(
    defineProps<{
      loading?: boolean;
      rows?: number;
    }>(),
    {
      loading: true,
      rows: 6,
    },
  );

  const { rows, loading } = toRefs(props);
</script>
<template>
  <div v-if="loading">
    <div class="grid w-full bg-[#ffffff]">
      <div class="grid grid-cols-1 gap-[26px]">
        <Layout.shape
          v-for="(_, index) in rows"
          :key="index"
          class="rounded-sm"
          :height="index === 0 ? '44px' : '20px'"
          type="rect"
          width="100%"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <slot></slot>
  </div>
</template>
