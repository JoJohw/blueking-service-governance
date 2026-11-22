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
 * designer chunk 体积预算。
 * 预算只算「两个设计器入口 + 它们的静态 imports」，并排除主入口 chunk：
 * 设计器是同一个 SPA 的路由，必然依赖主入口（所有页面都要下载，不算设计器带来的增量）；
 * 按需加载的组件 chunk 是运行期才下载的，也不该计入首屏。
 * 若有人把 import.meta.glob 改回 eager，210 个组件会变成静态依赖，这里立刻超标。
 *
 * 默认只告警；CI 里设 BK_DESIGNER_BUNDLE_STRICT=1 会让构建失败，
 * 预算大小可用 BK_DESIGNER_BUNDLE_BUDGET_KB 按实测调整。
 */
import zlib from 'node:zlib';

/** 设计器专属代码分布在 src/pages/designer 与 dev/palette，两处拆出的 chunk 都计入预算 */
const DESIGNER_ENTRY = /[\\/](?:src[\\/]pages[\\/]designer|dev[\\/]palette)[\\/]/;
export const DEFAULT_DESIGNER_BUDGET_KB = 1024;

export function checkDesignerBudget(bundle, budgetBytes = DEFAULT_DESIGNER_BUDGET_KB * 1024) {
  const files = collectDesignerStaticFiles(bundle);
  const bytes = measureDesignerGzipBytes(bundle, files);
  return { bytes, files, over: bytes > budgetBytes };
}

export function collectDesignerStaticFiles(bundle) {
  const files = new Set();
  const visit = fileName => {
    if (files.has(fileName)) return;
    const chunk = bundle[fileName];
    // isEntry 是 SPA 主入口，所有页面都要下载，不算设计器带来的增量
    if (!chunk || chunk.type !== 'chunk' || chunk.isEntry) return;
    files.add(fileName);
    for (const dep of chunk.imports ?? []) visit(dep);
  };
  for (const [fileName, chunk] of Object.entries(bundle)) {
    if (chunk.type === 'chunk' && DESIGNER_ENTRY.test(chunk.facadeModuleId ?? '')) visit(fileName);
  }
  return [...files];
}

export function designerBundleBudgetPlugin() {
  return {
    name: 'designer-bundle-budget',
    generateBundle(_options, bundle) {
      const { bytes: budgetBytes, invalid } = resolveBudgetBytes(process.env.BK_DESIGNER_BUNDLE_BUDGET_KB);
      if (invalid) {
        this.warn(
          `[designer-bundle] 非法的 BK_DESIGNER_BUNDLE_BUDGET_KB="${process.env.BK_DESIGNER_BUNDLE_BUDGET_KB}"，回退到默认 ${DEFAULT_DESIGNER_BUDGET_KB} KiB`,
        );
      }
      // 生产构建若把 designer 整条链路剔除，不产出这些入口，预算检查自然跳过
      if (!hasDesignerEntries(bundle)) return;
      const result = checkDesignerBudget(bundle, budgetBytes);
      // 有 designer 入口但静态依赖清单为空：入口被误标为 isEntry 或整体被排除，预算检查实际没生效，不能静默跳过
      if (!result.files.length) {
        const message =
          '[designer-bundle] 检测到 designer 入口但静态依赖清单为空（入口可能被误标为 isEntry），预算检查未生效';
        if (process.env.BK_DESIGNER_BUNDLE_STRICT === '1') throw new Error(message);
        this.warn(message);
        return;
      }
      const actual = `${(result.bytes / 1024).toFixed(1)} KiB`;
      const budget = `${(budgetBytes / 1024).toFixed(0)} KiB`;
      if (!result.over) {
        console.log(`[designer-bundle] 静态依赖 ${actual} / 预算 ${budget}（${result.files.length} 个 chunk）`);
        return;
      }
      const message = `[designer-bundle] 静态依赖 ${actual} 超过预算 ${budget}（${result.files.length} 个 chunk）；检查是否把组件 eager 打包进来了`;
      if (process.env.BK_DESIGNER_BUNDLE_STRICT === '1') throw new Error(message);
      this.warn(message);
    },
  };
}

/** bundle 里是否存在 designer 入口（facadeModuleId 命中 DESIGNER_ENTRY），与是否被排除无关 */
export function hasDesignerEntries(bundle) {
  return Object.values(bundle).some(
    chunk => chunk?.type === 'chunk' && DESIGNER_ENTRY.test(chunk.facadeModuleId ?? ''),
  );
}

export function measureDesignerGzipBytes(bundle, files) {
  return files.reduce((sum, fileName) => {
    const chunk = bundle[fileName];
    if (chunk?.type !== 'chunk' || typeof chunk.code !== 'string') return sum;
    return sum + zlib.gzipSync(Buffer.from(chunk.code)).length;
  }, 0);
}

/**
 * 解析预算字节数。非法配置（NaN / <=0）不静默关闭检查，而是回退到默认预算并返回 invalid 标记，
 * 由调用方告警。envValue 未设置或空串走默认预算（合法，不告警）。
 */
export function resolveBudgetBytes(envValue) {
  const raw = envValue === undefined || envValue === '' ? DEFAULT_DESIGNER_BUDGET_KB : Number(envValue);
  const invalid = !Number.isFinite(raw) || raw <= 0;
  return { bytes: (invalid ? DEFAULT_DESIGNER_BUDGET_KB : raw) * 1024, invalid };
}
