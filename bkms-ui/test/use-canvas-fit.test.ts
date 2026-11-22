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
import { computed, defineComponent, h, ref, toRef } from 'vue';

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CanvasFitItem, useCanvasFit } from '~/pages/designer/preview/use-canvas-fit';

/**
 * 画布适配的判定优先级：满宽布局壳 > 定宽组件 > 按实测尺寸推断。
 * jsdom 不做布局，这里给承载层与内容打桩尺寸，只验证规则本身。
 */

interface ObserverStub {
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  callback: () => void;
}

const observers: ObserverStub[] = [];

class ResizeObserverStub implements ObserverStub {
  callback: () => void;
  disconnect = vi.fn();
  observe = vi.fn();
  constructor(callback: () => void) {
    this.callback = callback;
    observers.push(this);
  }
  unobserve() {}
}

const Harness = defineComponent({
  props: {
    item: { type: Object, default: null },
    structure: { type: Boolean, default: false },
  },
  setup(props, { expose }) {
    const variantIndex = ref(0);
    const overlayVersion = ref(0);
    const canvasFit = useCanvasFit({
      item: computed(() => props.item as CanvasFitItem | null),
      overlayVersion,
      showSlotPlaceholders: toRef(props, 'structure'),
      variantIndex,
    });
    expose(canvasFit);
    return () => h('div', { class: 'holder' }, [h('div', { class: 'target', ref: canvasFit.setFitEl })]);
  },
});

interface HarnessVm {
  canvasHeight: number;
  isFitCentered: boolean;
}

/** 挂载后打桩：承载层可用宽 800，内容尺寸按用例给 */
async function mountWithSize(
  item: CanvasFitItem,
  size?: { height: number; width: number },
  options: { structure?: boolean } = {},
) {
  const wrapper = mount(Harness, { props: { item, structure: options.structure ?? false } });
  const holder = wrapper.element as HTMLElement;
  const target = wrapper.find('.target').element as HTMLElement;
  Object.defineProperty(holder, 'clientWidth', { configurable: true, value: 800 });
  if (size) {
    Object.defineProperty(target, 'clientHeight', { configurable: true, value: size.height });
    const rect: DOMRect = {
      bottom: size.height,
      height: size.height,
      left: 0,
      right: size.width,
      toJSON: () => ({}),
      top: 0,
      width: size.width,
      x: 0,
      y: 0,
    };
    target.getBoundingClientRect = () => rect;
  }
  await flushPromises();
  return wrapper;
}

const vmOf = (wrapper: ReturnType<typeof mount>) => wrapper.vm as unknown as HarnessVm;

const baseItem: CanvasFitItem = { id: 'components/inline-input' };

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

describe('按实测尺寸推断', () => {
  it('窄小内联件按内容宽度居中', async () => {
    const wrapper = await mountWithSize(baseItem, { height: 32, width: 300 });
    expect(vmOf(wrapper).isFitCentered).toBe(true);
  });

  it('宽度接近画布可用宽的组件撑满', async () => {
    const wrapper = await mountWithSize(baseItem, { height: 100, width: 760 });
    expect(vmOf(wrapper).isFitCentered).toBe(false);
  });

  it('内容本身很高的组件（卡片/表格）撑满', async () => {
    const wrapper = await mountWithSize(baseItem, { height: 400, width: 300 });
    expect(vmOf(wrapper).isFitCentered).toBe(false);
  });

  it('判定撑满后停止观察，避免内容收缩时来回跳', async () => {
    const wrapper = await mountWithSize(baseItem, { height: 32, width: 300 });
    const fitObserver = observers[0];
    expect(fitObserver).toBeTruthy();
    // 模拟异步内容把尺寸撑开：观察器回调里判定为撑满并断开
    const target = wrapper.find('.target').element as HTMLElement;
    const expanded: DOMRect = {
      bottom: 500,
      height: 500,
      left: 0,
      right: 800,
      toJSON: () => ({}),
      top: 0,
      width: 800,
      x: 0,
      y: 0,
    };
    target.getBoundingClientRect = () => expanded;
    fitObserver.callback();
    await flushPromises();
    expect(vmOf(wrapper).isFitCentered).toBe(false);
    expect(fitObserver.disconnect).toHaveBeenCalled();
  });
});

describe('显式声明优先于实测尺寸', () => {
  it('满宽布局壳直接撑满，不看内容尺寸', async () => {
    const wrapper = await mountWithSize({ ...baseItem, fillWidth: true }, { height: 32, width: 100 });
    expect(vmOf(wrapper).isFitCentered).toBe(false);
  });

  it('定宽组件即便内容很高也保持居中', async () => {
    const wrapper = await mountWithSize({ ...baseItem, containerWidth: 240 }, { height: 600, width: 900 });
    expect(vmOf(wrapper).isFitCentered).toBe(true);
  });
});

describe('高度回填', () => {
  it('fillHeight 且声明了像素高度 prop 时回填承载层实测高', async () => {
    const wrapper = await mountWithSize(
      { ...baseItem, fillHeight: true, heightProp: 'height' },
      { height: 520, width: 800 },
    );
    expect(vmOf(wrapper).canvasHeight).toBe(520);
  });

  it('只声明 heightProp 但没标 fillHeight 时不回填（走正常测量）', async () => {
    const wrapper = await mountWithSize({ ...baseItem, heightProp: 'height' }, { height: 520, width: 800 });
    expect(vmOf(wrapper).canvasHeight).toBe(0);
  });
});

describe('结构视图与降级', () => {
  it('结构视图不测量：内容再大也按 fillWidth 决定，默认居中', async () => {
    const wrapper = await mountWithSize(baseItem, { height: 900, width: 900 }, { structure: true });
    expect(vmOf(wrapper).isFitCentered).toBe(true);
  });

  it('没有 ResizeObserver 时跳过观察，判定仍生效', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const wrapper = await mountWithSize(baseItem, { height: 32, width: 300 });
    expect(vmOf(wrapper).isFitCentered).toBe(true);
    expect(observers).toHaveLength(0);
  });
});
