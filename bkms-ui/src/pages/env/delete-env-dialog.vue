<template>
  <Dialog
    v-model:is-show="isShow"
    :width="500"
    @closed="handleClose"
  >
    <template #header>
      <div class="flex flex-col items-center">
        <SvgIcon
          :height="42"
          icon="bkms-icon-tishi"
          :width="42"
        />
        <span class="text-[#313238] text-[20px] leading-[32px] text-center mt-[18px]"> {{ $t('确定删除环境') }}? </span>
      </div>
    </template>
    <div class="bg-[#F5F7FA] mb-[10px] py-[12px] px-[14px] text-[12px]">
      {{ $t('删除环境后，所有配置、环境变量和操作记录将永久删除') }}
    </div>
    <i18n-t
      class="text-[12px]"
      keypath="该操作不可恢复，请输入环境名称：{0} 进行确认"
    >
      <span
        v-bk-tooltips="$t('点击复制')"
        class="font-bold text-[#EA3636] cursor-pointer rounded-[2px] px-[4px] hover:bg-[#FFEBEB]"
        @click="copyText(envName)"
      >
        {{ envName }}
      </span>
    </i18n-t>
    <Input
      v-model.trim="formData.confirmName"
      class="mt-[6px]"
      clearable
      :placeholder="`${$t('请输入')}${$t('待删除环境名称')}`"
    />
    <template #footer>
      <div class="flex justify-center">
        <span
          v-bk-tooltips="{
            content: $t('请输入环境名称'),
            disabled: formData.confirmName === envName,
          }"
        >
          <Button
            class="mr-[8px]"
            :disabled="formData.confirmName !== envName"
            :loading="confirmLoading"
            theme="danger"
            @click="handleConfirm"
          >
            {{ $t('删除') }}
          </Button>
        </span>
        <Button
          :loading="confirmLoading"
          @click="handleClose"
        >
          {{ $t('取消') }}
        </Button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';

  import { Button, Dialog, Input, Message } from 'bkui-vue';
  import { useI18n } from 'vue-i18n';
  import { copyText } from '~/common/util';

  const { t } = useI18n();

  const isShow = defineModel<boolean>('isShow');
  const props = defineProps<{
    envDisplayName: string;
    envName: string;
  }>();
  const emit = defineEmits<{
    confirm: [];
  }>();

  const confirmLoading = ref(false);
  const formData = ref({
    confirmName: '',
  });

  function handleClose() {
    isShow.value = false;
    formData.value.confirmName = '';
  }

  async function handleConfirm() {
    if (formData.value.confirmName !== props.envName) {
      Message({
        message: t('环境名称不一致，请重新输入'),
        theme: 'error',
      });
      return;
    }
    confirmLoading.value = true;
    try {
      emit('confirm');
    } finally {
      confirmLoading.value = false;
    }
  }
</script>

<style lang="postcss" scoped>
  :deep(.bk-modal-body) {
    .bk-modal-header {
      .bk-dialog-header {
        padding-top: 48px;
      }
    }
    .bk-modal-footer {
      .bk-dialog-footer {
        border: none;
        background-color: unset;
        padding-top: 0;
        padding-bottom: 24px;
      }
    }
  }
</style>
