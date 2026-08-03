<template>
  <Select
    :disabled="disabled"
    display-key="version"
    filterable
    id-key="version"
    :list="versionList"
    :loading="loading"
    :model-value="modelValue"
    :placeholder="$t('请选择版本')"
    :with-validate="false"
    @change="handleChange"
  >
  </Select>
</template>
<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import { Select } from 'bkui-vue';
  import { RenderManagerService } from '~/api/modules/rendermanager';

  import type { Component } from '~/@types/rendermanager';

  const props = defineProps<{
    // 是否默认选中第一个版本
    defaultVersion?: boolean;
    disabled?: boolean;
    modelValue: string;
    name?: string;
    type?: string;
  }>();

  const emits = defineEmits<{
    (e: 'update:modelValue', val: string): void;
    (e: 'change' | 'init', component: Component): void;
  }>();

  const loading = ref(false);
  const versionList = ref<Component[]>([]);

  function handleChange(val: string) {
    const com = versionList.value.find(item => item.version === val);
    if (com) {
      emits('change', com);
    }
    emits('update:modelValue', val);
  }

  async function handleGetData() {
    if (!props?.name || !props?.type) {
      versionList.value = [];
      return;
    }
    loading.value = true;
    versionList.value = (await RenderManagerService.GetComponent({
      name: props?.name,
      type: props?.type,
      withHistory: true,
    }).catch(() => [])) as Component[];
    loading.value = false;
    // 初始化
    const com = versionList.value.find(item => item.version === props.modelValue);
    if (com && props.modelValue) {
      emits('init', com);
    }
    if (props.defaultVersion && !props.modelValue && versionList.value.length > 0) {
      emits('update:modelValue', versionList.value[0].version);
      emits('change', versionList.value[0]);
    }
  }

  watch(
    () => [props.name, props.type],
    () => {
      handleGetData();
    },
    { immediate: true },
  );
</script>
