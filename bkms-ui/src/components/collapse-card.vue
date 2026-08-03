<template>
  <Card
    v-model:collapse-status="collapseStatus"
    class="collapse-card"
    is-collapse
  >
    <template #icon>
      <slot name="icon">
        <RightShape
          :class="['mr-[8px] transition duration-300', collapseStatus ? 'rotate-90' : '']"
          fill="#313238"
          :height="12"
          :width="12"
          @click.stop="collapseStatus = !collapseStatus"
        />
      </slot>
    </template>
    <template #header>
      <slot name="header">
        <FlexRow class="w-full">
          <template #left>
            <div
              class="cursor-pointer"
              @click.stop="collapseStatus = !collapseStatus"
            >
              <slot name="header-left" />
            </div>
          </template>
          <template #right>
            <slot name="header-right" />
          </template>
        </FlexRow>
      </slot>
    </template>
    <slot />
  </Card>
</template>

<script lang="ts" setup>
  import { Card } from 'bkui-vue';
  import { RightShape } from 'bkui-vue/lib/icon';

  const collapseStatus = defineModel<boolean>({ default: true });
</script>

<style lang="postcss" scoped>
  .collapse-card {
    & :deep(.bk-card-head) {
      margin: 0 16px;
      padding: unset;
      width: calc(100% - 32px);
      border-color: #dcdee5;
      cursor: auto;
    }
    & :deep(.bk-card-body) {
      padding: 12px 16px;
    }
    padding-bottom: 0px;
  }
</style>
