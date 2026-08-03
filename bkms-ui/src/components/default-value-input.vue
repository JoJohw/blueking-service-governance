<template>
  <Popover
    v-if="defaultValue"
    ref="popoverRef"
    placement="bottom-start"
    theme="light"
    trigger="click"
  >
    <Input
      v-model.trim="value"
      :class="isShowChange ? '!border-[#F8B64F]' : ''"
      clearable
      :placeholder="inputConfig?.placeholder"
      :readonly="inputConfig?.readonly"
      :style="widthStyle"
    />
    <template #content>
      <div
        class="flex justify-between w-[240px] cursor-pointer"
        @click="handleClickDefaultValue"
      >
        <span class="text-[#4D4F56]">{{ defaultValue }}</span>
        <span class="text-[#C4C6CC]">&lt;{{ $t('默认值') }}&gt;</span>
      </div>
    </template>
  </Popover>
  <Input
    v-else
    v-model.trim="value"
    :class="isShowChange ? '!border-[#F8B64F]' : ''"
    clearable
    :placeholder="inputConfig?.placeholder"
    :readonly="inputConfig?.readonly"
    :style="widthStyle"
  />
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { Input, Popover } from 'bkui-vue';

  interface IProps {
    defaultValue?: number | string;
    width?: number;
    inputConfig: {
      placeholder?: string;
      readonly?: boolean;
    };
  }

  const value = defineModel<number | string>('value');
  const props = withDefaults(defineProps<IProps>(), {
    defaultValue: '',
  });
  const popoverRef = ref();

  const isShowChange = computed(() => {
    // 排除0，判断是否为空
    if (props.defaultValue === null || props.defaultValue === undefined || props.defaultValue === '') {
      return !!value.value;
    }
    return value.value !== props.defaultValue;
  });

  const widthStyle = computed(() => {
    if (!props.width) return {};
    return { width: `${props.width}px` };
  });

  const handleClickDefaultValue = () => {
    value.value = props.defaultValue;
    popoverRef.value?.hide();
  };
</script>
