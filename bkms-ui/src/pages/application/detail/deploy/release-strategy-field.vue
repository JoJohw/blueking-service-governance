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

<!--
  发布方式 / 发布策略表单项：实例列表「全量更新」与「快速部署」两个入口共用。
  准入规则与策略列表由 useReleaseStrategy 提供，本组件只负责渲染与抽屉交互。
-->
<template>
  <Form.FormItem
    :label="$t('发布方式')"
    required
  >
    <Radio.Group
      :aria-label="$t('发布方式')"
      class="release-mode-group w-full flex-col gap-[12px]"
      :model-value="releaseMode"
      role="radiogroup"
      type="card"
      @keydown="handleReleaseModeKeydown"
      @update:model-value="emit('update:releaseMode', $event)"
    >
      <Radio
        class="release-mode-option"
        :label="RELEASE_MODE.ALL"
        tabindex="-1"
      >
        <span class="font-semibold">{{ $t('单批发布') }}</span>
        <span class="release-mode-description">{{ $t('中途不暂停，适合日常发布') }}</span>
      </Radio>
      <Radio
        v-bk-tooltips="{
          content: disabledReason,
          disabled: !disabledReason,
        }"
        class="release-mode-option"
        :disabled="!!disabledReason"
        :label="RELEASE_MODE.CANARY"
        tabindex="-1"
      >
        <span class="font-semibold">{{ $t('分批发布') }}</span>
        <span class="release-mode-description">
          {{ $t('按发布策略分批更新，每批完成后可暂停确认，适合需要先小范围验证的发布') }}
        </span>
      </Radio>
    </Radio.Group>
  </Form.FormItem>

  <Form.FormItem
    v-if="releaseMode === RELEASE_MODE.CANARY"
    :label="$t('发布策略')"
    property="releaseStrategyID"
    required
    :rules="releaseStrategyRules"
  >
    <div class="w-full">
      <div class="flex items-center gap-[8px]">
        <Select
          ref="strategySelectRef"
          class="flex-1"
          filterable
          :list="options"
          :loading="loading"
          :model-value="strategyId"
          :no-data-text="$t('暂无发布策略，请先在工作空间创建')"
          :placeholder="$t('请选择发布策略')"
          @update:model-value="handleSelectStrategy"
        >
          <template #optionRender="{ item }">
            <span class="flex min-w-0 flex-1 items-center justify-between gap-[8px]">
              <span class="truncate">{{ item.label }}</span>
              <span
                v-if="item.isBuiltin"
                class="shrink-0 rounded-bkms-tag bg-bkms-neutral-6 px-[6px] text-[10px] leading-[16px] text-bkms-neutral-2"
              >
                {{ $t('平台内置') }}
              </span>
            </span>
          </template>
          <template #extension>
            <div
              class="flex w-full items-center gap-[8px] justify-center cursor-pointer"
              @click="handleCreateStrategy"
            >
              <i class="bkms-icon bkms-icon-plus-circle text-[14px] text-bkms-neutral-3"></i>
              <span class="text-bkms-neutral-2 !text-[12px]">
                {{ $t('新建策略') }}
              </span>
            </div>
          </template>
        </Select>
        <!-- 查看已选策略详情，可克隆为空间策略；未选中策略时不可点 -->
        <Button
          class="shrink-0"
          :disabled="!selectedStrategy"
          text
          theme="primary"
          @click="handleViewStrategies"
        >
          {{ $t('查看') }}
        </Button>
      </div>
      <div
        v-if="hintText"
        class="mt-[8px] text-[12px] leading-[20px] text-bkms-neutral-3"
      >
        {{ hintText }}
      </div>
    </div>
  </Form.FormItem>

  <!-- 新建策略：叠加在部署抽屉之上的独立抽屉，保存后由父级选中并刷新发布预览 -->
  <StrategySideslider
    v-model:is-show="createStrategyVisible"
    :existing-names="existingNames"
    mode="create"
    @success="handleStrategyCreated"
  />

  <!-- 查看策略：叠加在部署抽屉之上的独立抽屉，仅展示已选策略详情（readonly → 页脚只保留「关闭」） -->
  <StrategySideslider
    v-model:is-show="viewStrategyVisible"
    :existing-names="existingNames"
    mode="view"
    readonly
    :strategy="selectedStrategy"
    @success="emit('cloned')"
  />
</template>

