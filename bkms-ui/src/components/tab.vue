<template>
  <div class="flex items-center h-[32px] bg-[#F0F1F5] rounded-[2px] px-[4px] flex-nowrap">
    <div
      v-for="(item, index) in tabs"
      :key="index"
      :class="[
        'h-[24px] text-[12px] leading-[24px] text-center px-[12px] text-nowrap',
        item.disabled
          ? 'text-[#C4C6CC] cursor-not-allowed'
          : active === item.name
            ? 'text-[#3A84FF] bg-[#FFF] cursor-pointer'
            : 'text-[#4D4F56] cursor-pointer',
      ]"
      @click="updateTabActive(item)"
    >
      <span
        v-if="item.icon"
        class="text-[14px]"
        :class="item.icon"
      ></span>
      {{ item.label }}
    </div>
  </div>
</template>
<script setup lang="ts">
  type Tab = { disabled?: boolean; icon?: string; label: string; name: string };
  defineProps<{
    active: number | string;
    tabs: Tab[];
  }>();

  // 定义自定义事件
  const emit = defineEmits(['update:active', 'change']);

  function updateTabActive(newTab: Tab) {
    if (newTab.disabled) return;
    emit('update:active', newTab.name);
    emit('change', newTab.name);
  }
</script>
