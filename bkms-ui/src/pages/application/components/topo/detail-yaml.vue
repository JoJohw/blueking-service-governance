<template>
  <div class="h-full p-[24px]">
    <Loading
      class="h-full"
      :loading="loading"
    >
      <div
        v-if="manifest"
        class="h-full flex flex-col"
      >
        <div
          v-if="manifest.truncated"
          class="px-[24px] py-[8px] bg-[#FFF8E6] text-[12px] text-[#FF9C01] shrink-0"
        >
          {{ $t('内容已被截断，仅展示部分 Manifest') }}
        </div>
        <div class="flex-1 min-h-0">
          <MsEditor
            v-model="manifest.content"
            :lang="manifest.format || 'yaml'"
            readonly
          />
        </div>
      </div>
      <Exception
        v-else-if="!loading"
        scene="empty"
        type="empty"
      >
        {{ $t('暂无数据') }}
      </Exception>
    </Loading>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue';

  import { Exception, Loading } from 'bkui-vue';
  import { TopologyNodeManifestOutputObj } from '~/@types/v1/topology';
  import { ApiServerService } from '~/api/modules/bkmsserver';
  import MsEditor from '~/components/monaco-editor/ms-editor.vue';

  const props = defineProps<{
    appId: string;
    envName: string;
    nodeId: string;
  }>();

  const loading = ref(false);
  const manifest = ref<null | TopologyNodeManifestOutputObj>(null);

  async function fetchManifest() {
    if (!props.nodeId || !props.appId || !props.envName) return;
    loading.value = true;
    try {
      manifest.value = await ApiServerService.GetTopologyNodeManifest({
        appID: props.appId,
        envName: props.envName,
        trafficLaneName: '',
        nodeID: props.nodeId,
      });
    } catch (_) {
      manifest.value = null;
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => props.nodeId,
    newId => {
      if (newId) {
        fetchManifest();
      }
    },
  );

  onMounted(() => {
    if (props.nodeId) {
      fetchManifest();
    }
  });
</script>
