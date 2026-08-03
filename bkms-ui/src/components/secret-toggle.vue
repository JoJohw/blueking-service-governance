<template>
  <div class="flex items-center">
    <template v-if="!isShow">
      <div class="flex-1 font-mono tracking-wider">{{ placeholder }}</div>
      <Eye
        class="ml-[4px] cursor-pointer hover:text-[#3A84FF]"
        @click="handleToggle"
      />
    </template>
    <template v-else>
      <span class="text-[#313238]">{{ value || emptyValuePlaceholder }}</span>
      <Unvisible
        class="ml-[4px] cursor-pointer hover:text-[#3A84FF]"
        @click="handleToggle"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import { Eye, Unvisible } from 'bkui-vue/lib/icon';

  interface IProps {
    emptyValuePlaceholder?: string;
    placeholder?: string;
    showValue?: boolean;
    value: string;
  }

  const props = withDefaults(defineProps<IProps>(), {
    showValue: false,
    placeholder: '********',
    emptyValuePlaceholder: '--',
  });
  const emit = defineEmits(['toggle']);

  const isShow = ref(false);

  const handleToggle = () => {
    const target = !isShow.value;
    isShow.value = target;
    emit('toggle', target);
  };

  watch(
    () => props.showValue,
    newVal => {
      isShow.value = newVal;
    },
  );
</script>
