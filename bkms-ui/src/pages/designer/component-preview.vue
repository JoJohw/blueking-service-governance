<!--
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
-->

<template>
  <div class="component-preview">
    <div class="preview-layout">
      <div class="preview-stage">
        <div
          v-if="activeItem"
          class="preview-body"
        >
          <div class="preview-header">
            <div class="preview-title">
              <HoverCopy
                :copy-value="activeItem.id"
                :text="activeItem.id"
              />
            </div>
            <!-- 弹层类组件在展示区里看不到本体，先标出类型，避免被当成渲染失败 -->
            <Tag
              v-if="activeItem.visibilityProp"
              class="preview-type-tag font-400 text-[10px] h-[20px] leading-[20px]"
              theme="info"
            >
              弹窗类组件
            </Tag>
            <i
              v-if="activeItem.warnings.length"
              v-bk-tooltips="{ content: activeItem.warnings.join('；'), placement: 'top-start' }"
              class="bkms-icon bkms-icon-info-circle-shape preview-warning"
            />
          </div>
          <div class="preview-description">
            <p>- 彩色虚线块为 slot 占位，非组件真实内容</p>
            <p>- 占位块之间带有 margin 间距，仅用于区分相邻 slot</p>
            <p
              v-if="activeItem.hasFallback"
              class="preview-tip"
            >
              - 该组件部分 slot
              带默认内容，已并排展示原生版与占位版；覆写插槽会替换默认内容，可能使其内部绑定的事件失效、交互表现改变
            </p>
          </div>
          <div
            v-if="activeItem.family"
            class="family-tabs"
          >
            <button
              v-for="(variant, index) in activeItem.family.variants"
              :key="variant.label"
              :class="{ 'is-active': activeVariantIndex === index }"
              type="button"
              @click="activeVariantIndex = index"
            >
              {{ variant.label }}
            </button>
          </div>
          <div
            class="preview-canvas"
            :class="{ 'preview-canvas-split': activeItem.hasFallback }"
          >
            <PreviewVariantCard
              v-if="activeItem.hasFallback"
              title="原生版（默认内容）"
            >
              <SafeComponent
                :key="`${activeItem.id}-native-${overlayVersion}`"
                :component="activeItem.component"
                :needs-form="activeItem.needsForm"
                :props="activeProps"
                :slots="activeItem.nativeSlots"
              />
            </PreviewVariantCard>
            <PreviewVariantCard :title="activeItem.hasFallback ? '占位版（全部覆写）' : ''">
              <Button
                v-if="activeItem.visibilityProp"
                class="preview-open-trigger"
                theme="primary"
                @click="openOverlay"
              >
                打开
              </Button>
              <SafeComponent
                :key="`${activeItem.id}-placeholder-${overlayVersion}-${activeVariantIndex}`"
                :component="activeItem.component"
                :needs-form="activeItem.needsForm"
                :props="activeProps"
                :slots="familySlots ?? activeItem.slots"
              />
            </PreviewVariantCard>
          </div>
        </div>
        <p
          v-else
          class="empty-hint"
        >
          暂无组件，运行 node scripts/component-preview/index.mjs 生成清单
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    type Component,
    type PropType,
    computed,
    defineComponent,
    h,
    onBeforeUnmount,
    onErrorCaptured,
    reactive,
    ref,
    watch,
  } from 'vue';

  import { Button, Form, Tag } from 'bkui-vue';
  import { useRoute } from 'vue-router';
  import HoverCopy from '~/components/hover-copy.vue';
  import { useAppDetail } from '~/stores/app-detail';

  import { componentCatalog } from './generated/component-catalog';
  import PreviewVariantCard from './preview-variant-card.vue';
  import { isolateRequests } from './request-isolation';

  import type { ComponentCatalogEntry } from './generated/component-catalog';

  const restoreRequests = isolateRequests();
  onBeforeUnmount(() => restoreRequests());

  /**
   * 预览 iframe 的 Pinia 与主应用隔离，这里给一个假的 appID，
   * 让组件自己拉数据的路径能走到被 api-mock 打桩的请求（env-select-panel 等）。
   */
  const appDetailStore = useAppDetail();
  const previousAppID = appDetailStore.appID;
  appDetailStore.updateAppID('__designer_preview__');
  onBeforeUnmount(() => appDetailStore.updateAppID(previousAppID));

  const modules = import.meta.glob<{ default: Component }>('../../components/**/*.vue', { eager: true });
  const componentMap = new Map<string, Component>();
  for (const [file, mod] of Object.entries(modules)) {
    const id = file.replace(/^\.\.\/\.\.\/components\//, '').replace(/\.vue$/, '');
    if (mod.default) componentMap.set(id, mod.default);
  }

  const slotColors = [
    { bg: 'var(--bkms-brand-6)', fg: 'var(--bkms-brand-1)' },
    { bg: 'var(--bkms-success-6)', fg: 'var(--bkms-success-1)' },
    { bg: 'var(--bkms-warning-6)', fg: 'var(--bkms-warning-1)' },
    { bg: 'var(--bkms-danger-6)', fg: 'var(--bkms-danger-1)' },
    { bg: 'var(--bkms-cyan-6)', fg: 'var(--bkms-cyan-1)' },
    { bg: 'var(--bkms-brand-7)', fg: 'var(--bkms-brand-2)' },
  ];

  type SlotSample = { text: string } | { repeat: number; text?: string };
  type SlotSamples = Record<string, SlotSample | SlotSample[]>;

  const sampleBlockStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '28px',
    padding: '2px 8px',
    border: `1px dashed ${slotColors[0].fg}`,
    borderRadius: 'var(--bkms-radius-tag)',
    background: slotColors[0].bg,
    color: slotColors[0].fg,
    fontSize: '12px',
    boxSizing: 'border-box',
  };

  function renderSlotSample(sample: SlotSample | SlotSample[]) {
    const items = Array.isArray(sample) ? sample : [sample];
    const blocks = items.flatMap(item =>
      'repeat' in item
        ? Array.from({ length: item.repeat }, (_, index) =>
            h('div', { style: sampleBlockStyle }, `${item.text ?? '内容块'} ${index + 1}`),
          )
        : [h('div', { style: sampleBlockStyle }, item.text)],
    );
    return h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' } },
      blocks,
    );
  }

  function buildPlaceholderSlots(names: string[], samples?: SlotSamples) {
    return Object.fromEntries(
      names.map((name, index) => {
        const sample = samples?.[name];
        if (sample) return [name, () => renderSlotSample(sample)];
        const { bg, fg } = slotColors[index % slotColors.length];
        return [
          name,
          () =>
            h(
              'div',
              {
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  minHeight: '24px',
                  margin: '4px',
                  padding: '2px 8px',
                  border: `1px dashed ${fg}`,
                  borderRadius: 'var(--bkms-radius-tag)',
                  background: bg,
                  color: fg,
                  fontSize: '12px',
                },
              },
              `slot: ${name}`,
            ),
        ];
      }),
    );
  }

  const SafeComponent = defineComponent({
    props: {
      component: { type: Object as PropType<Component>, required: true },
      needsForm: { type: Boolean, default: false },
      props: { type: Object as PropType<Record<string, unknown>>, required: true },
      slots: { type: Object as PropType<Record<string, () => unknown>>, required: true },
    },
    setup(componentProps) {
      const error = ref('');
      onErrorCaptured(err => {
        error.value = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
        return false;
      });

      const localProps = reactive({ ...componentProps.props });
      watch(
        () => componentProps.props,
        value => Object.assign(localProps, value),
      );

      return () => {
        if (error.value) return h('pre', { class: 'render-error' }, error.value);
        const emits = (componentProps.component as { emits?: string[] }).emits ?? [];
        const updateHandlers = Object.fromEntries(
          emits
            .filter(name => name.startsWith('update:'))
            .map(name => {
              const key = name.slice('update:'.length);
              return [`onUpdate:${key}`, (value: unknown) => (localProps[key] = value)];
            }),
        );
        const content = h(componentProps.component, { ...localProps, ...updateHandlers }, componentProps.slots);
        return componentProps.needsForm ? h(Form, null, { default: () => content }) : content;
      };
    },
  });

  const previewItems = (componentCatalog as ComponentCatalogEntry[])
    .filter(entry => componentMap.has(entry.id))
    .map(entry => ({
      id: entry.id,
      component: componentMap.get(entry.id)!,
      props: entry.props,
      visibilityProp: entry.visibilityProp,
      slots: buildPlaceholderSlots(entry.slots, entry.slotSamples),
      nativeSlots: buildPlaceholderSlots(entry.slots.filter(slot => !entry.fallbackSlots.includes(slot))),
      hasFallback: entry.fallbackSlots.length > 0,
      needsForm: entry.needsForm,
      warnings: entry.warnings,
      family: entry.family,
    }));

  const route = useRoute();
  const activeItem = computed(() => {
    const id = typeof route.query.component === 'string' ? route.query.component : previewItems[0]?.id;
    return previewItems.find(item => item.id === id) ?? previewItems[0];
  });

  const activeVariantIndex = ref(0);
  watch(
    () => activeItem.value?.id,
    () => (activeVariantIndex.value = 0),
  );

  /** 组件族的变体切换：把选中的骨架单元塞进 loading 槽，而不是把它们当独立组件列出来 */
  const familySlots = computed(() => {
    const family = activeItem.value?.family;
    if (!family) return null;
    const variant = family.variants[activeVariantIndex.value] ?? family.variants[0];
    return {
      loading: () =>
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
          variant.nodes.map(node => {
            const component = componentMap.get(node.id);
            return component ? h(component, node.props) : h('span', `未找到组件 ${node.id}`);
          }),
        ),
    };
  });

  /**
   * 弹层类组件（Dialog/Sideslider）默认收起，点按钮才打开。
   * 这类组件把显隐状态复制到内部 ref、只在初始化时读一次 prop，
   * 所以打开靠递增版本号重建实例，只改 prop 不会让它弹出来。
   */
  const overlayVersion = ref(0);

  /** 传给组件的 props：弹层类按打开状态覆盖显隐字段，其余组件直接用清单值 */
  const activeProps = computed(() => {
    const item = activeItem.value;
    if (!item) return {};
    if (!item.visibilityProp) return item.props;
    return { ...item.props, [item.visibilityProp]: overlayVersion.value > 0 };
  });

  function openOverlay() {
    overlayVersion.value += 1;
  }

  /** 切换组件时回到收起态，否则弹层会带着上一次的打开状态直接弹出来 */
  watch(
    () => activeItem.value?.id,
    () => {
      overlayVersion.value = 0;
    },
  );
