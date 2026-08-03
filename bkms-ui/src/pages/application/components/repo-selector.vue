<template>
  <Select
    filterable
    :loading="loading"
    :value="modelValue"
    @change="handleProjectChange"
  >
    <template #prefix>
      <span class="px-[10px] text-[#63656E] border-r-[#c4c6cc] border-r leading-[30px]">
        {{ $t('工蜂') }}
      </span>
    </template>
    <Select.Option
      v-for="p in projectList"
      :key="p.id"
      :name="p.httpUrl"
      :value="p.httpUrl"
    />
  </Select>
</template>
<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  import { Select } from 'bkui-vue';
  import { getGitProjects } from '~/api/modules/custom';

  interface IProject {
    httpUrl: string;
    id: string;
    lastActivity: number;
    name: string;
    nameWithNameSpace: string;
    sshUrl: string;
  }

  interface IProps {
    modelValue: string;
    workspace: string;
  }

  const props = defineProps<IProps>();

  const emits = defineEmits(['update:modelValue']);

  // 代码库&代码库别名
  const projectList = ref<IProject[]>([]);
  const loading = ref<boolean>(false);
  async function getProjects() {
    if (!props.workspace) return;
    loading.value = true;
    const res = (await getGitProjects({
      projectId: props.workspace,
    }).catch(() => ({ data: { project: [] } }))) as { project: IProject[] };
    projectList.value = res?.project || [];
    loading.value = false;
  }
  function handleProjectChange(url: string) {
    const project = projectList.value.find(p => p.httpUrl === url);
    emits('update:modelValue', project?.httpUrl);
  }

  onMounted(() => {
    getProjects();
  });
</script>
