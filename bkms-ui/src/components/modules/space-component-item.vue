<template>
  <div
    :class="[
      'p-[12px] border border-[#DCDEE5] rounded-[2px] text-[#4D4F56] hover:bg-[#F0F5FF] hover:border-[#3A84FF] group',
      { 'bg-[#FAFBFD] border-[#DCDEE5]': disabled },
      active ? '!border-[#3A84FF]' : 'border-[#C4C6CC]',
    ]"
  >
    <FlexRow class="mb-[4px]">
      <template #left>
        <span class="font-bold text-[#000000]">{{ curCom?.displayName || curCom?.name || '--' }}</span>
      </template>
      <template #right>
        <span
          v-bk-tooltips="{
            content: disabledText,
            disabled: !disabled,
          }"
        >
          <Button
            :class="{ 'bg-[#fff]': !disabled }"
            :disabled="active || disabled"
            size="small"
            @click="handleClick"
          >
            {{ active ? $t('已选') : $t('选择') }}
          </Button>
        </span>
      </template>
    </FlexRow>
    <div class="flex">
      <span class="text-[#979BA5] mr-[4px] shrink-0">{{ $t('描述') }} : </span>
      <div class="text-[#313238]">{{ curCom?.description || '--' }}</div>
    </div>
    <div class="h-[24px] flex items-center">
      <span class="text-[#979BA5] mr-[4px] shrink-0">{{ $t('更新人') }} : </span>
      <span class="text-[#313238]">{{ curCom?.updater || '--' }}</span>
    </div>
    <div class="h-[24px] flex items-center">
      <span class="text-[#979BA5] mr-[4px] shrink-0">{{ $t('已添加实例') }} : </span>
      <span class="text-[#313238]">--</span>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue';

  import { Button } from 'bkui-vue';
  import { ComponentDefOutputObj } from '~/@types/componentdef';

  interface Emits {
    (e: 'selected', value: ComponentDefOutputObj): void;
  }
  type IProps = {
    active?: boolean;
    data: ComponentDefOutputObj;
    disabled?: boolean;
    disabledText?: string;
  };
  const props = defineProps<IProps>();

  const emits = defineEmits<Emits>();

  const curCom = computed(() => props.data || {});

  function handleClick() {
    if (props.disabled) return;
    emits('selected', props.data || {});
  }
</script>
