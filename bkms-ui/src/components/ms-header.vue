<template>
  <div
    v-if="title"
    class="flex items-center h-[52px] shadow px-[24px] bg-[#fff]"
  >
    <span
      class="bkms-icon bkms-icon-return-small cursor-pointer text-[36px]"
      :style="{ color: backColor }"
      @click="handleBack"
    >
    </span>
    <span class="text-[16px]">{{ title }}</span>
    <slot></slot>
  </div>
</template>
<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  interface Props {
    back?: boolean;
    backColor?: string;
    title?: string;
    triggerBack?: () => void;
  }

  const props = withDefaults(defineProps<Props>(), {
    backColor: '#3a84ff',
  });

  const router = useRouter();
  function handleBack() {
    if (props?.triggerBack) {
      props.triggerBack();
    } else {
      router.back();
    }
  }
</script>
