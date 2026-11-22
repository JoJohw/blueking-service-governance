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
  /** 插件声明的固定宽度容器：让内容自适应宽度的组件在预览中像业务里一样宽度恒定 */
  containerWidth?: number;
  fallbackSlots: string[];
  /** 插件声明的满高布局壳：预览时按画布内容区定高，避免 height:100% 没有参照而塌陷 */
  fillHeight?: boolean;
  /** 插件声明的满宽布局壳：预览时不按内容宽度居中，直接铺满画布 */
  fillWidth?: boolean;
  /** 模板里用 $slots.x 判断接管与否的 slot：传了会切分支、顶掉组件自带视觉，真实态不塞占位块 */
  guardedSlots: string[];
  /** 插件声明的高度由像素 prop 决定的组件：预览把画布实测可用高回填到该 prop */
  heightProp?: string;
  /** 插槽不由设计决定（使用方填充或已有别的表达入口）：不展示「查看可替换结构」，菜单也不标 SLOT */
  hideSlotStructure?: boolean;
  id: string;
  needsForm: boolean;
  props: Record<string, unknown>;
  slots: string[];
  /** 相对组件基线的三态：new（新增）/ changed（样例待确认）/ stable（无变化）；removed 独立成 removedIds，不进 status */
  status: 'changed' | 'new' | 'stable';
  usage: number;
  /** 控制 Dialog/Sideslider 显隐的 prop 名；非弹层类组件为 null */
  visibilityProp: null | string;
  warnings: string[];
  /** 插件声明的组件族：一个容器配若干变体，变体可塞骨架单元或覆盖容器 props */
  family?: {
    entry: string;
    variants: {
      label: string;
      nodes: { id: string; props?: Record<string, unknown> }[];
      props?: Record<string, unknown>;
    }[];
  };
  /** 插件声明的可替换区域结构搭配：设计师视角下按搭配分卡展示 slot 结构 */
  slotCombos?: {
    label: string;
    /** 该搭配启用的 slot；未列出的 slot 按 omit 处理 */
    slots: string[];
  }[];
  /** 插件对特定 slot 的预览覆写：omit 使用组件自带 fallback，sample 用业务样例替代占位块 */
  slotOverrides?: Record<
    string,
    | {
        /** 插槽在宿主里是内联位置时置 true，保留默认中性填充块但外层用 inline-flex、按内容自适应 */
        inline: true;
      }
    | {
        /** 插槽在宿主里是内联位置时置 true：纯文本样例渲染成 inline 文本，避免块级内容盖住宿主自己的行盒视觉（如下划线、同行布局） */
        inline?: boolean;
        sample:
          | (
              | { repeat: number; row: true; text?: string; width?: number }
              | { repeat: number; text?: string }
              | { text: string }
            )[]
          | { repeat: number; row: true; text?: string; width?: number }
          | { repeat: number; text?: string }
          | { text: string };
      }
    | { omit: true }
  >;
  /**
   * 插件声明的真实态预览变体：同一组件在内容量 / props 不同时形态不同（如内容溢出与否决定 footer 位置），
   * 预览标题栏给一组切换按钮，每项可与条目的 slotOverrides / props 合并，变体优先。
   */
  variants?: {
    label: string;
    props?: Record<string, unknown>;
    slotOverrides?: ComponentCatalogEntry['slotOverrides'];
  }[];
}

export declare const componentCatalog: ComponentCatalogEntry[];
