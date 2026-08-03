<template>
  <Dialog
    v-model:is-show="isShow"
    :width="480"
    @closed="handleClose"
  >
    <template #header>
      <div class="flex flex-col items-center pt-[10px]">
        <SvgIcon
          :height="42"
          icon="bkms-icon-tishi"
          :width="42"
        />
        <span class="text-[#313238] text-[20px] leading-[32px] text-center mt-[18px]">
          {{ dialogTitle }}
        </span>
      </div>
    </template>
    <div class="flex flex-col items-center text-[12px] text-[#4D4F56]">
      <p class="h-[34px] w-full !text-start">
        {{ tipsText }}
      </p>
      <Table
        class="mb-[48px] w-full"
        :data="deployedApps"
        :pagination="tablePagination"
      >
        <TableColumn
          field="appName"
          :label="$t('应用名称')"
          :min-width="120"
        />
        <TableColumn
          field="deployStatus"
          :label="$t('部署状态')"
          :min-width="120"
        >
          <template #default="{ row }">
            <StatusIcon
              :status="row.deployStatus"
              :status-color-map="getDeployStatusMaps(row.appType).statusColorMap"
              :status-text-map="getDeployStatusMaps(row.appType).statusTextMap"
            />
          </template>
        </TableColumn>
      </Table>
      <Button
        class="w-[88px]"
        @click="handleClose"
      >
        {{ $t('关闭') }}
      </Button>
    </div>
    <template #footer> </template>
  </Dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';

  import { Table, TableColumn } from '@blueking/table';
  import { Button, Dialog } from 'bkui-vue';
  import { EnvAppDeployStatusOutput } from '~/@types/v1/env';
  import StatusIcon from '~/components/status-icon.vue';
  import { useDeployStatusMap } from '~/composables/use-deploy-status';

  const isShow = defineModel<boolean>('isShow');

  const props = defineProps<{
    deployedApps: EnvAppDeployStatusOutput[];
    dialogTitle: string;
    tipsText: string;
  }>();

  const { getDeployStatusMaps } = useDeployStatusMap();

  // 前端分页配置
  const tablePagination = ref({
    current: 1,
    limit: 5,
    count: props.deployedApps.length,
    limitList: [5, 10, 20, 50],
  });

  function handleClose() {
    isShow.value = false;
  }
</script>

<style lang="less" scoped>
  :deep(.bk-modal-body) {
    .bk-dialog-content {
      margin-top: 30px;
      margin-bottom: 18px;
    }
    .bk-modal-footer {
      display: none;
    }
  }
</style>
