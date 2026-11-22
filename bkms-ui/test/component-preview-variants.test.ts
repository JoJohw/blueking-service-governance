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
import { describe, expect, it } from 'vitest';
import {
  type SlotOverrides,
  type VariantHost,
  resolveActiveVariant,
  resolvePreviewTabs,
  resolveRealSlotKind,
  resolveSlotOverrides,
  resolveVariantProps,
} from '~/pages/designer/preview/variants';

/**
 * 预览变体的选择与合并规则：写错只表现为「标题栏少个按钮」或「样例不生效」，
 * 界面不报错，所以用纯函数用例锁住优先级与回落行为。
 */

const slotOverrides = {
  default: { sample: { text: '条目的默认样例' } },
  footer: { sample: { text: '固定底部操作区 footer' } },
};

const host: VariantHost = {
  props: { contentClass: 'w-full' },
  slotOverrides,
  variants: [
    { label: '内容不溢出', slotOverrides: { default: { sample: { text: '少量内容' } } } },
    {
      label: '内容溢出',
      slotOverrides: { default: { sample: { repeat: 20, text: '内容块' } } },
      props: { mode: 'scroll' },
    },
  ],
};

describe('标题栏切换项', () => {
  it('有组件族时只给族变体，插件变体不参与', () => {
    const family = { entry: 'components/skeleton/skeleton', variants: [{ label: '形状', nodes: [] }] };
    expect(resolvePreviewTabs({ ...host, family }, false).map(tab => tab.label)).toEqual(['形状']);
  });

  it('结构视图不展示插件变体', () => {
    expect(resolvePreviewTabs(host, true)).toEqual([]);
  });

  it('真实态按声明顺序给出插件变体', () => {
    expect(resolvePreviewTabs(host, false).map(tab => tab.label)).toEqual(['内容不溢出', '内容溢出']);
  });

  it('没有变体声明的组件返回空数组', () => {
    expect(resolvePreviewTabs({ props: {} }, false)).toEqual([]);
  });
});

describe('当前变体', () => {
  it('下标越界回落到第一个，避免切组件后沿用上一组下标', () => {
    expect(resolveActiveVariant(host, 9)?.label).toBe('内容不溢出');
  });

  it('没有变体时为 null', () => {
    expect(resolveActiveVariant({ props: {} }, 0)).toBeNull();
  });
});

describe('slot 样例合并', () => {
  it('变体只覆盖自己声明的 slot，其余沿用条目样例', () => {
    const merged = resolveSlotOverrides(host, host.variants![1]);
    expect(merged?.default).toEqual({ sample: { repeat: 20, text: '内容块' } });
    // footer 不被变体清掉：ScrollLayout 的底部样例靠这一条
    expect(merged?.footer).toEqual(slotOverrides.footer);
  });

  it('变体没有 slot 覆盖时原样返回条目样例', () => {
    const passthrough = resolveSlotOverrides(host, { label: '无覆盖' });
    expect(passthrough).toBe(host.slotOverrides);
  });

  it('没有变体时原样返回条目样例', () => {
    expect(resolveSlotOverrides(host, null)).toBe(host.slotOverrides);
  });
});

describe('props 合并', () => {
  it('族变体与插件变体依次叠加在条目 props 之上，后写的覆盖先写的', () => {
    expect(resolveVariantProps(host, { props: { contentClass: 'flex-1' } }, host.variants![1])).toEqual({
      contentClass: 'flex-1',
      mode: 'scroll',
    });
  });

  it('两级都没有覆盖时返回原 props 引用，不制造新对象', () => {
    expect(resolveVariantProps(host, null, { label: '无覆盖' })).toBe(host.props);
    expect(resolveVariantProps(host, null, null)).toBe(host.props);
  });
});

describe('真实态 slot 渲染方式', () => {
  const sampled: SlotOverrides = { default: { sample: { text: '业务样例' } } };
  const omitted: SlotOverrides = { default: { omit: true } };

  it('声明样例时渲染样例', () => {
    expect(resolveRealSlotKind('default', [], [], sampled)).toBe('sample');
  });

  it('omit 必须跳过，不能落到填充块分支', () => {
    expect(resolveRealSlotKind('default', [], [], omitted)).toBe('skip');
  });

  it('组件自带 fallback 与 guarded slot 都不传内容', () => {
    expect(resolveRealSlotKind('title', ['title'], [])).toBe('skip');
    expect(resolveRealSlotKind('icon', [], ['icon'])).toBe('skip');
  });

  it('没有声明的 slot 兜底为中性填充块', () => {
    expect(resolveRealSlotKind('default', [], [])).toBe('filler');
  });
});
