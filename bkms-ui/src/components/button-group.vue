<template>
  <div class="bk-button-group">
    <Button
      v-for="item in list"
      :key="item.value"
      class="text-[12px]"
      :class="modelValue === item.value ? 'is-selected' : ''"
      @click="modelValue = item.value"
    >
      {{ item.label }}
      <slot
        :data="item"
        name="suffix"
      ></slot>
    </Button>
  </div>
</template>

<script lang="ts" setup>
  import { Button } from 'bkui-vue';

  interface IProps {
    list: {
      label: string;
      value: number | string;
    }[];
  }
  const modelValue = defineModel<number | string>('modelValue');
  defineProps<IProps>();
</script>

<style lang="postcss" scoped>
  .bk-button-group {
    .is-selected {
      background-color: #3a84ff !important;
      color: #ffffff !important;
    }
  }
</style>