</script>

<style scoped>
  .component-preview {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 16px;
    font:
      13px/1.6 -apple-system,
      'Segoe UI',
      sans-serif;
    color: var(--bkms-text-title);
  }

  /* 占满可用空间，仅用最大尺寸兜住超宽/超高屏幕；
     此前固定 50% × 50%，小屏下画布被压到几十像素，卡片内容互相挤压 */
  .preview-layout {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1400px;
    height: 100%;
    max-height: 800px;
  }

  .preview-stage {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: 0;
    padding: 20px;
    background: var(--bkms-bg-subtle);
    border: 1px solid var(--bkms-line-default);
    border-radius: var(--bkms-radius-card);
  }

  .preview-body {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .preview-header {
    display: flex;
    flex: none;
    gap: 8px;
    align-items: center;
    margin: 0 0 16px;
  }

  /* 标题占满剩余宽度，类型标签与提示图标贴右排列 */
  .preview-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }

  .preview-type-tag {
    flex: none;
  }

  .preview-description {
    box-sizing: border-box;
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    margin: -4px 0 16px;
    font-size: 12px;
    color: var(--bkms-text-secondary);
    border: 1px solid var(--bkms-line-default);
    border-radius: var(--bkms-radius-card);
  }

  .preview-tip {
    color: var(--bkms-warning-2);
  }

  .family-tabs {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 8px;
    margin: -4px 0 16px;
  }

  .family-tabs button {
    padding: 4px 12px;
    font-size: 12px;
    color: var(--bkms-text-body);
    cursor: pointer;
    background: var(--bkms-bg-card);
    border: 1px solid var(--bkms-line-default);
    border-radius: var(--bkms-radius-tag);
  }

  .family-tabs button.is-active {
    color: var(--bkms-brand-1);
    background: var(--bkms-brand-6);
    border-color: var(--bkms-brand-6);
  }

  .preview-warning {
    flex: none;
    font-size: 18px;
    color: var(--bkms-warning-2);
  }

  /* 和其它组件一样放进白卡（组件展示区）内：弹层类收起时卡片是空的，按钮就摆在该组件本该出现的位置 */
  .preview-open-trigger {
    flex: none;
    margin-bottom: 12px;
  }

  /* 卡片撑满画布高度：弹层类组件收起时卡片里只有按钮，若按内容定高会缩成一条 */
  .preview-canvas {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    align-items: stretch;
    justify-content: center;
    min-height: 0;
    padding: 24px;
    background: transparent;
    border: 1px solid var(--bkms-line-default);
    border-radius: var(--bkms-radius-card);
  }

  .preview-canvas-split {
    gap: 16px;
    overflow-x: auto;
  }

  /* 并排展示时给卡片兜底最小宽度：窄屏下宁可横向滚动，也不把组件压到无法阅读 */
  .preview-canvas-split > :deep(*) {
    min-width: 280px;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--bkms-text-secondary);
  }

  .render-error {
    font-size: 12px;
    color: var(--bkms-danger-2);
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>

<style>
  .component-preview .preview-canvas [class*='group-hover:opacity-100'] {
    opacity: 1 !important;
  }
</style>
