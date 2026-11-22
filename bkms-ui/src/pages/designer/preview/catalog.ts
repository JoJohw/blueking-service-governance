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
 * 组件模块表：把 Vite glob 的结果映射成「清单 id -> 组件」。
 *
 * id 规则必须与 scripts/component-preview/component-preview.config.mjs 的
 * componentIdBase / componentIdStripPrefixes 保持一致，两处不同步会导致预览找不到组件，
 * 且默认静默（componentMap.has 为 false 的条目会被直接过滤掉），所以单独抽出来加单测。
 *
 * glob 用非 eager 形式：每个组件是一个 loader，只有真正渲染到时才下载对应 chunk。
 * 清单只收录 44 个组件，但 glob 会命中 210 个 .vue，静态引入会把其余模块和它们的
 * 重依赖（monaco / echarts / g6）全部拖进设计器首屏。
 */
import { type Component, defineAsyncComponent, defineComponent, h } from 'vue';

/** 预览页目录相对 src 的路径：glob 的 key 与清单 id 之间的换算基准，页面与测试都引用这里，避免两处硬编码 */
export const PREVIEW_ID_BASE: string[] = ['pages', 'designer', 'preview'];

/** 兼容两种输入：已加载的模块（eager）与 Vite 的懒加载 loader（默认） */
export type PreviewModule = (() => Promise<ComponentModule>) | ComponentModule;
type ComponentModule = { default?: Component };

const LoadingComponent = () => h('div', { style: 'font-size:12px;color:var(--bkms-text-secondary)' }, '组件加载中…');

const ErrorComponent = (props: { error?: unknown }) => h('pre', { class: 'render-error' }, String(props.error ?? ''));

/** 忽略没有默认导出的模块（非组件文件，或多文件产物的空壳） */
export function buildComponentMap(modules: Record<string, PreviewModule>, baseDir: string[]): Map<string, Component> {
  const map = new Map<string, Component>();
  for (const [file, mod] of Object.entries(modules)) {
    const id = resolveComponentId(file, baseDir);
    if (typeof mod === 'function') map.set(id, createLazyComponent(mod, id));
    else if (mod.default) map.set(id, mod.default);
  }
  return map;
}

/** 把 loader 包成普通组件：SafeComponent / h(component) 无需关心异步，加载态与错误态就地兜住 */
export function createLazyComponent(loader: () => Promise<ComponentModule>, id: string): Component {
  // 缺默认导出是「配置错」而不是「加载异常」：直接返回一个说明组件，
  // 不让 defineAsyncComponent 走 errorComponent 抛未处理错误刷控制台。
  const missingDefault = () => h('pre', { class: 'render-error' }, `组件没有默认导出: ${id}`);
  const lazy = defineAsyncComponent({
    loader: async () => {
      const mod = await loader();
      return mod?.default ?? missingDefault;
    },
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    // 预览页没有 <Suspense> 包裹，必须让异步组件自己渲染 loading/error，
    // 否则首帧返回空节点，宿主拿不到组件实例。
    suspensible: false,
    delay: 100,
    timeout: 15000,
  });
  // 外面再垫一层有状态组件：函数式根节点在测试/宿主里拿不到组件实例，
  // 同时保证 props 与 slots 原样透传给真实组件。
  return defineComponent({
    name: 'DesignerLazyComponent',
    setup(_props, { attrs, slots }) {
      return () => h(lazy, attrs, slots);
    },
  });
}

/**
 * glob key 还原成相对 src 的清单 id。
 * baseDir 是 glob 所在目录相对 src 的路径（如 ['pages', 'designer', 'preview']），由调用方传入，
 * 避免这里再硬编码一份目录层次——文件挪动时只改调用方一处，漏改会直接体现在单测里。
 */
export function resolveComponentId(file: string, baseDir: string[]): string {
  const stack: string[] = [];
  for (const part of [...baseDir, ...file.replace(/\.vue$/, '').split('/')]) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}
