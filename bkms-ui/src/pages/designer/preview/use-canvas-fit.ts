/*
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
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * 画布适配：组件该撑满画布还是按自身宽度居中、高度由像素 prop 决定的组件该回填多少。
 *
 * 判断依据是渲染后的实测尺寸而不是逐个维护名单，因此依赖真实布局（jsdom 里需要打桩尺寸）。
 * 抽出来单测的是「哪些情况强行撑满 / 强行居中 / 回填高度从哪来」这几条优先级。
 */
import { type ComputedRef, type Ref, nextTick, onBeforeUnmount, ref, watch } from 'vue';

export interface CanvasFitItem {
  containerWidth?: number;
  fillHeight?: boolean;
  fillWidth?: boolean;
  heightProp?: string;
  id: string;
}

export interface CanvasFitSources {
  item: ComputedRef<CanvasFitItem | null | undefined>;
  overlayVersion: Ref<number>;
  showSlotPlaceholders: Ref<boolean>;
  variantIndex: Ref<number>;
}

/** 内容宽度低于画布可用宽的 75%、且高度不到 200px，视为内联小件，按自身宽度居中 */
const FIT_MAX_WIDTH_RATIO = 0.75;
const FIT_MIN_HEIGHT = 200;

export function useCanvasFit(sources: CanvasFitSources) {
  const fitEl = ref<HTMLElement | null>(null);
  const isFitCentered = ref(true);
  /**
   * 承载层的实测可用高。高度由像素 prop 决定的组件（如 ms-editor-plus 的 containerHeight）
   * 拿到这个值才能铺满，否则一直是组件自带的默认像素高。
   */
  const canvasHeight = ref(0);
  let fitObserver: null | ResizeObserver = null;
  let canvasObserver: null | ResizeObserver = null;

  /**
   * 优先量承载层自身高度（fillHeight 下它有确定高度，与组件内容无关，不会来回抖），
   * 结构视图等没有确定高度的场景再退回按画布可用高估算。
   */
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
   *
   * 这里是单向的、有意为之：撑满后内容再收缩（删行、折叠面板收起）不会退回居中，
   * 否则表格滚动加载时会在两种布局之间反复跳动。切组件/切变体会重新走整条判定，足够覆盖场景。
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
    () =>
      [
        sources.item.value?.id,
        sources.variantIndex.value,
        sources.showSlotPlaceholders.value,
        sources.overlayVersion.value,
      ].join(),
    async () => {
      fitObserver?.disconnect();
      canvasObserver?.disconnect();
      const item = sources.item.value;
      // 满宽布局壳的宽度来自父容器，按内容量出来的宽度代表不了业务形态，直接撑满
      isFitCentered.value = !item?.fillWidth;
      if (sources.showSlotPlaceholders.value || !item || item.fillHeight || item.fillWidth) {
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

  return { canvasHeight, isFitCentered, setFitEl };
}
