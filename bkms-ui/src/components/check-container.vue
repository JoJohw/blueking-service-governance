<template>
  <div :class="['relative', { '!border-[#3A84FF]': checked }]">
    <slot></slot>
    <span
      v-show="checked"
      class="is-checked"
    >
      <Done
        class="nc-check-small"
        :height="28"
        :width="28"
      ></Done>
    </span>
  </div>
</template>
<script setup lang="ts">
  import { ref, watch } from 'vue';

  import { Done } from 'bkui-vue/lib/icon';

  type IProps = {
    active?: boolean;
  };

  const props = defineProps<IProps>();

  const checked = ref(props.active);
  watch(
    () => props.active,
    val => {
      checked.value = val;
    },
  );
</script>
<style scoped lang="postcss">
  .is-checked {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 42px 42px 0;
    border-color: transparent #3a84ff transparent transparent;
    .nc-check-small {
      position: absolute;
      color: #fff;
      top: 0;
      right: -44px;
    }
  }
</style>
