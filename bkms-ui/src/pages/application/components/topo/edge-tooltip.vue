<template>
  <Transition name="edge-tooltip-fade">
    <div
      v-if="visible"
      class="max-w-[400px] absolute translate-x-[calc(-100%-12px)] translate-y-[-50%] z-100 pointer-events-none"
      :style="{ left: `${x}px`, top: `${y}px` }"
    >
      <div
        class="max-w-[max-content] bg-white rounded-[6px] shadow-[0_2px_12px_0_rgba(0,0,0,0.12)] py-[12px] px-[16px] text-[12px] leading-[20px] text-[#63656e] break-all"
      >
        <div>{{ `${$t('关系')}：${relation}` }}</div>
        <template v-if="reason">
          <div class="flex max-w-[max-content]">
            <div class="shrink-0">{{ $t('原因') }}：</div>
            <div class="flex-1 flex flex-col gap-[8px]">
              <span class="max-w-[max-content] whitespace-normal">{{ reason.summary }}</span>
              <Tag
                v-if="reason.type"
                class="max-w-[max-content] h-[auto]"
                >{{ `type：${reason.type}` }}</Tag
              >
              <Tag
                v-if="reason.sourceFieldPath"
                class="max-w-[max-content] h-[auto]"
                >{{ `from：${reason.sourceFieldPath}` }}</Tag
              >
              <Tag
                v-if="reason.targetFieldPath"
                class="max-w-[max-content] h-[auto]"
                >{{ `to：${reason.targetFieldPath}` }}</Tag
              >
            </div>
          </div>
        </template>
      </div>
      <div
        class="absolute right-[-5px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white drop-shadow-[2px_0_2px_rgba(0,0,0,0.06)]"
      />
    </div>
  </Transition>
</template>

<script lang="ts" setup>
  import { Tag } from 'bkui-vue';
  import { EdgeReason } from '~/@types/topology';

  defineProps<{
    reason?: EdgeReason;
    relation: string;
    visible: boolean;
    x: number;
    y: number;
  }>();
</script>

<style scoped>
  .edge-tooltip-fade-enter-active,
  .edge-tooltip-fade-leave-active {
    transition: opacity 0.15s ease;
  }
  .edge-tooltip-fade-enter-from,
  .edge-tooltip-fade-leave-to {
    opacity: 0;
  }

  :deep(.bk-tag-text) {
    overflow: auto;
    text-overflow: initial;
    white-space: normal;
  }
</style>
