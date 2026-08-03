<template>
  <Form
    ref="formRef"
    form-type="vertical"
    :model="innerFormData"
    :rules="formRules"
  >
    <div class="flex items-start gap-[16px]">
      <Form.FormItem
        class="flex-1"
        :label="$t('命名空间')"
        property="namespace"
      >
        <Input
          v-model="innerFormData.namespace"
          disabled
          placeholder="bcs-system"
        />
      </Form.FormItem>

      <Form.FormItem
        class="flex-1"
        :label="$t('Chart 版本')"
        property="chartVersion"
        required
      >
        <Select
          v-model="innerFormData.chartVersion"
          filterable
          :list="chartVersionOptions"
          :placeholder="$t('请选择Chart版本')"
        />
      </Form.FormItem>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';

  import { Form, Input, Select } from 'bkui-vue';
  import { useI18n } from 'vue-i18n';
  import { ClusterAddonInfoOutput } from '~/@types/v1/cluster-addon';

  interface Emits {
    (e: 'update:formData', value: FormDataOutput): void;
  }

  interface FormDataOutput {
    chartVersion: string;
    namespace: string;
  }

  interface Props {
    addonInfo?: ClusterAddonInfoOutput | null;
    formData?: FormDataOutput | null;
    isUpdate?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    addonInfo: null,
    formData: null,
    isUpdate: false,
  });

  const emit = defineEmits<Emits>();

  defineExpose({
    validate,
  });

  const { t } = useI18n();

  // 内部表单数据
  const innerFormData = reactive<FormDataOutput>({
    namespace: 'bcs-system',
    chartVersion: '',
  });

  // Chart 版本选项：从 chartInfo.availableVersions 获取
  const chartVersionOptions = computed(() => {
    const versions = props.addonInfo?.chartInfo?.availableVersions || [];
    return versions.map(v => ({ label: v, value: v }));
  });

  const formRef = ref();

  // 表单验证规则
  const formRules = {
    chartVersion: [
      {
        required: true,
        message: () => t('请选择Chart版本'),
        trigger: 'change',
      },
    ],
  };

  // 监听 addonInfo 变化，根据安装/更新模式设置不同的默认值
  watch(
    () => props.addonInfo,
    addonInfo => {
      if (addonInfo) {
        if (props.isUpdate) {
          innerFormData.chartVersion = addonInfo.installInfo?.currentChartVersion || '';
          innerFormData.namespace = 'bcs-system';
        } else {
          innerFormData.chartVersion = addonInfo.chartInfo?.defaultChartVersion || '';
          innerFormData.namespace = 'bcs-system';
        }
      }
      emitFormData();
    },
    { immediate: true },
  );

  // 监听内部表单变化，向外同步
  watch(innerFormData, () => {
    emitFormData();
  });

  /** 向外同步表单数据 */
  function emitFormData() {
    emit('update:formData', { ...innerFormData });
  }

  /** 校验表单 */
  async function validate(): Promise<void> {
    await formRef.value?.validate?.();
  }
</script>
