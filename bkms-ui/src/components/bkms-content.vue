<template>
  <div class="w-full bkms-content rounded-[2px] overflow-visible">
    <div
      :class="[
        'flex items-center justify-between bg-[#F5F7FA] h-[32px] px-[16px] bkms-content-title',
        { 'cursor-pointer': collapsible },
      ]"
      @click.stop="collapsible && handleToggle()"
    >
      <div class="flex items-center text-[14px] font-bold text-[#4D4F56] leading-[32px]">
        <RightShape
          v-if="collapsible"
          :class="['transition duration-300 mr-[6px] mt-[-1px]', innerCollapsed ? '' : 'rotate-90']"
          fill="#979BA5"
          :height="14"
          :width="14"
        />
        <slot name="title">
          <span class="text-[#313238]">{{ title }}</span>
        </slot>
        <Button
          v-if="showEditIcon"
          v-bk-tooltips="editTooltip"
          class="ml-[10px]"
          :class="{ '!hover:text-[#3A84FF]': !editDisabled }"
          :disabled="editDisabled"
          text
          @click.stop="handleEdit"
        >
          <EditLine />
          <span class="text-[12px] font-400 mt-[1px]">{{ $t('编辑') }}</span>
        </Button>
      </div>
      <div>
        <slot name="action"></slot>
      </div>
    </div>
    <div
      v-show="!innerCollapsed || !collapsible"
      class="contents"
    >
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { Button } from 'bkui-vue';
  import { EditLine, RightShape } from 'bkui-vue/lib/icon';

  interface Props {
    collapsed?: boolean;
    collapsible?: boolean;
    editDisabled?: boolean;
    editDisabledTips?: string;
    showEditIcon?: boolean;
    title?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    collapsible: false,
    collapsed: false,
  });
  const emits = defineEmits(['edit', 'update:collapsed', 'collapse-change']);

  const innerCollapsed = ref(props.collapsed);

  watch(
    () => props.collapsed,
    val => {
      innerCollapsed.value = val;
    },
  );

  watch(innerCollapsed, val => {
    emits('update:collapsed', val);
    emits('collapse-change', val);
  });

  const editTooltip = computed(() => {
    if (props.editDisabled && props.editDisabledTips) {
      return props.editDisabledTips;
    }
    return { disabled: true };
  });

  const handleEdit = () => {
    emits('edit');
  };

  const handleToggle = () => {
    innerCollapsed.value = !innerCollapsed.value;
  };
</script>
