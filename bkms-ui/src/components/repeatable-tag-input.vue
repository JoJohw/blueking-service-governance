<template>
  <TagInput
    :ref="(el: typeof TagInput) => refFn?.(el)"
    allow-auto-match
    allow-create
    :clear-text-space="false"
    clearable
    collapse-tags
    :display-key="displayKey"
    has-delete-icon
    :list="localValue"
    :model-value="localValueIds"
    :save-key="saveKey"
    :tag-overflow-tips="{
      theme: 'dark',
    }"
    v-bind="$attrs"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';

  import { TagInput } from 'bkui-vue';
  import { uniqueId } from 'lodash-es';

  interface IProps {
    refFn?: (el: HTMLElement) => void;
  }

  defineProps<IProps>();

  const modelValue = defineModel<string[]>({ default: () => [] });

  const emit = defineEmits(['change']);

  const saveKey = 'uniqueId';
  const displayKey = 'label';

  // 使用对象形式,通过唯一 ID 区分重复值
  const localValue = ref<{ label: string; uniqueId: string }[]>([]);

  // 计算属性：返回 uniqueId 数组用于绑定 model-value
  const localValueIds = computed(() => localValue.value.map(item => item.uniqueId));

  // 将字符串数组转换为对象数组
  const initLocalValue = (values: string[]) => {
    return values.map(value => ({
      uniqueId: uniqueId('tag_'),
      label: value,
    }));
  };

  // 监听外部 modelValue 变化
  watch(
    modelValue,
    newValue => {
      if (newValue && Array.isArray(newValue)) {
        localValue.value = initLocalValue(newValue);
      }
    },
    { immediate: true },
  );

  // 处理变化事件
  const handleChange = (ids: string[]) => {
    // 根据 id 数组更新对象数组
    const newList: { label: string; uniqueId: string }[] = [];
    const usedIndices = new Set<number>();

    ids.forEach(id => {
      const existIndex = localValue.value.findIndex((item, idx) => item.uniqueId === id && !usedIndices.has(idx));
      if (existIndex !== -1) {
        newList.push(localValue.value[existIndex]);
        usedIndices.add(existIndex);
      } else {
        // 新创建的标签，id 就是 label
        newList.push({
          uniqueId: uniqueId('tag_'),
          label: id,
        });
      }
    });

    localValue.value = newList;

    // 提取原始值并更新
    const originalValues = newList.map(item => item.label);
    modelValue.value = originalValues;
    emit('change', originalValues);
  };

  onMounted(() => {
    // 初始化时触发一次 change 事件
    const values = localValue.value.map(item => item.label);
    emit('change', values);
  });
</script>
