<template>
  <Select
    :key="selectedValue"
    v-model="selectedValue"
    filterable
    :input-search="false"
    :loading="loading"
    :multiple="multiple"
    multiple-mode="tag"
  >
    <Select.Option
      v-for="item in namespaceList"
      :id="item.name"
      :key="item.name"
      :label="item.name"
    >
    </Select.Option>
  </Select>
</template>
<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue';

  import { Select } from 'bkui-vue';
  import { ApiServerService } from '~/api/modules/bkmsserver';

  import type { Namespace } from '~/@types/bcs';

  interface IProps {
    clusterId: string;
    multiple?: boolean;
    projectID: string;
    value: string | string[];
  }

  const props = defineProps<IProps>();

  const emits = defineEmits(['update:value']);

  const selectedValue = ref<string | string[]>(props.value);

  const namespaceList = ref<Namespace[]>([]);

  const loading = ref(false);
  async function getData() {
    if (!props.projectID || !props.clusterId) return;
    loading.value = true;
    const result = await ApiServerService.ListNamespacesByCluster(
      {
        projectID: props.projectID,
        clusterID: props.clusterId,
      },
      { validateCode: false },
    ).catch(() => []);
    namespaceList.value = result || [];
    loading.value = false;
  }

  watch([() => props.clusterId, () => props.projectID], async () => {
    await getData();
  });
  watch(
    () => selectedValue.value,
    val => {
      emits('update:value', val);
    },
  );
  watch(
    () => props.value,
    () => {
      selectedValue.value = props.value;
    },
  );

  onMounted(async () => {
    await getData();
  });
</script>
