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
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

export interface ComponentCatalogEntry {
  fallbackSlots: string[];
  id: string;
  needsForm: boolean;
  props: Record<string, unknown>;
  /** 插件声明的组件族：一个容器配若干骨架变体 */
  family?: {
    entry: string;
    variants: { label: string; nodes: { id: string; props?: Record<string, unknown> }[] }[];
  };
  slots: string[];
  /** 插件为特定 slot 提供的预览样例，替代通用占位块 */
  slotSamples?: Record<
    string,
    | { text: string }
    | { repeat: number; text?: string }
    | ({ text: string } | { repeat: number; text?: string })[]
  >;
  usage: number;
  /** 控制 Dialog/Sideslider 显隐的 prop 名；非弹层类组件为 null */
  visibilityProp: string | null;
  warnings: string[];
}

export declare const componentCatalog: ComponentCatalogEntry[];
