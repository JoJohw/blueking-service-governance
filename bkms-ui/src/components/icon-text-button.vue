<template>
  <Button
    :class="['!px-[8px] !py-[6px] select-none', { '!bg-[#E1ECFF] rounded-[2px]': !!active }]"
    :disabled="disabled"
    text
    theme="primary"
    @click="handleClick"
  >
    <i
      v-if="icon"
      :class="['text-[#3A84FF] text-[14px] mr-[4px]', icon, { 'text-[#dcdee5] cursor-not-allowed': disabled }]"
    ></i>
    <span class="text-[12px]">{{ text }}</span>
  </Button>
</template>
<script lang="ts" setup>
  import { Button } from 'bkui-vue';

  interface IEmit {
    (e: 'click'): void;
  }
  interface IProps {
    active?: boolean;
    disabled?: boolean;
    icon?: string;
    text: string;
  }
  defineProps<IProps>();
  const emits = defineEmits<IEmit>();

  function handleClick() {
    emits('click');
  }
</script>
