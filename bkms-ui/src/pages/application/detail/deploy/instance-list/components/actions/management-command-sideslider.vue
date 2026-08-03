<template>
  <Sideslider
    v-model:is-show="visible"
    :before-close="handleBeforeClose"
    render-directive="if"
    :width="1200"
    @closed="handleClosed"
  >
    <template #header>
      <div class="flex items-center">
        <span>{{ $t('管理命令') }}</span>
        <Divider
          class="mx-[12px]"
          direction="vertical"
        />
        <div class="flex items-center text-[#979BA5] text-[14px] leading-[24px]">
          <span class="mr-[30px]">{{ $t('已选 {0} 个实例', [instanceIds.length]) }}</span>
          <span
            v-if="envDisplayName"
            class="mr-[30px]"
          >
            {{ $t('环境') }}: {{ envDisplayName }}
          </span>
        </div>
      </div>
    </template>
    <template #default>
      <ManagementCommand :data="instanceIds" />
    </template>
  </Sideslider>
</template>

<script lang="ts" setup>
  import { Divider, Sideslider } from 'bkui-vue';
  import useLeaveConfirm from '~/composables/use-leave-confirm';

  import ManagementCommand from '../management-command.vue';

  defineProps<{
    envDisplayName?: string;
    instanceIds: string[];
  }>();

  const visible = defineModel<boolean>('visible', { default: false });

  const { confirmBox } = useLeaveConfirm();

  async function handleBeforeClose(): Promise<boolean> {
    return await confirmBox();
  }

  function handleClosed() {
    // 父组件通过 v-model 控制 instanceIds
  }
</script>
