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
 * 结构解析在 props.mjs / slots.mjs，清单拼装与写盘在 catalog.mjs，缓存签名在 cache.mjs，基线 diff 在 baseline.mjs。
 *
 * CLI：
 *   node scripts/component-preview/index.mjs                       日常生成（写 catalog / api-mock / 缓存 + 告警）
 *   node scripts/component-preview/index.mjs --check               只在内存 buildCatalog，打印 new/changed/removed/info
 *   node scripts/component-preview/index.mjs --baseline            首次建基线（全量 new 是预期）
 *   node scripts/component-preview/index.mjs --baseline --only <id> 增量确认单个 catalog 内组件
 *   node scripts/component-preview/index.mjs --baseline --prune     清理 removed 条目（完整性守卫不通过会拒绝）
 *   node scripts/component-preview/index.mjs --baseline --force --yes 非首次全量写回（清空待确认）
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { collectApiMocks, walk, writeApiMock } from './internal/api-mock.mjs';
import {
  applyCompletenessGuard,
  computeEntries,
  computeStatus,
  planBaselineWrite,
  readBaseline,
  sampleExtensionWhitelist,
  writeBaseline,
} from './internal/baseline.mjs';
import { readCache, signatureOf, writeCache } from './internal/cache.mjs';
import { buildCatalog, collectUsageSources, writeCatalog } from './internal/catalog.mjs';
import { API_MOCK_OUTPUT, API_MODULES_DIR, OUTPUT, ROOT } from './internal/paths.mjs';

const cliArgs = process.argv.slice(2);

/**
 * 解析并校验 CLI 参数。返回 flags 对象；参数非法时返回 { error: string }。
 * 校验：--only 必须有值且不以 -- 开头；--prune/--only/--force/--yes 必须配 --baseline；
 * --check 与 --baseline 互斥；未知参数报错。
 */
export function parseArgs(argv) {
  const result = { check: false, baseline: false, prune: false, force: false, yes: false, only: null };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    switch (arg) {
      case '--check':
        result.check = true;
        break;
      case '--baseline':
        result.baseline = true;
        break;
      case '--prune':
        result.prune = true;
        break;
      case '--force':
        result.force = true;
        break;
      case '--yes':
        result.yes = true;
        break;
      case '--only': {
        if (result.only !== null) {
          return { error: '--only 只能出现一次' };
        }
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) {
          return { error: '--only 需要一个组件 id' };
        }
        result.only = value;
        index += 1;
        break;
      }
      default:
        return { error: `未知参数: ${arg}` };
    }
  }
  if (result.check && result.baseline) {
    return { error: '--check 与 --baseline 互斥，不能同时使用' };
  }
  if ((result.prune || result.only || result.force || result.yes) && !result.baseline) {
    return { error: '--prune / --only / --force / --yes 必须配合 --baseline 使用' };
  }
  if (result.prune && result.only) {
    return { error: '--prune 与 --only 互斥，不能同时使用' };
  }
  if (result.only && result.force) {
    return { error: '--only 与 --force 互斥，不能同时使用' };
  }
  if (result.prune && result.force) {
    return { error: '--prune 与 --force 互斥，不能同时使用' };
  }
  if (result.yes && !result.force) {
    return { error: '--yes 必须配合 --force 使用' };
  }
  return result;
}

