<template>
  <Loading
    class="w-full h-full"
    :loading="isLoading"
  >
    <iframe
      allow="fullscreen"
      allowfullscreen
      frameborder="0"
      height="100%"
      :src="url"
      width="100%"
      @error="isLoading = false"
      @load="isLoading = false"
    >
    </iframe>
  </Loading>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { Loading } from 'bkui-vue';
  import { ApiServerService } from '~/api/modules/bkmsserver';
  import { objectToUrlParams } from '~/common/util';
  import { useSpaceStore } from '~/stores/space';

  interface BaseQueryParams {
    apm_submenu?: number;
    needMenu?: boolean | number;
  }

  interface IProps {
    baseQueryParams: BaseQueryParams;
    observabilityQuery: ObservabilityType; // 观测参数
    type: 'application' | 'service';
  }
  interface ObservabilityType {
    dashboardId: string;
    'filter-app_name': string;
    'filter-service_name'?: string;
    from: string;
    interval: string;
    isGroupByLimit: boolean;
    method: string;
    preciseFilter: boolean;
    queryString: string;
    refreshInterval: number;
    sceneType: string;
    timezone: string;
    to: string;
  }

  const props = defineProps<IProps>();
  const spaceStore = useSpaceStore();

  const isLoading = ref(true);
  const bizId = ref<string>('');

  const baseQueryParams = computed(() => ({
    ...props.baseQueryParams,
    bizId: bizId.value,
  }));

  const observabilityQuery = computed(() => ({
    ...props.observabilityQuery,
    sceneId: props.type === 'service' ? 'apm_service' : 'apm_application',
  }));

  const url = computed(() => {
    const baseUrl = `${import.meta.env.BK_MONITOR}`;
    const prefixParams = objectToUrlParams(baseQueryParams.value);
    const suffixParams = objectToUrlParams(observabilityQuery.value);
    return `${baseUrl}/?${prefixParams}#/apm/${props.type}?${suffixParams}`;
  });

  // 获取 bizId (bkMonitorProjectID)
  async function fetchBizId() {
    const workspaceData = await ApiServerService.GetWorkspace({
      workspaceID: spaceStore.currentSpace,
    }).catch(() => null);
    if (workspaceData) {
      bizId.value = workspaceData.bkSystems?.bkMonitorProjectID || '';
    }
  }

  fetchBizId();
</script>
