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
 * 预览的插槽内容渲染：结构视图给彩色虚线「可替换区域」，真实态给业务样例或中性填充块。
 *
 * 渲染结果直接决定设计师看到什么，写错的形态（比如该跳过的 slot 塞了填充块）肉眼才能发现，
 * 所以从页面里抽出来，靠单测锁住「哪些 slot 出现、出现成什么」。
 */
import { h } from 'vue';

import { resolveRealSlotKind } from './variants';

import type { ComponentCatalogEntry } from '../generated/component-catalog';

type SlotOverrides = NonNullable<ComponentCatalogEntry['slotOverrides']>;

/** sample 的形态直接由清单类型推导（已含单块、repeat、row 与数组），避免再手写一份、与 d.ts 漂移 */
type SlotSample = Extract<NonNullable<ComponentCatalogEntry['slotOverrides']>[string], { sample: unknown }>['sample'];

const slotColors = [
  { bg: 'var(--bkms-brand-6)', fg: 'var(--bkms-brand-1)' },
  { bg: 'var(--bkms-success-6)', fg: 'var(--bkms-success-1)' },
  { bg: 'var(--bkms-warning-6)', fg: 'var(--bkms-warning-1)' },
  { bg: 'var(--bkms-danger-6)', fg: 'var(--bkms-danger-1)' },
  { bg: 'var(--bkms-cyan-6)', fg: 'var(--bkms-cyan-1)' },
  { bg: 'var(--bkms-brand-7)', fg: 'var(--bkms-brand-2)' },
];

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

/** 结构视图：所有 slot 都渲染成占位块，便于识别插槽位置 */
export function buildAllPlaceholderSlots(names: string[]) {
  return Object.fromEntries(names.map((name, index) => [name, () => renderSlotPlaceholder(name, index)]));
}

/**
 * 真实态：优先业务样例，其次组件自带 fallback / 自带视觉，其余塞中性填充块撑住容器。
 * 填充块是灰色实心「内容」，不是结构视图的彩色「可替换区域」，避免误导设计师。
 * guardedSlots 是组件用 $slots.x 判断接管的区域：传内容会切分支、顶掉组件自己的插画或图标，
 * 所以这类 slot 一律不传，交给组件渲染默认样子。
 */
export function buildRealSlots(
  names: string[],
  fallbackSlots: string[],
  guardedSlots: string[],
  overrides?: SlotOverrides,
) {
  return Object.fromEntries(
    names.flatMap((name, index) => {
      const kind = resolveRealSlotKind(name, fallbackSlots, guardedSlots, overrides);
      if (kind === 'skip') return [];
      if (kind === 'sample') {
        const override = overrides?.[name];
        return override && 'sample' in override
          ? [[name, () => renderSlotSample(override.sample, override.inline)]]
          : [];
      }
      const override = overrides?.[name];
      return [[name, () => renderFillerBlock(index, override && 'inline' in override && override.inline)]];
    }),
  );
}

/** 真实态中性填充块：只撑尺寸，不表达「可替换」语义；inline 时按内容自适应、不占满宽度 */
function renderFillerBlock(index: number, inline?: boolean) {
  return h(
    'div',
    {
      title: `内容 ${index + 1}`,
      style: {
        ...placeholderBlockBase,
        display: inline ? 'inline-flex' : 'flex',
        minHeight: '20px',
        borderRadius: 'var(--bkms-radius-tag)',
        background: 'var(--bkms-neutral-2)',
        color: 'var(--bkms-text-secondary)',
      },
    },
    [renderPlaceholderText(`内容 ${index + 1}`)],
  );
}

/** inline 纯文本样例：不套任何盒子，让宿主的行盒、字体与边框（如虚线下划线）自然呈现 */
function renderInlineSampleText(text: string) {
  return h('span', { style: { whiteSpace: 'nowrap' } }, text);
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

/**
 * inline：插槽在宿主里是内联位置时，外层不能再用 width:100% 的块级容器，否则会把宿主布局挤成分行。
 * 宿主常是依赖行盒的 inline 元素（如 under-line-tips 的虚线下划线画在行盒底边、tab-header 的
 * title-extra 与标题同行）：任何高于行盒的块级/inline-flex 内容都会向下超出、盖住宿主自身的视觉。
 * 所以纯文本样例直接渲染成 inline 文本（沿用宿主字体样式），只有 repeat/row 样例才退回 inline-flex 包裹。
 */
function renderSlotSample(sample: SlotSample, inline?: boolean) {
  const items = Array.isArray(sample) ? sample : [sample];
  const isPlainText = (item: (typeof items)[number]): item is { text: string } =>
    !('row' in item) && !('repeat' in item);
  if (inline && items.every(isPlainText)) {
    const texts = items.map(item => renderInlineSampleText(item.text));
    return texts.length > 1
      ? h('span', { style: { display: 'inline-flex', alignItems: 'baseline', gap: '8px', maxWidth: '100%' } }, texts)
      : texts[0];
  }
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
  if (inline)
    return h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '100%' } }, blocks);
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' } }, blocks);
}
