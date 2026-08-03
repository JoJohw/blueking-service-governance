<template>
  <div class="px-[32px] py-[24px] min-w-[520px] h-[252px] bg-[#fff]">
    <span class="text-[#313238] text-[14px] font-bold">{{ $t('基础信息') }}</span>
    <div class="grid grid-cols-2 gap-y-[24px] pt-[24px]">
      <FieldItem
        container-height="auto"
        :field-value="$t('集群 ID')"
        :field-width="70"
        :value="clusterInfo?.clusterID"
        value-color="#313238"
      >
      </FieldItem>
      <FieldItem
        container-height="auto"
        :field-value="$t('集群名称')"
        :field-width="70"
        :value="clusterInfo?.clusterName"
        value-color="#313238"
      >
      </FieldItem>
      <FieldItem
        container-height="auto"
        :field-value="$t('K8s 版本')"
        :field-width="70"
        :value="clusterInfo?.clusterVersion"
        value-color="#313238"
      >
      </FieldItem>
      <FieldItem
        container-height="auto"
        :field-value="$t('区域')"
        :field-width="70"
        :value="clusterInfo?.region"
        value-color="#313238"
      >
      </FieldItem>
      <FieldItem
        class="col-span-2"
        container-height="auto"
        :field-value="$t('集群类型')"
        :field-width="70"
        :value="clusterInfo?.clusterType"
        value-color="#313238"
      >
      </FieldItem>
      <FieldItem
        container-height="auto"
        field-value="VPC ID"
        :field-width="70"
        :value="clusterInfo?.vpcID"
        value-color="#313238"
      >
      </FieldItem>
      <FieldItem
        container-height="auto"
        :field-value="$t('集群 CIDR')"
        :field-width="70"
        :value="clusterInfo?.networkParams?.cidrs?.join(', ')"
        value-color="#313238"
      >
      </FieldItem>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ClusterReportOutput } from '~/@types/v1/bkintegrations-kubeinsight';

  interface IProps {
    clusterInfo?: ClusterReportOutput['clusterInfo'];
  }
  defineProps<IProps>();
</script>