/** --check / --baseline 共用：全量扫描、只在内存 buildCatalog，绕缓存 */
function buildCatalogInMemory() {
  return buildCatalog(collectUsageSources());
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function main() {
  const args = parseArgs(cliArgs);
  if (args.error) {
    console.error(`[component-preview] ${args.error}`);
    printUsage();
    process.exitCode = 1;
    return;
  }
  if (args.check) {
    try {
      runCheck();
    } catch (error) {
      console.error(`[component-preview --check] 失败: ${errorMessage(error)}`);
      process.exitCode = 1;
    }
    return;
  }
  if (args.baseline) {
    try {
      runBaseline(args);
    } catch (error) {
      console.error(`[component-preview --baseline] 失败: ${errorMessage(error)}`);
      process.exitCode = 1;
    }
    return;
  }
  runBuild();
}

function printUsage() {
  console.log('用法:');
  console.log(
    '  node scripts/component-preview/index.mjs                            日常生成（写 catalog / api-mock / 缓存）',
  );
  console.log(
    '  node scripts/component-preview/index.mjs --check                    只读检查 diff/status，不写任何产物',
  );
  console.log('  node scripts/component-preview/index.mjs --baseline                 首次建全量基线');
  console.log('  node scripts/component-preview/index.mjs --baseline --only <id>     增量确认单个 catalog 内组件');
  console.log('  node scripts/component-preview/index.mjs --baseline --prune         清理 removed 条目');
  console.log('  node scripts/component-preview/index.mjs --baseline --force --yes   非首次全量写回');
}

/** 读基线并告警：读取异常（损坏/IO）→ fail-safe，warn 一行，绝不当成首次全量 new */
function readBaselineWithWarn() {
  const baseline = readBaseline();
  if (baseline === null) {
    console.warn('[component-preview] 基线读取异常，跳过对比、全部按 stable');
  }
  return baseline;
}

function runBaseline(args) {
  const baseline = readBaselineWithWarn();
  const catalog = buildCatalogInMemory();
  const result = computeStatus(catalog, baseline, sampleExtensionWhitelist());

  // --prune：只删 removed 孤儿条目，不触发全量写回
  if (args.prune) {
    const guard = applyCompletenessGuard(result, 'prune');
    if (!guard.allowed) {
      console.error(
        '[component-preview --baseline --prune] 目录可能不完整（条目数相对基线骤降 >10%），拒绝清理 removed 条目',
      );
      process.exitCode = 1;
      return;
    }
    if (baseline === undefined) {
      console.log('[component-preview --baseline --prune] 基线不存在，无需清理');
      return;
    }
    if (baseline === null) {
      console.warn('[component-preview --baseline --prune] 基线读取异常（可能损坏），无法清理，请先人工恢复基线');
      return;
    }
    if (!result.removedIds.length) {
      console.log('[component-preview --baseline --prune] 无 removed 条目');
      return;
    }
    const entries = { ...baseline.entries };
    for (const id of result.removedIds) delete entries[id];
    writeBaseline({ schemaVersion: baseline.schemaVersion, entries });
    console.log(
      `[component-preview --baseline --prune] 已清理 ${result.removedIds.length} 个 removed 条目: ${result.removedIds.join(', ')}`,
    );
    return;
  }

  // --only <id>：增量确认单个 catalog 内组件；removed 组件不走这里
  if (args.only) {
    // 写回决策已抽到 planBaselineWrite 纯函数（损坏 / 首次 / 组件不在 catalog 三种拒绝路径 + 正常写回）
    const plan = planBaselineWrite(args.only, baseline, catalog);
    if (plan.error) {
      console.error(`[component-preview --baseline --only] ${plan.error}`);
      process.exitCode = 1;
      return;
    }
    writeBaseline({ schemaVersion: plan.schemaVersion, entries: plan.entries });
    console.log(`[component-preview --baseline --only] 已确认 ${args.only}`);
    return;
  }

  // 全量写回：首次（基线不存在）允许无 --force；非首次需 --force --yes
  const firstRun = baseline === undefined;
  if (!firstRun && !(args.force && args.yes)) {
    console.error('[component-preview --baseline] 非首次全量写回需要 --baseline --force --yes（会清空已确认的待办）');
    if (args.force) {
      const pending = [...result.statuses.entries()].filter(([, status]) => status !== 'stable');
      console.log('将清空的待确认清单:');
      for (const [id, status] of pending) console.log(`  [${status}] ${id}`);
    }
    process.exitCode = 1;
    return;
  }

  if (args.force && args.yes) {
    const pending = [...result.statuses.entries()].filter(([, status]) => status !== 'stable');
    if (baseline === null) {
      console.warn('[component-preview --baseline --force --yes] 基线损坏，将重建全量基线');
    }
    console.log(
      `[component-preview --baseline --force --yes] 全量写回，清空待确认: ${pending.map(([id]) => id).join(', ') || '(无)'}`,
    );
  } else {
    console.log('[component-preview --baseline] 首次建基线，全量写入');
  }

  // --force 只更新 catalog 内 id 的 hash、保留 baseline 其余条目（不隐式删 removed）
  const entries = computeEntries(baseline, catalog);
  writeBaseline({ schemaVersion: baseline?.schemaVersion, entries });
  console.log(`[component-preview --baseline] 已写回 ${catalog.length} 个组件基线`);
}

function runBuild() {
  try {
    const usageSources = collectUsageSources();
    const apiModules = walk(API_MODULES_DIR).filter(file => file.endsWith('.ts'));
    const signature = signatureOf([...usageSources.map(source => source.file), ...apiModules]);
    const cached = readCache();
    if (cached === signature && fs.existsSync(OUTPUT) && fs.existsSync(API_MOCK_OUTPUT)) {
      console.log('[component-preview] 无变更，跳过生成');
      return;
    }
    const catalog = buildCatalog(usageSources);

    // 基线读写隔离于主 try：基线异常只降级为 stable，不触发下方「写入空清单」
    let result;
    try {
      result = computeStatus(catalog, readBaselineWithWarn(), sampleExtensionWhitelist());
    } catch (error) {
      console.warn(`[component-preview] 基线处理失败，跳过 status 标注: ${errorMessage(error)}`);
      result = {
        statuses: new Map(catalog.map(entry => [entry.id, 'stable'])),
        removedIds: [],
        infoIds: [],
        incomplete: false,
      };
    }
    for (const entry of catalog) entry.status = result.statuses.get(entry.id) ?? 'stable';

    writeCatalog(catalog);
    const mockCount = writeApiMock(collectApiMocks(API_MODULES_DIR), API_MOCK_OUTPUT);
    writeCache(signature);
    warnPending(result);

    console.log(`[component-preview] 已生成 ${catalog.length} 个组件条目 -> ${path.relative(ROOT, OUTPUT)}`);
    console.log(`[component-preview] 已生成 ${mockCount} 条接口样例 -> ${path.relative(ROOT, API_MOCK_OUTPUT)}`);
  } catch (error) {
    console.error(`[component-preview] 生成失败，写入空清单: ${errorMessage(error)}`);
    process.exitCode = 1;
    try {
      writeCatalog([]);
    } catch {
      // 连空清单都写不出时，保持上一次产物不动，避免破坏构建
    }
    try {
      // 样例表同样不入库，缺失会让 preview 里的 JSON import 直接编译失败，必须留一份空表兜底
      writeApiMock([], API_MOCK_OUTPUT);
    } catch {
      // 写入空表也失败时，只能依赖上一次产物
    }
  }
}

/**
 * --check：只在内存 buildCatalog（不写 catalog / api-mock / 缓存 / 基线），
 * 打印 diff/status + removedIds + infoIds；incomplete 时只警告、不报错。
 */
function runCheck() {
  const catalog = buildCatalogInMemory();
  const baseline = readBaselineWithWarn();
  const result = computeStatus(catalog, baseline, sampleExtensionWhitelist());
  const guard = applyCompletenessGuard(result, 'check');

  console.log(`[component-preview --check] 组件 ${catalog.length} 个`);
  if (baseline === null) {
    // 基线读取异常时没有真正做对比，不能报「无待确认组件」，否则会被读成「检查通过」
    console.log('基线读取异常，未做对比');
    process.exitCode = 1;
    return;
  }
  const pending = [...result.statuses.entries()].filter(([, status]) => status !== 'stable');
  if (pending.length) {
    console.log('待确认（new / changed）:');
    for (const [id, status] of pending) console.log(`  [${status}] ${id}`);
  } else {
    console.log('无待确认组件');
  }
  if (result.infoIds.length) {
    console.log('纯推导结构变化（不触发样例确认，仅 info）:');
    for (const id of result.infoIds) console.log(`  ${id}`);
  }
  if (guard.removedIds.length) {
    console.log('基线里已不存在（removedIds，用 --baseline --prune 清理）:');
    for (const id of guard.removedIds) console.log(`  ${id}`);
  }
  if (guard.warnIncomplete) {
    console.warn('[component-preview --check] 目录可能不完整（条目数相对基线骤降 >10%），请先确认扫描路径 / glob 配置');
  }
}

/** 日常生成：把待确认（new/changed）与 removedIds 打进构建日志；incomplete 时抑制 removedIds 告警 */
function warnPending(result) {
  const pending = [...result.statuses.entries()]
    .filter(([, status]) => status === 'new' || status === 'changed')
    .map(([id, status]) => `${id}(${status})`);
  if (pending.length) {
    console.warn(`[component-preview] 待确认样例（用 --baseline --only <id> 确认）: ${pending.join(', ')}`);
  }
  const guard = applyCompletenessGuard(result, 'build');
  if (guard.removedIds.length) {
    console.warn(
      `[component-preview] 基线里已不存在的组件（用 --baseline --prune 清理）: ${guard.removedIds.join(', ')}`,
    );
  }
}

// 仅直接执行时跑 main；被测试 import 时（process.argv[1] 不是本文件）不执行，避免触发全量扫描。
// process.argv[1] 在 node -e / REPL / 动态 import 下是 undefined，直接喂 pathToFileURL 会抛
// ERR_INVALID_ARG_TYPE，先判真再比较，守住「模块可 import」的契约。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
