<template>
  <div :class="['editor-status overflow-hidden text-ellipsis whitespace-nowrap break-all', theme]">
    <div
      v-for="(item, index) in messages"
      :key="index"
      class="flex items-baseline w-[calc(100%_-_32px)]"
    >
      <i :class="['bkms-icon', `bkms-icon-${icon}`]"></i>
      <span
        class="message"
        :title="String(item)"
        >{{ item }}</span
      >
    </div>
  </div>
</template>
<script lang="ts">
  import { computed, defineComponent, toRefs } from 'vue';

  export default defineComponent({
    name: 'EditorStatus',
    props: {
      theme: {
        type: String,
        default: 'error',
      },
      message: {
        type: [String, Array],
        default: '',
      },
    },
    setup(props) {
      const { theme } = toRefs(props);
      const iconMap: Record<string, string> = {
        error: 'close-circle-shape',
        default: 'info-circle-shape',
      };
      const icon = computed(() => iconMap[theme.value] || 'info-circle-shape');
      const messages = computed(() => (Array.isArray(props.message) ? props.message : [props.message]));

      return {
        icon,
        messages,
      };
    },
  });
</script>
<style lang="postcss" scoped>
  .editor-status {
    height: 100%;
    border-left: 4px solid;
    padding: 8px 0px 8px 16px;
    background: #2e2e2e;
    border-radius: 0px 0px 2px 2px;
    display: flex;
    align-items: flex-start;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    i {
      font-size: 12px;
    }
    &.error {
      border-left-color: #b34747;
      i {
        color: #b34747;
      }
    }
    .message {
      margin-left: 8px;
      color: #dcdee5;
      line-height: 20px;
      font-size: 12px;
      white-space: wrap;
    }
  }
</style>
