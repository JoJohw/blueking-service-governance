<template>
  <ToggleCard
    content-class="!p-0 !mt-[12px]"
    :name="$t('组件配置')"
    type="normal"
  >
    <component
      :is="mainFormComponent"
      ref="formRef"
      v-bind="formProps"
      @update:form-data="handleMainFormUpdate"
    />
  </ToggleCard>

  <ToggleCard
    v-if="hasPerfForm"
    content-class="!p-0 !mt-[12px]"
    :name="$t('Agones 性能参数优化')"
    type="normal"
  >
    <AgonesPerfForm
      ref="perfFormRef"
      v-bind="formProps"
      @update:form-data="handlePerfFormUpdate"
    />
  </ToggleCard>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { Component } from 'vue';

  import { merge } from 'lodash-es';
  import { ClusterAddonInfoOutput } from '~/@types/v1/cluster-addon';

  import AgonesConfigForm from './config-forms/agones-config-form.vue';
  import AgonesPerfForm from './config-forms/agones-perf-form.vue';
  import CommonConfigForm from './config-forms/common-config-form.vue';
  import IngressConfigForm from './config-forms/ingress-config-form.vue';

  interface Emits {
    (e: 'update:formData', value: Record<string, unknown>): void;
  }

  interface Props {
    addonInfo?: ClusterAddonInfoOutput | null;
    componentsName?: string;
    formData?: null | Record<string, unknown>;
    isUpdate?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    addonInfo: null,
    componentsName: '',
    formData: null,
    isUpdate: false,
  });

  const emit = defineEmits<Emits>();

  defineExpose({
    /** 校验所有表单 */
    validate,
  });

  // 组件映射表：新增组件只需在这里注册，无需改动模板和方法
  const componentMap: Record<string, Component> = {
    'bcs-ingress-controller': IngressConfigForm,
    agones: AgonesConfigForm,
  };

  const mainFormComponent = computed(() => componentMap[props.componentsName] ?? CommonConfigForm);
  const hasPerfForm = computed(() => props.componentsName === 'agones');

  // 统一向下传递的 props
  const formProps = computed(() => ({
    addonInfo: props.addonInfo,
    isUpdate: props.isUpdate,
  }));

  const formRef = ref<InstanceType<typeof CommonConfigForm>>();
  const perfFormRef = ref<InstanceType<typeof AgonesPerfForm>>();

  // 缓存子表单输出数据
  let mainFormData: null | Record<string, unknown> = null;
  let perfFormData: null | { enableOptimization: boolean; values: Record<string, unknown> } = null;

  /** 合并主表单和性能表单数据后向外同步 */
  function emitMergedFormData() {
    if (!mainFormData) return;

    if (!hasPerfForm.value || !perfFormData?.enableOptimization || !perfFormData.values) {
      emit('update:formData', { ...mainFormData });
      return;
    }

    emit('update:formData', {
      ...mainFormData,
      values: merge({}, (mainFormData as Record<string, unknown>).values, perfFormData.values),
    });
  }

  /** 主表单数据更新 */
  function handleMainFormUpdate(data: Record<string, unknown>) {
    mainFormData = data;
    emitMergedFormData();
  }

  /** 性能表单数据更新 */
  function handlePerfFormUpdate(data: { enableOptimization: boolean; values: Record<string, unknown> }) {
    perfFormData = data;
    emitMergedFormData();
  }

  async function validate(): Promise<boolean> {
    try {
      const tasks: Promise<void>[] = [];
      const main = formRef.value?.validate?.();
      if (main) tasks.push(main);
      if (hasPerfForm.value) {
        const perf = perfFormRef.value?.validate?.();
        if (perf) tasks.push(perf);
      }
      await Promise.all(tasks);
      return true;
    } catch {
      return false;
    }
  }
</script>
