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
            <!-- 相对组件基线的三态：stable 不展示；changed 橙 Tag、new 绿 Tag -->
            <Tag
              v-if="activeItem.status === 'new'"
              v-bk-tooltips="{
                content: '新增组件，请核对预览示例',
                placement: 'top-start',
              }"
              class="preview-status-tag font-400 text-[10px] h-[20px] leading-[20px]"
              theme="success"
            >
              新增
            </Tag>
            <Tag
              v-else-if="activeItem.status === 'changed'"
              v-bk-tooltips="{
                content: '组件结构已变更，预览示例可能过期',
                placement: 'top-start',
              }"
              class="preview-status-tag font-400 text-[10px] h-[20px] leading-[20px]"
              theme="warning"
            >
              示例待更新
            </Tag>
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
  import { type Component, computed, h, onBeforeUnmount, ref, watch } from 'vue';

  import { Button, Tag } from 'bkui-vue';
  import { useRoute } from 'vue-router';
  import HoverCopy from '~/components/hover-copy.vue';
  import { useAppDetail } from '~/stores/app-detail';

  import { componentCatalog } from '../generated/component-catalog';
  import { buildComponentMap, PREVIEW_ID_BASE } from './catalog';
  import SafeComponent from './safe-component';
  import { buildAllPlaceholderSlots, buildRealSlots } from './slot-render';
  import { useCanvasFit } from './use-canvas-fit';
  import PreviewVariantCard from './variant-card.vue';
  import { resolveActiveVariant, resolvePreviewTabs, resolveSlotOverrides, resolveVariantProps } from './variants';

  import type { ComponentCatalogEntry } from '../generated/component-catalog';

  /**
   * 预览 iframe 的 Pinia 与主应用隔离，这里给一个假的 appID，
   * 让组件自己拉数据的路径能走到被 api-mock 打桩的请求（env-select-panel 等）。
   */
  const appDetailStore = useAppDetail();
  const previousAppID = appDetailStore.appID;
  appDetailStore.updateAppID('__designer_preview__');
  onBeforeUnmount(() => appDetailStore.updateAppID(previousAppID));

  // 非 eager glob 覆盖 config 的 componentGlobs：每个 .vue 只生成 loader，
  // 渲染到哪个组件才下载哪个 chunk（清单 44 个，glob 命中 210 个）。
  // Vite 要求字面量，无法直接复用配置，所以下面对「清单有、glob 没匹配到」的组件留了告警
  const componentMap = buildComponentMap(
    {
      ...import.meta.glob<{ default: Component }>('../../../components/**/*.vue'),
      ...import.meta.glob<{ default: Component }>('../../../pages/**/components/**/*.vue'),
    },
    PREVIEW_ID_BASE,
  );
  // 新增别的 components 目录（如 src/views/components）时，清单会收录但这里匹配不到、预览静默跳过。
  // 不加 DEV 判断：/__designer 路由本身不区分环境，生产里同样会踩到，而这类 mismatch 的排查成本远高于一条告警
  const unmatchedIds = componentCatalog.filter(entry => !componentMap.has(entry.id)).map(entry => entry.id);
  if (unmatchedIds.length) {
    console.warn('[component-preview] 清单里的组件未被页面 glob 覆盖，预览将跳过:', unmatchedIds);
  }

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
      status: entry.status,
    }));

  const showSlotPlaceholders = ref(false);

  const route = useRoute();
  const activeItem = computed(() => {
    const id = typeof route.query.component === 'string' ? route.query.component : previewItems[0]?.id;
    return previewItems.find(item => item.id === id) ?? previewItems[0];
  });

  const activeVariantIndex = ref(0);

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

  /** 画布适配：撑满还是按内容居中、像素高度回填多少，规则见 use-canvas-fit.ts（有单测） */
  const { canvasHeight, isFitCentered, setFitEl } = useCanvasFit({
    item: activeItem,
    overlayVersion,
    showSlotPlaceholders,
    variantIndex: activeVariantIndex,
  });

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

  /**
   * 切换组件时重置视图状态：变体下标回到第一项、退出结构视图、
   * 弹层回到收起态（否则会带着上一次的打开状态直接弹出来）。
   */
  watch(
    () => activeItem.value?.id,
    () => {
      activeVariantIndex.value = 0;
      showSlotPlaceholders.value = false;
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

  .preview-type-tag,
  .preview-status-tag {
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
     是否加这个类由 measureFit 按实测尺寸决定，规则见 use-canvas-fit.ts 的 FIT_MAX_WIDTH_RATIO / FIT_MIN_HEIGHT */
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
