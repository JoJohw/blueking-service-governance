<template>
  <Form.FormItem
    ref="formItemRef"
    :label="$t('流水线参数配置')"
    property="builder.pipeline"
  >
    <Loading :loading="buttonLoading">
      <div
        v-if="!params?.length"
        class="bg-[#F5F7FA] h-[32px] flex items-center justify-center"
      >
        <InfoLine
          class="mr-[10px]"
          fill="#979BA5"
          :width="14"
        />
        {{ !pipelineId ? $t('请先选择流水线') : $t('流水线无参数配置') }}
      </div>
      <div
        v-else
        class="bg-[#F5F7FA]"
      >
        <PipelineParamsForm
          ref="pipelineParamsRef"
          class="px-[24px] pt-[16px]"
          :params="validParams"
        />
      </div>
    </Loading>
  </Form.FormItem>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { Form, Loading } from 'bkui-vue';
  import { InfoLine } from 'bkui-vue/lib/icon';
  import { ApiServerService } from '~/api/modules/bkmsserver';
  import PipelineParamsForm from '~/pages/application/components/pipeline-params-form.vue';
  import { useSpaceStore } from '~/stores/space';

  import type { BkCIPipelineVariableOutputObj } from '~/@types/bkci';
  interface IProps {
    pipelineId: string;
  }
  const props = defineProps<IProps>();
  const emit = defineEmits(['save', 'validate']);

  const spaceStore = useSpaceStore();
  const isPipelineIdValid = ref(true);
  const buttonLoading = ref(false);

  const params = ref<BkCIPipelineVariableOutputObj[]>([]);
  const validParams = computed(() =>
    params.value
      .filter((item): item is BkCIPipelineVariableOutputObj & { id: string } => !!item.id)
      .map(item => {
        const param = { ...item };
        // 模板配置页需要允许填写流水线参数，不沿用接口返回的只读控制。
        delete param.readOnly;
        return param;
      }),
  );
  const getParamsData = async () => {
    try {
      buttonLoading.value = true;
      const res = await ApiServerService.GetBkCIPipelineVariables({
        workspaceID: spaceStore.currentSpace,
        pipelineID: props.pipelineId,
      });
      params.value = res || [];
      isPipelineIdValid.value = true;
      emit('validate', true);
    } catch {
      params.value = [];
      isPipelineIdValid.value = false;
      emit('validate', false);
    } finally {
      buttonLoading.value = false;
    }
  };

  const pipelineParamsRef = ref();

  const formItemRef = ref<InstanceType<typeof Form.FormItem> | null>(null);
  async function configValidate() {
    // 如果流水线没有参数，直接返回成功
    if (!pipelineParamsRef.value) {
      emit('save', {});
      return { valid: true, data: {} };
    }

    const result = await pipelineParamsRef.value.save();
    emit('save', result.data);
    return result;
  }

  function validate() {
    return formItemRef.value?.validate();
  }

  watch(
    () => props.pipelineId,
    val => {
      if (val) {
        getParamsData();
      } else {
        params.value = [];
        isPipelineIdValid.value = true;
        emit('validate', true);
      }
    },
    {
      immediate: true,
    },
  );

  defineExpose({
    validate,
    configValidate,
  });
</script>
