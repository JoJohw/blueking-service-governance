<template>
  <template v-if="isLoading || transition">
    <div
      ref="elem"
      :class="fullHeight ? 'h-full' : ''"
      :style="containerStyle"
    >
      <slot name="loading"></slot>
    </div>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
  import { computed, onMounted, provide, ref, watch } from 'vue';

  const props = withDefaults(
    defineProps<{
      fullHeight?: boolean;
      loading?: boolean;
      once?: boolean;
      theme?: 'gray' | 'white';
    }>(),
    {
      loading: true,
      once: true,
      theme: 'white',
      fullHeight: true,
    },
  );
  // 提供当前theme给Shape
  provide('theme', props.theme);

  const containerBackgroundColor = computed(() => (props.theme === 'white' ? '#FFFFFF' : 'transparent'));

  const containerStyle = computed(() => ({
    opacity: 1,
    transition: 'opacity 1s',
    width: '100%',
    // fullHeight=true 时撑满父容器；false 时由 slot 内容决定高度，避免 Tab 等内容区出现多余滚动条
    ...(props.fullHeight ? { minHeight: '360px' } : {}),
    backgroundColor: containerBackgroundColor.value,
  }));

  // 加载次数
  let loadTriggerCount = 0;
  const isLoading = computed(() => {
    let enableLoading = true;
    if (props.once && loadTriggerCount > 1) enableLoading = false;
    return props.loading && enableLoading;
  });

  const transition = ref(false);
  const elem = ref<HTMLElement | null>(null);

  onMounted(() => {
    if (elem.value) {
      elem.value.addEventListener('transitionstart', () => {
        transition.value = true;
      });
      elem.value.addEventListener('transitionend', () => {
        transition.value = false;
      });
    }
  });

  watch(
    () => props.loading,
    v => {
      if (!v && elem.value) {
        elem.value.style.opacity = '0';
      }
      if (v) loadTriggerCount += 1;
    },
    { immediate: true },
  );
</script>
