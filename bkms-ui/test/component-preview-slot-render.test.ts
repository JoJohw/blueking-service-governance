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
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { buildAllPlaceholderSlots, buildRealSlots } from '~/pages/designer/preview/slot-render';

/**
 * 插槽渲染结果就是设计师看到的画面，抽成纯渲染函数后可以直接断言 DOM：
 * 「哪些 slot 出现」「出现成可替换区域还是填充块」这两件事此前完全靠肉眼。
 */

const renderSlot = (slots: Record<string, () => unknown>, name: string) => mount({ render: () => slots[name]() });

describe('结构视图的占位块', () => {
  it('每个 slot 都渲染成带名字的可替换区域', () => {
    const slots = buildAllPlaceholderSlots(['default', 'footer']);
    expect(Object.keys(slots)).toEqual(['default', 'footer']);

    const first = renderSlot(slots, 'default');
    expect(first.text()).toBe('可替换区域<slot: default>');
    expect(first.find('div').attributes('title')).toBe('可替换区域<slot: default>');
    expect(renderSlot(slots, 'footer').text()).toBe('可替换区域<slot: footer>');
  });

  it('相邻 slot 用不同颜色区分', () => {
    const slots = buildAllPlaceholderSlots(['default', 'footer']);
    const colorOf = (name: string) => renderSlot(slots, name).find('div').attributes('style');
    expect(colorOf('default')).not.toBe(colorOf('footer'));
  });
});

describe('真实态的插槽内容', () => {
  it('声明了样例时渲染样例', () => {
    const slots = buildRealSlots(['default'], [], [], { default: { sample: { text: '业务样例' } } });
    expect(renderSlot(slots, 'default').text()).toBe('业务样例');
  });

  it('repeat 样例按数量展开', () => {
    const slots = buildRealSlots(['default'], [], [], {
      default: { sample: { repeat: 3, text: '标签' } },
    });
    const wrapper = renderSlot(slots, 'default');
    expect(wrapper.text()).toBe('标签 1标签 2标签 3');
  });

  it('row 样例横向排列并带固定宽度', () => {
    const slots = buildRealSlots(['default'], [], [], {
      default: { sample: { repeat: 2, row: true, text: '环境', width: 120 } },
    });
    const wrapper = renderSlot(slots, 'default');
    expect(wrapper.text()).toBe('环境 1环境 2');
    expect(wrapper.html()).toContain('width: 120px');
  });

  it('omit 的 slot 不渲染，也不退化成填充块', () => {
    const slots = buildRealSlots(['default'], [], [], { default: { omit: true } });
    expect(Object.keys(slots)).toEqual([]);
  });

  it('组件自带 fallback 与 guarded 区域不传内容', () => {
    const slots = buildRealSlots(['title', 'icon', 'default'], ['title'], ['icon']);
    expect(Object.keys(slots)).toEqual(['default']);
  });

  it('未声明的 slot 用中性填充块兜底', () => {
    const slots = buildRealSlots(['default'], [], []);
    const wrapper = renderSlot(slots, 'default');
    expect(wrapper.text()).toBe('内容 1');
    expect(wrapper.find('div').attributes('title')).toBe('内容 1');
  });

  it('inline 声明保留填充块，但外层用 inline-flex 内联显示', () => {
    const slots = buildRealSlots(['default'], [], [], { default: { inline: true } });
    const wrapper = renderSlot(slots, 'default');
    expect(wrapper.text()).toBe('内容 1');
    expect(wrapper.html()).toContain('display: inline-flex');
  });

  it('inline 纯文本样例渲染成 inline 文本，不套高于行盒的容器', () => {
    const slots = buildRealSlots(['default'], [], [], { default: { inline: true, sample: { text: '下划线文本' } } });
    const wrapper = renderSlot(slots, 'default');
    expect(wrapper.text()).toBe('下划线文本');
    expect(wrapper.html()).toContain('white-space: nowrap');
    expect(wrapper.html()).not.toContain('min-height');
  });
});
