<template>
  <div class="text-left text-[14px]">
    <div class="mb-[16px]">
      <div>
        <span class="text-[#4D4F56]">{{ t('环境') }}：</span>
        <span class="text-[#313238]">{{ displayName || curEnv }}</span>
      </div>
      <p
        v-if="laneName"
        class="mt-[8px]"
      >
        <span class="text-[#4D4F56]">{{ t('泳道') }}：</span>
        <span class="text-[#313238]">{{ laneName }}</span>
      </p>
    </div>
    <div class="px-[16px] py-[12px] bg-[#f6f7fa] rounded-[2px] text-[14px]">
      <p>{{ t('移除后将无法恢复，请谨慎操作') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    curEnv: string;
    displayName?: string;
    laneName?: string;
    t: (key: string) => string;
  }

  defineProps<Props>();
</script>
