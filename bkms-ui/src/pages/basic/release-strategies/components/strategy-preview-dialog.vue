<!--
 - TencentBlueKing is pleased to support the open source community by making
 - 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 - Copyright (C) Tencent. All rights reserved.
 - Licensed under the MIT License (the "License"); you may not use this file except
 - in compliance with the License. You may obtain a copy of the License at
 -
 -  http://opensource.org/licenses/MIT
 -
 - Unless required by applicable law or agreed to in writing, software distributed under
 - the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 - either express or implied. See the License for the specific language governing permissions and
 - limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<template>
  <Dialog
    v-model:is-show="visible"
    :quick-close="false"
    :width="960"
  >
    <template #header>
      <div class="flex items-center gap-[8px]">
        <span class="text-[20px] leading-[28px] text-bkms-neutral-1">{{ t('预览策略') }}</span>
        <template v-if="strategyName">
          <span class="h-[12px] w-px shrink-0 bg-bkms-neutral-5"></span>
          <span class="text-[14px] leading-[22px] text-bkms-neutral-3">{{ strategyName }}</span>
        </template>
      </div>
    </template>

    <div class="flex flex-col gap-[16px]">
      <p class="text-[12px] leading-[20px] text-bkms-neutral-3">
        {{ t('按配置比例示意（方格只表示比例）；实例数在部署时按应用实际实例数换算') }}
      </p>

      <div class="flex flex-col gap-[16px] overflow-hidden rounded-bkms-card bg-bkms-neutral-7 px-[20px] py-[16px]">
        <!-- 摘要栏：白底卡片，指标间以 1px 竖线分隔 -->
        <div
          class="flex w-full items-center rounded-bkms-card border border-solid border-bkms-neutral-6 bg-white py-[10px]"
        >
          <template
            v-for="(item, index) in summaryItems"
            :key="item.label"
          >
            <span
              v-if="index > 0"
              class="h-[50px] w-px shrink-0 bg-bkms-neutral-6"
            ></span>
            <div class="flex min-w-0 flex-1 flex-col gap-[2px] px-[16px]">
              <span class="text-[12px] leading-[20px] text-bkms-neutral-3">{{ item.label }}</span>
              <span class="flex items-baseline gap-[4px] overflow-hidden">
                <span class="text-[20px] font-700 leading-[28px] text-bkms-neutral-1">{{ item.value }}</span>
                <span class="text-[12px] leading-[20px] text-bkms-neutral-3">{{ item.unit }}</span>
              </span>
            </div>
          </template>
        </div>

        <!-- 批次时间线 -->
        <div class="relative flex w-full flex-col">
          <template
            v-for="(row, index) in rows"
            :key="row.key"
          >
            <div
              class="step-item-title relative flex w-full items-start gap-[12px] overflow-hidden pb-[6px]"
              :class="{ 'is-last': index === rows.length - 1 }"
              data-testid="preview-row"
            >
              <span
                class="relative z-10 flex size-[24px] shrink-0 items-center justify-center rounded-bkms-full bg-bkms-brand-2 text-[12px] font-700 leading-[20px] text-white"
              >
                {{ index + 1 }}
              </span>
              <div class="flex min-w-0 flex-1 flex-col items-start gap-[8px] overflow-hidden pt-[2px]">
                <div class="flex w-full items-center justify-between gap-[8px]">
                  <div class="flex min-w-0 shrink-0 items-center gap-[8px] overflow-hidden">
                    <span class="whitespace-nowrap text-[12px] font-700 leading-[20px] text-bkms-neutral-1">
                      {{ row.label }}
                    </span>
                    <span
                      v-if="row.isFull"
                      class="flex h-[16px] shrink-0 items-center rounded-bkms-tag bg-bkms-brand-6 px-[6px] text-[10px] leading-[16px] text-bkms-brand-2"
                      data-testid="preview-row-full"
                    >
                      {{ t('全量') }}
                    </span>
                  </div>
                  <div class="flex shrink-0 items-center gap-[4px] text-[12px] leading-[20px]">
                    <span class="font-700 text-bkms-neutral-1">{{ row.countValue }}</span>
                    <span class="text-bkms-neutral-3">{{ row.countLabel }}</span>
                  </div>
                </div>

                <div class="flex w-full items-start gap-[4px] overflow-hidden">
                  <span
                    v-for="(square, squareIndex) in buildPreviewSquares(row)"
                    :key="squareIndex"
                    class="h-[8px] min-w-px flex-1 rounded-bkms-base"
                    :class="squareClassMap[square]"
                  ></span>
                </div>
              </div>
            </div>

            <!-- 暂停标签：位于时间线轴上，紧跟所属批次；永久暂停告警橙、定时暂停主蓝 -->
            <div
              v-if="row.hasPause"
              class="step-item-tag relative flex w-full items-center overflow-hidden py-[6px] pl-[32px]"
              :class="{ 'is-last': index === rows.length - 1 }"
              data-testid="preview-row-pause"
            >
              <Tag :theme="row.pauseTheme === 'warn' ? 'warning' : 'info'">
                {{ row.pauseText }}
              </Tag>
            </div>
            <!-- 无暂停配置的批次补充「不停」标签；末批之后无下一批，不展示 -->
            <div
              v-else-if="index < rows.length - 1"
              class="step-item-tag relative flex w-full items-center overflow-hidden py-[6px] pl-[32px]"
              data-testid="preview-row-next"
            >
              <Tag class="!text-bkms-neutral-2">{{ t('不停，直接进入下一批') }}</Tag>
            </div>
          </template>
        </div>

        <!-- 末批未配置 100%：不补齐全量批，改为底部提示剩余实例自动更新 -->
        <p
          v-if="showRemainingAutoUpdateTip"
          class="pl-[36px] text-[12px] leading-[20px] text-bkms-neutral-3"
          data-testid="preview-remaining-tip"
        >
          {{ t('最后一批完成后，剩余未更新的实例将自动更新。') }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-[8px]">
        <Button
          data-testid="preview-close"
          @click="visible = false"
        >
          {{ t('关闭') }}
        </Button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { Button, Dialog, Tag } from 'bkui-vue';
  import { useI18n } from 'vue-i18n';

  import {
    buildPreviewSquares,
    buildStrategyPreviewRows,
    buildStrategyPreviewSummary,
    shouldShowRemainingAutoUpdateTip,
  } from '../utils';

  import type { StrategyBatchForm } from '../utils';

  interface Props {
    /** 已通过表单校验的批次（弹窗内不做校验） */
    batches: StrategyBatchForm[];
    /** 策略名称：作为标题副标题展示，便于确认预览对象 */
    name?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    name: '',
  });

  const visible = defineModel<boolean>('isShow', { default: false });

  const { t } = useI18n();

  const strategyName = computed(() => props.name.trim());

  const rows = computed(() => buildStrategyPreviewRows(props.batches, t));

  /** 末批未配置 100% 时，剩余实例由系统在最后一批完成后自动更新：底部提示，不补齐全量批 */
  const showRemainingAutoUpdateTip = computed(() => shouldShowRemainingAutoUpdateTip(props.batches));

  const summaryItems = computed(() => {
    const summary = buildStrategyPreviewSummary(props.batches, t);
    return [
      { label: t('批次数'), value: summary.batchCount, unit: t('批') },
      { label: t('暂停次数'), value: summary.pauseCount, unit: t('次') },
      { label: t('首批数量'), value: summary.firstCountValue, unit: summary.firstCountUnit },
      // 流量批次暂不展示，后续需要时恢复
      // { label: t('流量批次'), value: summary.trafficBatchCount, unit: t('个') },
    ];
  });

  // 实例方块状态色：已更新 / 本批新增 / 待更新
  const squareClassMap: Record<string, string> = {
    prev: 'bg-bkms-brand-2',
    new: 'bg-bkms-brand-4',
    pending: 'bg-bkms-neutral-5',
  };
</script>

<style lang="postcss" scoped>
  :deep(.bk-tag-info) {
    color: var(--bkms-brand-2);
    background-color: var(--bkms-brand-6);
  }

  :deep(.bk-tag-warning) {
    color: var(--bkms-warning-1);
    background-color: var(--bkms-bg-warning);
  }

  .step-item-title::before,
  .step-item-tag::before {
    position: absolute;
    left: 12px;
    display: block;
    width: 2px;
    height: 100%;
    content: '';
    background-color: var(--bkms-neutral-5);
  }

  /* 末批节点只连到圆点中心，避免时间线尾部悬空（含末批的暂停标签） */
  .step-item-title.is-last::before,
  .step-item-tag.is-last::before {
    display: none;
  }
</style>
