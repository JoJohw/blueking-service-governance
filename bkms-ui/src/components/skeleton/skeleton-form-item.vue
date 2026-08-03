<script setup lang="ts">
  import { toRefs } from 'vue';

  import Layout from './skeleton-layout';

  const props = withDefaults(
    defineProps<{
      itemHeight?: number;
      itemWidth?: number;
      labelHeight?: number;
      labelWidth?: number;
      loading?: boolean;
    }>(),
    {
      loading: true,
      labelWidth: 100,
      labelHeight: 30,
      itemWidth: 200,
      itemHeight: 30,
    },
  );

  const { labelWidth, labelHeight, itemWidth, itemHeight, loading } = toRefs(props);
</script>
<template>
  <template v-if="loading">
    <div class="flex">
      <Layout.shape
        class="mr-[20px]"
        :height="labelHeight"
        type="rect"
        :width="labelWidth"
      />
      <Layout.shape
        class="mr-[20px]"
        :height="itemHeight"
        type="rect"
        :width="itemWidth"
      />
    </div>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>
