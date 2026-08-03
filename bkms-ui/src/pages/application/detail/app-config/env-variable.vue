<template>
  <div class="px-[24px] py-[20px] h-full overflow-auto">
    <Skeleton
      :full-height="false"
      :loading="isLoading || appDetailStore.loading"
    >
      <template #loading>
        <Layout.shape
          :height="28"
          width="100%"
        />
        <div class="my-[16px] pl-[16px]">
          <Layout.shape
            class="mt-[12px]"
            :height="32"
            :width="240"
          />
          <Layout.shape
            class="mt-[12px] mx-[16px]"
            :height="32"
          />
          <Layout.shape
            class="mt-[12px]"
            :height="32"
            :width="110"
          />
          <Layout.table class="mt-[12px] pb-20px" />
        </div>
      </template>
      <!-- 环境变量 -->
      <AppEnvVariableManagement />
    </Skeleton>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeMount, ref } from 'vue';

  import Layout from '~/components/skeleton/skeleton-layout';
  import AppEnvVariableManagement from '~/pages/application/detail/base-info/trpc/app-env-variable-management.vue';
  import { useAppDetail } from '~/stores/app-detail';

  const appDetailStore = useAppDetail();

  /**
   * 获取应用数据
   */
  const isLoading = ref(false);
  async function getData() {
    isLoading.value = true;
    try {
      await appDetailStore.fetchAppDetail();
    } finally {
      isLoading.value = false;
    }
  }

  onBeforeMount(() => {
    getData();
  });
</script>
