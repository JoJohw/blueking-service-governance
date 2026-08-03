<template>
  <CollapseCard>
    <template #header-left>
      <span class="text-[14px] font-bold">{{ kind }}</span>
      <Tag
        class="ml-[8px]"
        theme="success"
      >
        {{ $t('附加资源') }}
      </Tag>
    </template>
    <template #header-right>
      <div class="flex items-center gap-[4px] text-[12px] text-[#4D4F56]">
        <span
          class="inline-block bg-[#699DF4] w-[12px] h-[12px] border-[#3A84FF] border-[1px] border-solid rounded-[4px] mr-[6px]"
        ></span>
        <span>{{ $t('附加资源') }}</span>
      </div>
    </template>
    <MsEditor
      class="!h-[300px] w-full"
      :model-value="manifestYaml"
      :readonly="true"
    />
  </CollapseCard>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  import { Tag } from 'bkui-vue';
  import { PreviewResourceOutput } from '~/@types/v1/component-defs';
  import { convertToYaml } from '~/common/util';
  import MsEditor from '~/components/monaco-editor/ms-editor.vue';

  const props = defineProps<Required<Pick<PreviewResourceOutput, 'kind' | 'manifest'>>>();

  const manifestYaml = computed(() => convertToYaml(props.manifest));
</script>
