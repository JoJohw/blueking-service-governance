<template>
  <Select
    v-model="modelValue"
    class="mr-[16px] min-w-[240px]"
    :clearable="false"
  >
    <template #prefix>
      <FormPrefix :label="$t('泳道')" />
    </template>
    <template v-if="type === 'helm'">
      <Select.Option
        v-for="item in list as TrafficLaneOutputObj[]"
        :id="item.name"
        :key="item.name"
        :name="item.name"
      >
        <FlexRow class="w-full">
          <template #left>{{ item.name }}</template>
          <template #right>
            <bk-tag
              v-if="item.type === 'base'"
              class="mr-[2px]"
            >
              {{ $t('基线') }}
            </bk-tag>
            <bk-tag v-if="item?.serviceVersionLabels?.version">
              {{ item.serviceVersionLabels.version }}
            </bk-tag>
            <span
              v-else
              class="text-[#979BA5]"
              >{{ $t('未部署') }}</span
            >
          </template>
        </FlexRow>
      </Select.Option>
    </template>
  </Select>
</template>

<script lang="ts" setup>
  import { Select } from 'bkui-vue';
  import { TrafficLaneOutputObj } from '~/@types/env';

  type AppTypeLaneMap = {
    helm: TrafficLaneOutputObj[];
  };

  interface IProps {
    list: AppTypeLaneMap[keyof AppTypeLaneMap];
    type: keyof AppTypeLaneMap;
  }

  const modelValue = defineModel('modelValue');
  defineProps<IProps>();
</script>
