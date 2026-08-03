<template>
  <div class="border-[1px] border-[#DCDEE5] max-h-[300px] bg-[#fff]">
    <div class="flex items-center h-[48px] text-[12px] text-[#4D4F56] px-[24px] border-b-[1px] border-[#DCDEE5]">
      <span class="font-bold">{{ $t('校验结果') }}</span>
      <span
        :class="['inline-block w-[24px] h-[16px] rounded-[8px]', 'bg-[#E1ECFF] text-center ml-[4px] text-[#3A84FF]']"
        >{{ (data?.length || 0) + (errorLines?.length || 0) }}</span
      >
    </div>
    <div class="p-[16px]">
      <Alert
        v-for="(item, index) in errorLines"
        :key="index"
        class="mb-[8px]"
        theme="danger"
        :title="`${$t('行 {0}, 列 {1}, 异常 {2}', [item.startLineNumber, item.startColumn, item.message])}`"
      >
      </Alert>
      <Alert
        v-if="data?.length"
        class="min-h-[50px] max-h-[150px] mb-[10px] overflow-auto"
        theme="warning"
        :title="$t('校验失败')"
      >
        <template #icon></template>
        <template #title>
          <div class="leading-[22px]">{{ $t('检测到如下异常') }}</div>
          <div
            v-for="(item, index) in data"
            :key="`${index}-${item.status}`"
            class="leading-[22px] flex items-center"
          >
            <i class="bkms-icon bkms-icon-triangle-warning text-[14px] text-[#F59500]"></i>
            <span class="ml-[8px]">{{ item?.skippedReason }}</span>
          </div>
        </template>
      </Alert>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { Alert } from 'bkui-vue';

  import type { ArrgResultItemOutputObj } from '~/@types/v1/app-config-files';
  import type { IMonacoEditorErrorMarkerItem } from '~/common/util';

  interface IProps {
    data?: Array<ArrgResultItemOutputObj>;
    errorLines?: Array<IMonacoEditorErrorMarkerItem>;
  }
  defineProps<IProps>();
</script>
