<template>
  <Dialog
    v-model:is-show="isShow"
    draggable
    :footer-align="'center'"
    :header-align="'center'"
    render-directive="if"
    theme="primary"
    :title="title"
    :width="width"
  >
    <slot></slot>
    <template #footer>
      <Button
        class="mr-[10px]"
        :loading="loading"
        theme="danger"
        @click="submit"
      >
        {{ t('确定') }}
      </Button>
      <Button
        :disabled="loading"
        @click="isShow = false"
        >{{ t('取消') }}</Button
      >
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
  import { Button, Dialog } from 'bkui-vue';
  import { useI18n } from 'vue-i18n';

  interface Emits {
    (e: 'confirm'): void;
  }
  const isShow = defineModel('isShow', { type: Boolean });
  defineProps({
    title: {
      type: String,
      default: '',
    },
    width: {
      type: Number,
      default: 520,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  });
  const emit = defineEmits<Emits>();

  // 国际化
  const { t } = useI18n();

  function submit() {
    emit('confirm');
  }
</script>
