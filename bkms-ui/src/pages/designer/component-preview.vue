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
            <Button
              v-if="activeItem.slots.length && !activeItem.hideSlotStructure"
              class="preview-slot-toggle"
              size="small"
              :theme="showSlotPlaceholders ? 'primary' : 'default'"
              @click="showSlotPlaceholders = !showSlotPlaceholders"
            >
              {{ showSlotPlaceholders ? '返回组件效果' : '查看可替换结构' }}
            </Button>
          </div>
          <div class="preview-description">
            <p v-if="showSlotPlaceholders">- 彩色虚线块为结构中可被替换的位置，仅看结构，交互请在组件效果中体验</p>
            <p v-else>- 默认展示组件效果，可替换区域会以业务样例或组件内容呈现</p>
          </div>
          <!-- 组件族变体与真实态预览变体共用这组按钮：前者切骨架单元，后者切内容量/props -->
          <div
            v-if="previewTabs.length > 1"
            class="family-tabs"
          >
            <button
              v-for="(variant, index) in previewTabs"
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
            :class="{ 'preview-canvas-combos': showSlotPlaceholders && activeCombos.length > 1 }"
          >
            <div
              v-for="(combo, comboIndex) in activeCombos"
              :key="showSlotPlaceholders ? `combo-${comboIndex}` : 'real'"
              class="preview-combo"
            >
              <div
                v-if="showSlotPlaceholders && combo.label"
                class="preview-combo-label"
              >
                {{ combo.label }}
              </div>
              <PreviewVariantCard>
                <Button
                  v-if="activeItem.visibilityProp && !showSlotPlaceholders"
                  class="preview-open-trigger"
                  theme="primary"
                  @click="openOverlay"
                >
                  打开
                </Button>
                <div
                  :ref="setFitEl"
                  :class="{
                    'preview-static': showSlotPlaceholders,
                    'preview-fill': activeItem.fillHeight,
                    'preview-fit': isFitCentered && !activeItem.fillHeight && !activeItem.fillWidth,
                  }"
                >
                  <SafeComponent
                    :key="`${activeItem.id}-${comboIndex}-${showSlotPlaceholders ? 'structure' : 'real'}-${overlayVersion}-${activeVariantIndex}`"
                    :component="activeItem.component"
                    :container-width="activeItem.containerWidth"
                    :fill-height="activeItem.fillHeight"
                    :needs-form="activeItem.needsForm"
                    :props="activeProps"
                    :slots="combo.slots"
                  />
                </div>
              </PreviewVariantCard>
            </div>
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
    nextTick,
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
  import {
    resolveActiveVariant,
    resolvePreviewTabs,
    resolveRealSlotKind,
    resolveSlotOverrides,
    resolveVariantProps,
  } from './preview-variants';
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

  // 与 component-preview.config.mjs 的 componentGlobs 保持一致；Vite 要求静态字面量
  const modules = {
    ...import.meta.glob<{ default: Component }>('../../components/**/*.vue', { eager: true }),
    ...import.meta.glob<{ default: Component }>('../../pages/**/components/**/*.vue', { eager: true }),
  };
  const componentMap = new Map<string, Component>();
  // Vite glob 的 key 相对本文件（src/pages/designer），这里统一解析成相对 src 的 catalog id。
  // 规则需与 component-preview.config.mjs 的 componentIdBase / componentIdStripPrefixes 保持一致：
  // 目前是「相对 src 的完整路径，不省略任何前缀」，改了配置这里要同步。
  const resolveComponentId = (file: string) => {
    const stack: string[] = [];
    for (const part of ['pages', 'designer', ...file.replace(/\.vue$/, '').split('/')]) {
      if (!part || part === '.') continue;
      if (part === '..') stack.pop();
      else stack.push(part);
    }
    return stack.join('/');
  };
  for (const [file, mod] of Object.entries(modules)) {
    if (mod.default) componentMap.set(resolveComponentId(file), mod.default);
  }

  const slotColors = [
    { bg: 'var(--bkms-brand-6)', fg: 'var(--bkms-brand-1)' },
    { bg: 'var(--bkms-success-6)', fg: 'var(--bkms-success-1)' },
    { bg: 'var(--bkms-warning-6)', fg: 'var(--bkms-warning-1)' },
    { bg: 'var(--bkms-danger-6)', fg: 'var(--bkms-danger-1)' },
    { bg: 'var(--bkms-cyan-6)', fg: 'var(--bkms-cyan-1)' },
    { bg: 'var(--bkms-brand-7)', fg: 'var(--bkms-brand-2)' },
  ];

  type SlotOverride = { omit: true } | { sample: SlotSample | SlotSample[] };
  type SlotOverrides = Record<string, SlotOverride>;
  type SlotSample =
    { repeat: number; row: true; text?: string; width?: number } | { repeat: number; text?: string } | { text: string };

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

  /** 开发者视图：所有 slot 都渲染成占位块，便于识别插槽位置 */
  function buildAllPlaceholderSlots(names: string[]) {
    return Object.fromEntries(names.map((name, index) => [name, () => renderSlotPlaceholder(name, index)]));
  }

  /**
   * 真实态：优先业务样例，其次组件自带 fallback / 自带视觉，其余塞中性填充块撑住容器。
   * 填充块是灰色实心「内容」，不是结构视图的彩色「可替换区域」，避免误导设计师。
   * guardedSlots 是组件用 $slots.x 判断接管的区域：传内容会切分支、顶掉组件自己的插画或图标，
   * 所以这类 slot 一律不传，交给组件渲染默认样子。
   */
  function buildRealSlots(names: string[], fallbackSlots: string[], guardedSlots: string[], overrides?: SlotOverrides) {
    return Object.fromEntries(
      names.flatMap((name, index) => {
        const kind = resolveRealSlotKind(name, fallbackSlots, guardedSlots, overrides);
        if (kind === 'skip') return [];
        if (kind === 'sample') {
          const override = overrides?.[name];
          return override && 'sample' in override ? [[name, () => renderSlotSample(override.sample)]] : [];
        }
        return [[name, () => renderFillerBlock(index)]];
      }),
    );
  }

  /**
   * 占位块通用尺寸约束：占位块要跟着组件自己的框走，不能把固定宽高的容器撑破
   * （例如 key-value-badge 只有 32px 高、右侧值区 100px 宽）。
   * box-sizing + maxWidth/maxHeight + 文本省略，保证在窄小容器里也收得住。
   */
  const placeholderBlockBase = {
    boxSizing: 'border-box',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '16px',
    maxWidth: '100%',
    maxHeight: '100%',
    margin: '2px',
    padding: '2px 8px',
    overflow: 'hidden',
    fontSize: '12px',
    // 行高不能继承外层：像 key-value-badge 这类容器带 leading-[32px]，
    // 继承下来占位块会被撑到 32px 以上，把 32px 高的容器顶破
    lineHeight: '1.4',
  };

  /** 真实态中性填充块：只撑尺寸，不表达「可替换」语义 */
  function renderFillerBlock(index: number) {
    return h(
      'div',
      {
        title: `内容 ${index + 1}`,
        style: {
          ...placeholderBlockBase,
          display: 'flex',
          minHeight: '20px',
          borderRadius: 'var(--bkms-radius-tag)',
          background: 'var(--bkms-neutral-2)',
          color: 'var(--bkms-text-secondary)',
        },
      },
      [renderPlaceholderText(`内容 ${index + 1}`)],
    );
  }

  /** 长文案（如 `可替换区域<slot: default>`）在窄容器里省略，完整内容留在 title 里 */
  function renderPlaceholderText(text: string) {
    return h(
      'span',
      {
        style: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
      text,
    );
  }

  function renderSlotPlaceholder(name: string, index: number) {
    const { bg, fg } = slotColors[index % slotColors.length];
    const text = `可替换区域<slot: ${name}>`;
    return h(
      'div',
      {
        title: text,
        style: {
          ...placeholderBlockBase,
          display: 'inline-flex',
          minHeight: '20px',
          border: `1px dashed ${fg}`,
          borderRadius: 'var(--bkms-radius-tag)',
          background: bg,
          color: fg,
        },
      },
      [renderPlaceholderText(text)],
    );
  }

  function renderSlotSample(sample: SlotSample | SlotSample[]) {
    const items = Array.isArray(sample) ? sample : [sample];
    const blocks = items.flatMap(item => {
      if ('row' in item) {
        return [
          h(
            'div',
            { style: { display: 'flex', flexWrap: 'nowrap', gap: '8px', width: 'max-content' } },
            Array.from({ length: item.repeat }, (_, index) =>
              h(
                'div',
                { style: { ...sampleBlockStyle, width: `${item.width ?? 120}px`, flexShrink: '0' } },
                `${item.text ?? '内容块'} ${index + 1}`,
              ),
            ),
          ),
        ];
      }
      return 'repeat' in item
        ? Array.from({ length: item.repeat }, (_, index) =>
            h('div', { style: sampleBlockStyle }, `${item.text ?? '内容块'} ${index + 1}`),
          )
        : [h('div', { style: sampleBlockStyle }, item.text)];
    });
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' } }, blocks);
  }

  const SafeComponent = defineComponent({
    props: {
      component: { type: Object as PropType<Component>, required: true },
      needsForm: { type: Boolean, default: false },
      props: { type: Object as PropType<Record<string, unknown>>, required: true },
      slots: { type: Object as PropType<Record<string, () => unknown>>, required: true },
      containerWidth: { type: Number, default: undefined },
      fillHeight: { type: Boolean, default: false },
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
        const componentVNode = h(componentProps.component, { ...localProps, ...updateHandlers }, componentProps.slots);
        let content = componentVNode;
        if (componentProps.needsForm) content = h(Form, null, { default: () => componentVNode });
        // 预览卡片 body 是 flex items-center，子节点会按内容宽度收缩；统一垫一层 100% 宽容器，
        // 让组件里的 w-full / h-full 有确定宽度参照（monaco 编辑器等靠此撑满）。
        // 整页布局壳（Navigation）还要一份确定高度参照，否则 height:100% 会沿 auto 链一路撑到视口高度
        const fillStyle = componentProps.fillHeight ? { height: '100%', minHeight: '0' } : {};
        content = h('div', { style: { width: '100%', ...fillStyle } }, [content]);
        if (componentProps.containerWidth) {
          content = h('div', { style: { width: `${componentProps.containerWidth}px` } }, [content]);
        }
        return content;
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
      slots: entry.slots,
      fallbackSlots: entry.fallbackSlots,
      guardedSlots: entry.guardedSlots,
      slotOverrides: entry.slotOverrides,
      needsForm: entry.needsForm,
      warnings: entry.warnings,
      family: entry.family,
      variants: entry.variants ?? [],
      slotCombos: entry.slotCombos,
      containerWidth: entry.containerWidth,
      fillHeight: entry.fillHeight ?? false,
      fillWidth: entry.fillWidth ?? false,
      heightProp: entry.heightProp,
      hideSlotStructure: entry.hideSlotStructure ?? false,
    }));

  const showSlotPlaceholders = ref(false);

  const route = useRoute();
  const activeItem = computed(() => {
    const id = typeof route.query.component === 'string' ? route.query.component : previewItems[0]?.id;
    return previewItems.find(item => item.id === id) ?? previewItems[0];
  });

  const activeVariantIndex = ref(0);
  watch(
    () => activeItem.value?.id,
    () => {
      activeVariantIndex.value = 0;
      showSlotPlaceholders.value = false;
    },
  );

  /** 标题栏切换项与变体样例合并规则见 preview-variants.ts（纯函数，有单测） */
  const previewTabs = computed(() =>
    activeItem.value ? resolvePreviewTabs(activeItem.value, showSlotPlaceholders.value) : [],
  );

  const activePreviewVariant = computed(() =>
    activeItem.value ? resolveActiveVariant(activeItem.value, activeVariantIndex.value) : null,
  );

  const activeSlots = computed(() => {
    const item = activeItem.value;
    if (!item) return {};
    if (showSlotPlaceholders.value) return buildAllPlaceholderSlots(item.slots);
    return buildRealSlots(
      item.slots,
      item.fallbackSlots,
      item.guardedSlots,
      resolveSlotOverrides(item, activePreviewVariant.value),
    );
  });

  /** 组件族的变体切换：把选中的骨架单元塞进 loading 槽，而不是把它们当独立组件列出来 */
  const familySlots = computed(() => {
    const family = activeItem.value?.family;
    if (!family) return null;
    const variant = family.variants[activeVariantIndex.value] ?? family.variants[0];
    // 变体只覆盖 props（无骨架节点）时不占用 slots，交回 activeSlots 处理可替换区
    if (!variant.nodes.length) return null;
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
   * 画布要渲染的卡片列表。真实态只有一张；结构视图按插件声明的 slot 搭配分卡，
   * 每张卡只把该搭配启用的 slot 渲染成占位块，未列出的视为该搭配下不存在。
   */
  const activeCombos = computed(() => {
    const item = activeItem.value;
    if (!item) return [];
    if (!showSlotPlaceholders.value) {
      return [{ label: '', slots: familySlots.value ?? activeSlots.value }];
    }
    const combos = item.slotCombos;
    if (combos?.length) {
      return combos.map(combo => ({
        label: combo.label,
        slots: buildAllPlaceholderSlots(combo.slots),
      }));
    }
    return [{ label: '', slots: buildAllPlaceholderSlots(item.slots) }];
  });

  /**
   * 弹层类组件（Dialog/Sideslider）默认收起，点按钮才打开。
   * 这类组件把显隐状态复制到内部 ref、只在初始化时读一次 prop，
   * 所以打开靠递增版本号重建实例，只改 prop 不会让它弹出来。
   */
  const overlayVersion = ref(0);

  /** 传给组件的 props：family 变体覆盖清单值，弹层类再按打开状态覆盖显隐字段 */
  const activeProps = computed(() => {
    const item = activeItem.value;
    if (!item) return {};
    const familyVariant = item.family?.variants[activeVariantIndex.value] ?? item.family?.variants[0];
    const base = resolveVariantProps(item, familyVariant ?? null, activePreviewVariant.value);
    const withVisibility = item.visibilityProp ? { ...base, [item.visibilityProp]: overlayVersion.value > 0 } : base;
    // 高度写在像素 prop 里的组件：回填画布实测可用高，才能像业务里一样铺开
    if (!item.heightProp || !canvasHeight.value) return withVisibility;
    return { ...withVisibility, [item.heightProp]: canvasHeight.value };
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

  /**
   * 组件该撑满画布还是按自身宽度居中，由渲染结果决定，不再逐个维护名单：
   * 先按内容宽度排一次版，再量实际尺寸——宽度已接近画布、或内容本身很高（卡片/表格/骨架/布局壳），
   * 说明宽度来自布局而非内容宽度，改回撑满；其余（输入框、标签、hover-copy 这类内联件）保持居中。
   */
  const FIT_MAX_WIDTH_RATIO = 0.75;
  const FIT_MIN_HEIGHT = 200;

  const fitEl = ref<HTMLElement | null>(null);
  const isFitCentered = ref(true);
  let fitObserver: null | ResizeObserver = null;

  /**
   * 承载层的实测可用高。高度由像素 prop 决定的组件（如 ms-editor-plus 的 containerHeight）
   * 拿到这个值才能铺满，否则一直是组件自带的默认像素高。
   * 优先量承载层自身高度（fillHeight 下它有确定高度，与组件内容无关，不会来回抖），
   * 结构视图等没有确定高度的场景再退回按画布可用高估算。
   */
  const canvasHeight = ref(0);
  let canvasObserver: null | ResizeObserver = null;

  function measureCanvasHeight(): void {
    const el = fitEl.value;
    if (!el) return;
    let usable = el.clientHeight;
    if (!usable) {
      const canvas = el.closest('.preview-canvas');
      if (!(canvas instanceof HTMLElement)) return;
      const style = getComputedStyle(canvas);
      usable = canvas.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    }
    if (usable > 0) canvasHeight.value = Math.round(usable);
  }

  /**
   * 量「内容宽度」而不是当前宽度：当前可能是撑满态，也可能刚切完组件还没落定。
   * 临时挂上居中类再读尺寸，同一帧内改回来，浏览器不会绘制中间态。
   */
  function measureFit(): void {
    const el = fitEl.value;
    const holder = el?.parentElement;
    if (!el || !holder) return;
    const available = holder.clientWidth;
    if (!available) return;
    const centered = el.classList.contains('preview-fit');
    if (!centered) el.classList.add('preview-fit');
    const { width, height } = el.getBoundingClientRect();
    if (!centered) el.classList.remove('preview-fit');
    isFitCentered.value = width < available * FIT_MAX_WIDTH_RATIO && height < FIT_MIN_HEIGHT;
  }

  /** 窗口/画布尺寸变化时跟着改，避免回填高度停在旧值 */
  function observeCanvasHeight(): void {
    canvasObserver?.disconnect();
    const target = fitEl.value?.closest('.preview-canvas');
    if (!(target instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return;
    canvasObserver = new ResizeObserver(() => measureCanvasHeight());
    canvasObserver.observe(target);
  }

  /**
   * 首次量完还可能有异步内容（表格行、接口数据）把尺寸撑开，
   * 居中期间继续盯尺寸，一旦达到撑满条件就切过去并停止观察。
   */
  function observeFit(): void {
    fitObserver?.disconnect();
    const el = fitEl.value;
    if (!el || typeof ResizeObserver === 'undefined') return;
    fitObserver = new ResizeObserver(() => {
      measureFit();
      if (!isFitCentered.value) fitObserver?.disconnect();
    });
    fitObserver.observe(el);
  }

  function setFitEl(el: unknown): void {
    fitEl.value = el instanceof HTMLElement ? el : null;
  }

  // flush: 'post' 让回调跑在本次渲染写进 DOM 之后；measureFit 同步读尺寸，浏览器尚未绘制，不会看到跳动
  watch(
    () => [activeItem.value?.id, activeVariantIndex.value, showSlotPlaceholders.value, overlayVersion.value].join(),
    async () => {
      fitObserver?.disconnect();
      canvasObserver?.disconnect();
      // 满宽布局壳的宽度来自父容器，按内容量出来的宽度代表不了业务形态，直接撑满
      isFitCentered.value = !activeItem.value?.fillWidth;
      const item = activeItem.value;
      if (showSlotPlaceholders.value || !item || item.fillHeight || item.fillWidth) {
        if (item?.heightProp) {
          await nextTick();
          measureCanvasHeight();
          observeCanvasHeight();
        }
        return;
      }
      // 显式定宽的组件（containerWidth）语义就是「固定这么宽」，不该因为内容高过
      // FIT_MIN_HEIGHT 被当成整页布局去撑满，否则定宽卡片会贴到画布左侧
      if (item.containerWidth) {
        isFitCentered.value = true;
        return;
      }
      await nextTick();
      measureFit();
      observeFit();
    },
    { flush: 'post', immediate: true },
  );

  onBeforeUnmount(() => {
    fitObserver?.disconnect();
    canvasObserver?.disconnect();
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

  .preview-slot-toggle {
    flex: none;
    margin-left: auto;
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

  /* 和其它组件一样放进白卡（组件展示区）内：弹层类收起时卡片是空的，按钮就摆在该组件本该出现的位置；
     按内容宽度居中，不被卡片 body 的 stretch 拉成整行 */
  .preview-open-trigger {
    flex: none;
    align-self: center;
    margin-bottom: 12px;
  }

  /* 卡片撑满画布高度：弹层类组件收起时卡片里只有按钮，若按内容定高会缩成一条 */
  .preview-canvas {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    gap: 16px;
    align-items: stretch;
    justify-content: center;
    min-height: 0;
    padding: 24px;
    background: transparent;
    border: 1px solid var(--bkms-line-default);
    border-radius: var(--bkms-radius-card);
  }

  /* 结构视图多搭配：卡片并排、可换行，每张卡上方标搭配名 */
  .preview-canvas-combos {
    flex-wrap: wrap;
    place-content: flex-start;
  }

  .preview-combo {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  /* 仅结构视图多卡时限制每张卡宽度；真实态单卡应撑满画布 */
  .preview-canvas-combos .preview-combo {
    min-width: 260px;
    max-width: 480px;
  }

  .preview-combo-label {
    flex: none;
    padding: 4px 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--bkms-text-secondary);
  }

  /* 整页布局壳：高度吃掉画布内容区，组件内部的 height:100% 才有参照，不再撑到视口高度 */
  .preview-fill {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  /* 按内容宽度居中：align-self: center 让卡片 body 的 stretch 失效，宽度回落到内容宽度。
     是否加这个类由 measureFit 按实测尺寸决定，见脚本里的 FIT_MAX_WIDTH_RATIO / FIT_MIN_HEIGHT */
  .preview-fit {
    align-self: center;
    max-width: 100%;
  }

  /* 结构视图只看结构，禁用组件内部交互。
     不再用 display: contents —— 那会让承载层消失、组件直接铺满画布，
     于是同一组件在结构视图里撑满、在真实态里按内容居中，两边的可替换区位置对不上。
     现在保留真实态的居中/撑满布局，只把 slot 内容换成占位块。 */
  .preview-static {
    pointer-events: none;
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
