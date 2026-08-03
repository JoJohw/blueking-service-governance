<script setup lang="ts">
  import Layout from './skeleton-layout';

  const props = withDefaults(
    defineProps<{
      loading?: boolean;
    }>(),
    {
      loading: true,
    },
  );
</script>
<template>
  <template v-if="props.loading">
    <div class="flex flex-col w-full p-[20px]">
      <Layout.shape
        class="mb-[20px] h-[16px] w-[38%]"
        type="rect"
      />
      <Layout.shape
        class="mb-[16px] h-[16px]"
        type="rect"
      />
    </div>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>
