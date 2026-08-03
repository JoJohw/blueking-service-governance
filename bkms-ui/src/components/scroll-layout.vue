<template>
  <div class="w-full h-full flex flex-col">
    <!-- Content 区域：未溢出时保持自然高度，溢出时收缩并启用滚动 -->
    <div
      ref="contentRef"
      :class="['flex-[0_1_auto] min-h-0 overflow-y-auto flex flex-col items-center', contentClass]"
    >
      <slot :has-scroll="hasScroll" />
    </div>
    <!-- Footer 区域：不收缩，始终在底部，滚动条不会进入此区域 -->
    <div :class="['flex-shrink-0', footerClass]">
      <slot
        :has-scroll="hasScroll"
        name="footer"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue';

  defineProps<{
    /** Content 区域附加样式类 */
    contentClass?: string;
    /** Footer 区域附加样式类 */
    footerClass?: string;
  }>();

  const contentRef = ref<HTMLElement | null>(null);
  const hasScroll = ref(false);
  let observer: null | ResizeObserver = null;

  onMounted(() => {
    if (contentRef.value) {
      observer = new ResizeObserver(() => {
        if (!contentRef.value) return;
        hasScroll.value = contentRef.value.scrollHeight > contentRef.value.clientHeight;
      });
      observer.observe(contentRef.value);
    }
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  defineExpose({
    hasScroll,
  });
</script>
