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
            class="preview-canvas"
            :class="{ 'preview-canvas-split': activeItem.hasFallback }"
          >
            <PreviewVariantCard
              v-if="activeItem.hasFallback"
              title="原生版（默认内容）"
            >
              <SafeComponent
                :key="`${activeItem.id}-native`"
                :component="activeItem.component"
                :needs-form="activeItem.needsForm"
                :props="activeItem.props"
                :slots="activeItem.nativeSlots"
              />
            </PreviewVariantCard>
            <PreviewVariantCard :title="activeItem.hasFallback ? '占位版（全部覆写）' : ''">
              <SafeComponent
                :key="`${activeItem.id}-placeholder`"
                :component="activeItem.component"
                :needs-form="activeItem.needsForm"
                :props="activeItem.props"
                :slots="activeItem.slots"
              />
            </PreviewVariantCard>
          </div>
        </div>
        <p
          v-else
          class="empty-hint"
        >
          暂无组件，运行 node scripts/gen-component-preview.mjs 生成清单
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

  import { Form } from 'bkui-vue';
  import { useRoute } from 'vue-router';
  import HoverCopy from '~/components/hover-copy.vue';

  import { componentCatalog } from './component-catalog.generated';
  import PreviewVariantCard from './preview-variant-card.vue';
  import { isolateRequests } from './request-isolation';

  const restoreRequests = isolateRequests();
  onBeforeUnmount(() => restoreRequests());

  interface CatalogEntry {
    fallbackSlots: string[];
    id: string;
    needsForm: boolean;
    props: Record<string, unknown>;
    slots: string[];
    warnings: string[];
  }

  const modules = import.meta.glob<{ default: Component }>('../../components/**/*.vue', { eager: true });
  const componentMap = new Map<string, Component>();
  for (const [file, mod] of Object.entries(modules)) {
    const id = file.replace(/^\.\.\/\.\.\/components\//, '').replace(/\.vue$/, '');
    if (mod.default) componentMap.set(id, mod.default);
  }

  const slotColors = [
    { bg: '#e5edff', fg: '#274ecf' },
    { bg: '#e3f9e9', fg: '#1e7b34' },
    { bg: '#fff3e0', fg: '#a35a00' },
    { bg: '#fde8e8', fg: '#c53a3a' },
    { bg: '#ede7ff', fg: '#5b3fa8' },
    { bg: '#e0f7fa', fg: '#0e6b7a' },
  ];

  function buildPlaceholderSlots(names: string[]) {
    return Object.fromEntries(
      names.map((name, index) => {
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
                  borderRadius: '4px',
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

  const previewItems = (componentCatalog as CatalogEntry[])
    .filter(entry => componentMap.has(entry.id))
    .map(entry => ({
      id: entry.id,
      component: componentMap.get(entry.id)!,
      props: entry.props,
      slots: buildPlaceholderSlots(entry.slots),
      nativeSlots: buildPlaceholderSlots(entry.slots.filter(slot => !entry.fallbackSlots.includes(slot))),
      hasFallback: entry.fallbackSlots.length > 0,
      needsForm: entry.needsForm,
      warnings: entry.warnings,
    }));

  const route = useRoute();
  const activeItem = computed(() => {
    const id = typeof route.query.component === 'string' ? route.query.component : previewItems[0]?.id;
    return previewItems.find(item => item.id === id) ?? previewItems[0];
  });
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
    color: #1f2937;
  }

  /* 占满可用空间，仅用最大尺寸兜住超宽/超高屏幕；
     此前固定 50% × 50%，小屏下画布被压到几十像素，卡片内容互相挤压 */
  .preview-layout {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    max-width: 1200px;
    height: 100%;
    max-height: 800px;
  }

  .preview-stage {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: 20px;
    background: var(--pal-bg-subtle);
    border: 1px solid var(--pal-line);
    border-radius: 12px;
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
    align-items: center;
    justify-content: space-between;
    margin: 0 0 16px;
  }

  .preview-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 24px;
    font-weight: 700;
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
    color: #9aa4b5;
    border: 1px solid var(--pal-line);
    border-radius: 8px;
  }

  .preview-tip {
    color: var(--bkms-warning-2);
  }

  .preview-warning {
    flex: none;
    font-size: 18px;
    color: var(--bkms-warning-2);
  }

  .preview-canvas {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-height: 0;
    padding: 24px;
    background: transparent;
    border: 1px solid var(--pal-line);
    border-radius: 8px;
  }

  .preview-canvas-split {
    gap: 16px;
    align-items: stretch;
    overflow-x: auto;
  }

  /* 并排展示时给卡片兜底最小宽度：窄屏下宁可横向滚动，也不把组件压到无法阅读 */
  .preview-canvas-split > :deep(*) {
    min-width: 280px;
  }

  .empty-hint {
    font-size: 12px;
    color: #9aa4b5;
  }

  .render-error {
    font-size: 12px;
    color: #ea3636;
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>

<style>
  .component-preview .preview-canvas [class*='group-hover:opacity-100'] {
    opacity: 1 !important;
  }
</style>
