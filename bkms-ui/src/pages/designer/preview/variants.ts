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
 * 预览变体的选择与合并规则。
 *
 * 抽成纯函数是为了能单测：这些规则决定「标题栏出现哪些按钮」「当前变体的 slot 样例如何与条目合并」，
 * 写错只会表现为预览里少个按钮或样例不生效，界面上不报错，靠肉眼回归代价高。
 */
import type { ComponentCatalogEntry } from '../generated/component-catalog';

export type PreviewVariant = NonNullable<ComponentCatalogEntry['variants']>[number];
export type RealSlotKind = 'filler' | 'sample' | 'skip';

export type SlotOverrides = NonNullable<ComponentCatalogEntry['slotOverrides']>;

/** 参与变体决策的条目字段，清单条目与预览页映射后的对象都满足 */
export interface VariantHost {
  family?: ComponentCatalogEntry['family'];
  props: Record<string, unknown>;
  slotOverrides?: SlotOverrides;
  variants?: ComponentCatalogEntry['variants'];
}

/** 当前变体；下标越界回落到第一个，避免切换组件后沿用上一组下标 */
export function resolveActiveVariant(host: VariantHost, index: number): null | PreviewVariant {
  const variants = host.variants ?? [];
  return variants[index] ?? variants[0] ?? null;
}

/**
 * 标题栏的切换项：组件族变体（骨架单元）优先，其次插件声明的真实态变体。
 * 结构视图看的是插槽占位，内容量变体不起作用，按下也无变化，故不返回。
 */
export function resolvePreviewTabs(host: VariantHost, showSlotPlaceholders: boolean): { label: string }[] {
  if (host.family) return host.family.variants;
  if (showSlotPlaceholders) return [];
  return host.variants ?? [];
}

/**
 * 真实态单个 slot 的渲染方式，优先级：样例 > omit > 组件自带 fallback / 自带视觉 > 中性填充块。
 * omit 必须显式跳过——漏了就会落到 filler 分支，塞进占位块顶掉组件自己的插画或图标。
 */
export function resolveRealSlotKind(
  name: string,
  fallbackSlots: string[],
  guardedSlots: string[],
  overrides?: SlotOverrides,
): RealSlotKind {
  const override = overrides?.[name];
  if (override && 'sample' in override) return 'sample';
  if (override && 'omit' in override) return 'skip';
  if (fallbackSlots.includes(name) || guardedSlots.includes(name)) return 'skip';
  return 'filler';
}

/** 变体只覆盖它关心的 slot（如只换 default 的内容量），其余沿用条目自己的样例 */
export function resolveSlotOverrides(host: VariantHost, variant: null | PreviewVariant): SlotOverrides | undefined {
  if (!variant?.slotOverrides) return host.slotOverrides;
  return { ...host.slotOverrides, ...variant.slotOverrides };
}

/** props 覆盖：族变体与插件变体都可能给值，插件变体优先；都没给时原样返回，不制造新对象 */
export function resolveVariantProps(
  host: VariantHost,
  familyVariant: null | { props?: Record<string, unknown> },
  variant: null | PreviewVariant,
): Record<string, unknown> {
  const patch = { ...familyVariant?.props, ...variant?.props };
  return Object.keys(patch).length ? { ...host.props, ...patch } : host.props;
}
