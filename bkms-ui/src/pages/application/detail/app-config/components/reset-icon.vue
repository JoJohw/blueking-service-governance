<template>
  <Popover
    :content="t('恢复默认')"
    placement="top"
    theme="dark"
  >
    <i
      class="bkms-icon bkms-icon-return cursor-pointer text-[14px] hover:text-[#3A84FF]"
      :class="props.class"
      @click="handleClick"
    />
  </Popover>
</template>

<script setup lang="ts">
  import { Popover } from 'bkui-vue';
  import { useI18n } from 'vue-i18n';

  interface Props {
    /** 自定义样式类 */
    class?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    class: '',
  });

  const emit = defineEmits<{
    click: [];
  }>();

  const { t } = useI18n();

  const handleClick = () => {
    emit('click');
  };
</script>