<script lang="ts" setup>
  import { ref } from 'vue';

  import { Button, Form, Radio, Select } from 'bkui-vue';
  import { useI18n } from 'vue-i18n';
  import { RELEASE_MODE } from '~/common/enums/deploy';
  import StrategySideslider from '~/pages/basic/release-strategies/components/strategy-sideslider.vue';

  import type { ReleaseMode, ReleaseStrategyOption } from './release-strategy';
  import type { ReleaseStrategyOutputObj } from '~/@types/v1/release-strategies';

  const props = defineProps<{
    /** 分批发布不可用的原因；为空表示可用 */
    disabledReason: string;
    /** 空间内已有策略名称，供新建抽屉做名称唯一性校验 */
    existingNames: string[];
    hintText: string;
    loading: boolean;
    options: ReleaseStrategyOption[];
    releaseMode: ReleaseMode;
    selectedStrategy?: ReleaseStrategyOutputObj;
    strategyId: string;
  }>();

  const emit = defineEmits<{
    cloned: [];
    created: [strategy?: ReleaseStrategyOutputObj];
    'update:releaseMode': [mode: ReleaseMode];
    'update:strategyId': [id: string];
  }>();

  const { t } = useI18n();

  const strategySelectRef = ref();
  /** 「新建策略」抽屉：叠加在部署抽屉之上，独立维护显隐 */
  const createStrategyVisible = ref(false);
  /** 「查看策略」抽屉：展示已选策略详情，可克隆为空间策略 */
  const viewStrategyVisible = ref(false);

  // 分批发布时策略必选（本表单项仅在分批发布时渲染）
  const releaseStrategyRules = [{ required: true, message: t('请选择发布策略'), trigger: 'change' }];

  /**
   * 打开「新建策略」抽屉：Select 的 extension 区点击被组件库阻止冒泡，下拉不会自动收起，
   * 需显式关闭，避免下拉浮层压在抽屉之上。
   */
  function handleCreateStrategy() {
    strategySelectRef.value?.hidePopover?.();
    createStrategyVisible.value = true;
  }

  function handleReleaseModeKeydown(event: KeyboardEvent) {
    const directions: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const direction = directions[event.key];
    if (!direction || !(event.target instanceof HTMLInputElement)) return;

    const group = event.currentTarget as HTMLElement;
    const radios = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
    const index = radios.indexOf(event.target);
    if (index < 0) return;

    event.preventDefault();
    const nextRadio = radios[(index + direction + radios.length) % radios.length];
    nextRadio.focus();
    nextRadio.click();
  }

  function handleSelectStrategy(id: string) {
    emit('update:strategyId', id);
  }

  /** 新建成功：关闭抽屉并交由父级刷新列表、选中新策略 */
  function handleStrategyCreated(strategy?: ReleaseStrategyOutputObj) {
    createStrategyVisible.value = false;
    emit('created', strategy);
  }

  /**
   * 查看已选策略：打开查看抽屉（叠加在部署抽屉之上）；
   * 未选中策略时「查看」置灰不可点，此处兜底拦截。
   */
  function handleViewStrategies() {
    if (!props.selectedStrategy) return;
    viewStrategyVisible.value = true;
  }
</script>

<style lang="postcss" scoped>
  .release-mode-group .release-mode-option {
    min-height: 52px;
    padding: 12px 16px;
    margin-left: 0;
    white-space: normal;
    border: 1px solid var(--bkms-line-default);
    border-radius: var(--bkms-radius-control);
  }

  .release-mode-option :deep(.bk-radio-input) {
    flex-shrink: 0;
  }

  .release-mode-option :deep(.bk-radio-label) {
    min-width: 0;
    line-height: 20px;
  }

  .release-mode-description {
    margin-left: 12px;
    color: var(--bkms-text-secondary);
  }

  .release-mode-group .release-mode-option.is-checked {
    color: var(--bkms-text-brand);
    background: var(--bkms-bg-brand-soft);
    border-color: var(--bkms-line-active);
  }

  .release-mode-group .release-mode-option.is-checked .release-mode-description {
    color: var(--bkms-brand-3);
  }

  .release-mode-group .release-mode-option.is-focused {
    border-color: var(--bkms-line-active);
  }

  .release-mode-group .release-mode-option.is-disabled {
    color: var(--bkms-text-disabled);
    background: var(--bkms-neutral-8);
    border-color: var(--bkms-line-default);
  }

  .release-mode-group .release-mode-option.is-disabled .release-mode-description {
    color: inherit;
  }
</style>
