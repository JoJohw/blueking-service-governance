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

/**
 * 组件预览清单生成器入口：缓存命中就跳过，否则扫描组件、推导占位并写盘。
 * 配置在 component-preview.config.mjs（忽略清单、占位值、风险特征），实现都在 internal/：路径常量在 paths.mjs，
 * 结构解析在 props.mjs / slots.mjs，清单拼装与写盘在 catalog.mjs，缓存签名在 cache.mjs。
 */

import fs from 'node:fs';
import path from 'node:path';

import { readCache, signatureOf, writeCache } from './internal/cache.mjs';
import { buildCatalog, collectUsageSources, writeCatalog } from './internal/catalog.mjs';
import { OUTPUT, ROOT } from './internal/paths.mjs';

function main() {
  try {
    const usageSources = collectUsageSources();
    const signature = signatureOf(usageSources.map(source => source.file));
    const cached = readCache();
    if (cached === signature && fs.existsSync(OUTPUT)) {
      console.log('[component-preview] 无变更，跳过生成');
      return;
    }
    const catalog = buildCatalog(usageSources);
    writeCatalog(catalog);
    writeCache(signature);
    console.log(`[component-preview] 已生成 ${catalog.length} 个组件条目 -> ${path.relative(ROOT, OUTPUT)}`);
  } catch (error) {
    console.error(
      `[component-preview] 生成失败，写入空清单: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    try {
      writeCatalog([]);
    } catch {
      // 连空清单都写不出时，保持上一次产物不动，避免破坏构建
    }
  }
}

main();
