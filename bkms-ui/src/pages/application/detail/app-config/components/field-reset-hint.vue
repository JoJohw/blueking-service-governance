<template>
  <ResetIcon
    v-if="showReset"
    class="absolute top-[-20px] right-0 z-[9]"
    @click="$emit('reset')"
  />
  <p
    v-if="tip"
    class="mt-[4px] text-[12px] text-[#979BA5]"
  >
    {{ tip }}
  </p>
</template>

<script setup lang="ts">
  import ResetIcon from './reset-icon.vue';

  defineProps<{
    /** 是否显示重置图标 */
    showReset: boolean;
    /** 默认值提示文字（空字符串时不显示） */
    tip: string;
  }>();

  defineEmits<{
    reset: [];
  }>();
</script>
