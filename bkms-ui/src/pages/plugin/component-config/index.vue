<template>
  <main class="flex flex-col w-full relative h-full bg-[#fff]">
    <span class="text-[16px] py-[14px] ml-[24px]">{{ $t('组件配置') }}</span>
    <Tab
      v-model:active="activeTab"
      class="min-h-[0px] flex-1"
      type="unborder-card"
    >
      <Tab.TabPanel
        name="instance"
        render-directive="if"
      >
        <template #label>
          <span class="text-[14px]">{{ $t('组件实例') }}</span>
        </template>
        <ComponentInstances />
      </Tab.TabPanel>
      <Tab.TabPanel
        name="component"
        render-directive="if"
      >
        <template #label>
          <span class="text-[14px]">{{ $t('组件') }}</span>
        </template>
        <SpaceComponent />
      </Tab.TabPanel>
    </Tab>
  </main>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import { Tab } from 'bkui-vue';

  import ComponentInstances from './component-list.vue';
  import SpaceComponent from './space-component.vue';

  // 状态管理
  const activeTab = ref<'component' | 'instance'>('instance');
</script>
<style lang="postcss" scoped>
  :deep(.bk-tab-header) {
    box-shadow: 0 3px 4px 0 #0000000a;
    border-bottom: none;
    z-index: 1;
    padding-left: 24px !important;
    padding-right: 24px !important;
  }
  :deep(.bk-tab-content) {
    display: flex;
    min-height: 0px;
    min-width: 0px;
    overflow: auto;
    background-color: #f5f7fa;
    padding: 0 !important;

    .bk-tab-panel {
      flex: 1;
      min-height: 0px;
      min-width: 0px;
      display: flex;
      flex-direction: column;
    }
  }
  :deep(.bk-tab-header-nav .bk-tab-header-item) {
    padding: 0 !important;
    margin-right: 32px !important;
    line-height: 36px !important;
  }
</style>
