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
 */
import type { Component } from 'vue';

/** 预览页目录相对 src 的路径：glob 的 key 与清单 id 之间的换算基准，页面与测试都引用这里，避免两处硬编码 */
export const PREVIEW_ID_BASE: string[] = ['pages', 'designer', 'preview'];

/** 忽略没有默认导出的模块（非组件文件，或多文件产物的空壳） */
export function buildComponentMap(
  modules: Record<string, { default?: Component }>,
  baseDir: string[],
): Map<string, Component> {
  const map = new Map<string, Component>();
  for (const [file, mod] of Object.entries(modules)) {
    if (mod.default) map.set(resolveComponentId(file, baseDir), mod.default);
  }
  return map;
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
