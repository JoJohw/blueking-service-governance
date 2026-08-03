<template>
  <div
    ref="wrapperRef"
    class="overflow-ctrl"
    :class="{ 'with-arrows': showArrows }"
  >
    <div
      v-show="showArrows"
      class="arrow-btn left"
      @click="scrollLeft"
    >
      <AngleLeft
        fill="#979BA5"
        :height="12"
        :width="12"
      />
    </div>

    <div
      ref="scrollContainer"
      class="scroll-container"
    >
      <slot />
    </div>

    <div
      v-show="showArrows"
      class="arrow-btn right"
      @click="scrollRight"
    >
      <AngleRight
        fill="#979BA5"
        :height="12"
        :width="12"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, ref } from 'vue';

  import { AngleLeft, AngleRight } from 'bkui-vue/lib/icon';

  const wrapperRef = ref<HTMLElement>();
  const scrollContainer = ref<HTMLElement>();
  const showArrows = ref(false);

  // 检查是否溢出并更新箭头显示状态
  const checkOverflow = () => {
    if (!scrollContainer.value) return;

    const { scrollWidth, clientWidth } = scrollContainer.value;
    showArrows.value = scrollWidth > clientWidth;
  };

  // 延迟检查（等待 slot 内容渲染完成）
  const deferredCheck = () => {
    nextTick(() => {
      checkOverflow();
    });
  };

  // 向左滚动
  const scrollLeft = () => {
    if (!scrollContainer.value) return;
    scrollContainer.value.scrollBy({
      left: -200,
      behavior: 'smooth',
    });
  };

  // 向右滚动
  const scrollRight = () => {
    if (!scrollContainer.value) return;
    scrollContainer.value.scrollBy({
      left: 200,
      behavior: 'smooth',
    });
  };

  let resizeObserver: null | ResizeObserver = null;
  let mutationObserver: MutationObserver | null = null;

  onMounted(() => {
    // 等待 slot 内容渲染后首次检测
    deferredCheck();

    // 监听容器自身尺寸变化（窗口 resize 等）
    if (wrapperRef.value) {
      resizeObserver = new ResizeObserver(deferredCheck);
      resizeObserver.observe(wrapperRef.value);
    }

    // 监听内容 DOM 变化（slot 内容动态增减子元素）
    if (scrollContainer.value) {
      mutationObserver = new MutationObserver(deferredCheck);
      mutationObserver.observe(scrollContainer.value, {
        childList: true,
        subtree: true,
      });
    }
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
  });
</script>

<style scoped lang="postcss">
  .overflow-ctrl {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    overflow: hidden;

    /* 仅在箭头展示时保留左右间距，避免空白占位 */
    &.with-arrows {
      padding: 0 16px;
    }
  }

  .scroll-container {
    flex: 1;
    min-width: 100px;
    overflow-x: scroll;

    /* 隐藏滚动条 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */

    &::-webkit-scrollbar {
      display: none; /* Chrome Safari */
    }
  }

  .arrow-btn {
    position: absolute;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 32px;
    cursor: pointer;
    color: #979ba5;
    transition: color 0.2s;
    background-color: #f0f1f5;

    &:hover {
      color: #3a84ff;
    }

    &.left {
      left: 0;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
    }

    &.right {
      right: 0;
      box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
    }
  }
</style>
