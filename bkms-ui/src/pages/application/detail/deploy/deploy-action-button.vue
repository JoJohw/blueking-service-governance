<template>
  <div class="inline-flex items-center">
    <Button
      :class="{ 'mr-[1px]': showFeatureDeploy }"
      :style="{ borderRadius: showFeatureDeploy ? '2px 0 0 2px' : '2px' }"
      theme="primary"
      @click="emits('deploy')"
    >
      {{ label }}
    </Button>
    <Dropdown
      v-if="showFeatureDeploy"
      placement="bottom-end"
      :popover-options="{ boundary: 'body', clickContentAutoHide: true }"
      trigger="click"
    >
      <template #default="{ popoverShow }">
        <Button
          class="!min-w-[32px] !px-0"
          style="border-radius: 0 2px 2px 0"
          theme="primary"
        >
          <AngleDownLine
            class="text-[12px] transition-transform duration-240"
            :class="{ 'rotate-180': popoverShow }"
          />
        </Button>
      </template>
      <template #content>
        <Dropdown.DropdownMenu>
          <Dropdown.DropdownItem @click="emits('feature-deploy')">
            {{ $t('特性部署') }}
          </Dropdown.DropdownItem>
        </Dropdown.DropdownMenu>
      </template>
    </Dropdown>
  </div>
</template>

<script lang="ts" setup>
  import { Button, Dropdown } from 'bkui-vue';
  import { AngleDownLine } from 'bkui-vue/lib/icon';

  withDefaults(
    defineProps<{
      label: string;
      showFeatureDeploy?: boolean;
    }>(),
    {
      showFeatureDeploy: false,
    },
  );

  const emits = defineEmits<{
    (e: 'deploy'): void;
    (e: 'feature-deploy'): void;
  }>();
</script>
