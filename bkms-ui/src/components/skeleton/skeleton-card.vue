<script setup lang="ts">
  import { toRefs } from 'vue';

  import Layout from './skeleton-layout';

  interface CardChildSizeType {
    height: number;
    width: number;
  }

  const props = withDefaults(
    defineProps<{
      childrenSize?: CardChildSizeType[];
      count?: number;
      height?: number;
      loading?: boolean;
      width?: number;
    }>(),
    {
      loading: true,
      count: 5,
      width: 280,
      height: 150,
      childrenSize: () => [],
    },
  );

  const { count, width, height, childrenSize, loading } = toRefs(props);

  if (!childrenSize.value?.length) {
    for (let i = 0; i < count.value; i++) {
      childrenSize.value.push({ width: width.value, height: height.value });
    }
  }
</script>
<template>
  <template v-if="loading">
    <div class="flex flex-wrap w-full p-[20px]">
      <template
        v-for="index in count"
        :key="index"
      >
        <Layout.shape
          class="mr-[20px] mb-[20px]"
          :height="childrenSize[index - 1]?.height"
          type="rect"
          :width="childrenSize[index - 1]?.width"
        >
          <template #content>
            <Layout.paragraph />
          </template>
        </Layout.shape>
      </template>
    </div>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>
