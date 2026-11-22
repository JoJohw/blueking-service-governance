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
 * 组件基线：对每个组件条目取「覆盖前推导产物」的签名，和上次基线 diff 出 new/changed/stable。
 * 只对比 sampleSignature（props + slots）；shellSignature（visibilityProp + needsForm）留口子暂不对比。
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { CONFIG } from '../component-preview.config.mjs';
import { BASELINE } from './paths.mjs';

const { placeholders } = CONFIG;

export const BASELINE_SCHEMA_VERSION = 1;
/** 条目数相对基线骤降超过该比例即判定目录不完整（疑似 glob 改错 / 目录重命名 / 解析失败） */
export const INCOMPLETE_DROP_RATIO = 0.1;

/**
 * 完整性守卫的三路降级决策（--check / --prune / 日常生成只在这一处算，避免各写一遍）。
 * @param {{ removedIds: string[], incomplete: boolean }} result computeStatus 的返回值
 * @param {'check' | 'prune' | 'build'} mode 调用方
 */
export function applyCompletenessGuard(result, mode) {
  switch (mode) {
    case 'prune':
      // --prune 拒绝执行：incomplete 时不允许删除 removed 条目
      return { allowed: !result.incomplete };
    case 'check':
      // --check 只警告：仍列出 removedIds，但附带「目录可能不完整」提示
      return { removedIds: result.removedIds, warnIncomplete: result.incomplete };
    case 'build':
      // 日常生成抑制 removedIds 告警：incomplete 时不报 removedIds，要求人工确认
      return { removedIds: result.incomplete ? [] : result.removedIds };
    default:
      throw new Error(`未知完整性守卫模式: ${mode}`);
  }
}

/**
 * 对 catalog 条目推导产物取签名（D5/D6 口径）：
 * - sampleSignature：覆盖前 analyzedProps + slot 提取结果（slots/fallbackSlots/guardedSlots），
 *   基线只存这个、只对这个标 changed；绝不取 { ...analyzedProps, ...propOverrides } 合并后的 props。
 * - shellSignature：visibilityProp + needsForm，算出来暂不对比（口径待统一，见计划 D6）。
 */
export function computeSignature(entry) {
  const sample = {
    analyzedProps: entry.analyzedProps,
    slots: entry.slots,
    fallbackSlots: entry.fallbackSlots,
    guardedSlots: entry.guardedSlots,
  };
  const shell = {
    visibilityProp: entry.visibilityProp,
    needsForm: entry.needsForm,
  };
  return {
    sampleSignature: hash(normalize(sample)),
    shellSignature: hash(normalize(shell)),
  };
}

/**
 * 判定每个组件的三态 + removedIds + infoIds + 完整性守卫标志（纯函数）。
 * @param {object[]} catalog buildCatalog 的返回值（含 analyzedProps 覆盖前推导）
 * @param {object | null | undefined} baseline readBaseline 的返回值：
 *   undefined=首次（基线不存在）；null=读取异常；object=正常基线 { schemaVersion, entries }
 * @param {Set<string>} whitelist 命中样例类扩展点的组件 id（sampleExtensionWhitelist）
 * @returns {{ statuses: Map<string, 'new'|'changed'|'stable'>, removedIds: string[], infoIds: string[], incomplete: boolean }}
 */
export function computeStatus(catalog, baseline, whitelist = new Set()) {
  const statuses = new Map();
  const removedIds = [];
  const infoIds = [];

  // 首次建基线：全量 new（纯推导组件也算 new，不受收敛影响）
  if (baseline === undefined) {
    for (const entry of catalog) statuses.set(entry.id, 'new');
    return { statuses, removedIds, infoIds, incomplete: false };
  }

  // 读取异常 fail-safe：跳过对比、全部按 stable，绝不误判全量 new
  if (baseline === null) {
    for (const entry of catalog) statuses.set(entry.id, 'stable');
    return { statuses, removedIds, infoIds, incomplete: false };
  }

  const baselineEntries = baseline.entries ?? {};
  const baselineIds = Object.keys(baselineEntries);
  const catalogIds = new Set(catalog.map(entry => entry.id));

  // removedIds = baseline.keys - catalog.ids（removed 组件已不在 catalog，只能独立清单，不能挂 status）
  for (const id of baselineIds) {
    if (!catalogIds.has(id)) removedIds.push(id);
  }

  // 完整性守卫：removedIds 占比 > 10% 置 incomplete，让各路径统一降级，避免误删基线条目。
  // 用 removedIds 而非「净变化」（catalog.length - baselineIds.length），否则「删 20 + 增 20」会把
  // 净变化抵消成 0、守卫失效，--prune 仍会误删 20 个本应保留的基线条目。
  const incomplete = baselineIds.length > 0 && removedIds.length / baselineIds.length > INCOMPLETE_DROP_RATIO;

  for (const entry of catalog) {
    const signature = computeSignature(entry).sampleSignature;
    const baselineSignature = baselineEntries[entry.id];
    if (baselineSignature === undefined) {
      statuses.set(entry.id, 'new');
    } else if (baselineSignature !== signature) {
      // 收敛：changed 只给命中样例类扩展点的组件；纯推导组件结构变化归 stable、单独列 info
      if (whitelist.has(entry.id)) {
        statuses.set(entry.id, 'changed');
      } else {
        statuses.set(entry.id, 'stable');
        infoIds.push(entry.id);
      }
    } else {
      statuses.set(entry.id, 'stable');
    }
  }

  return { statuses, removedIds, infoIds, incomplete };
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * 指纹归一化：转纯 JSON（无缩进、无 undefined），自定义 replacer 把 placeholders.fn（Symbol）
 * 映射为 "__fn__" 哨兵，避免 Symbol 被 JSON.stringify 丢弃后 fn 型 prop 变更漏检。
 */
function normalize(value) {
  return JSON.stringify(value, (_key, item) => (item === placeholders.fn ? '__fn__' : item));
}

/** 命中样例类扩展点（会因组件推导变化而让手写样例失效）的扩展点 */
const SAMPLE_EXTENSION_POINTS = ['propOverrides', 'slotOverrides', 'slotCombos', 'previewVariants'];

/**
 * 计算写回后的基线 entries（纯函数，供 --only / --force 共用）：
 * 从 baseline 现有 entries 起步（保留 removed 条目，不隐式删），用 catalog 内组件的当前签名覆盖。
 * @param {object | null} baseline 正常基线对象（entries 已由 readBaseline 校验过）；null/undefined 视作空基线
 * @param {object[]} catalog catalog 条目
 * @param {Set<string> | null} onlyIds 只更新这些 id；null = 更新 catalog 内全部 id
 */
export function computeEntries(baseline, catalog, onlyIds = null) {
  const entries = { ...(baseline?.entries ?? {}) };
  for (const entry of catalog) {
    if (onlyIds && !onlyIds.has(entry.id)) continue;
    entries[entry.id] = computeSignature(entry).sampleSignature;
  }
  return entries;
}

/**
 * --only 增量写回的决策（纯函数）：把「损坏 / 首次 / 组件不在 catalog」三种拒绝路径与正常写回
 * 从 runBaseline 抽出来，让单测能覆盖这条曾经静默抹掉整份基线的 CRITICAL 回归。
 * @param {string} onlyId 目标组件 id
 * @param {object | null | undefined} baseline readBaseline 返回值（undefined=首次；null=读取异常）
 * @param {object[]} catalog catalog 条目
 * @returns {{ error: string } | { entries: Record<string, string>, schemaVersion: number }}
 */
export function planBaselineWrite(onlyId, baseline, catalog) {
  // 基线损坏（读取异常）时拒绝写回：baseline == null 会把 null 和 undefined 混为一谈，
  // 一旦损坏时按 {} 起步，就会写出一份只有 1 个条目的新基线、静默抹掉其余条目
  if (baseline === null) {
    return { error: '基线读取异常（可能损坏），拒绝增量写回，请先人工恢复基线' };
  }
  // 基线不存在（首次）：--only 是「日常确认」，前提是已有全量基线，先跑 --baseline 建基线
  if (baseline === undefined) {
    return { error: '基线不存在，请先运行 --baseline 建全量基线' };
  }
  if (!catalog.some(item => item.id === onlyId)) {
    return { error: `组件不在 catalog 里: ${onlyId}（removed 组件用 --baseline --prune 清理）` };
  }
  return { entries: computeEntries(baseline, catalog, new Set([onlyId])), schemaVersion: baseline.schemaVersion };
}

/**
 * 读基线：不存在返回 undefined（首次）、读取/解析异常返回 null（fail-safe）、正常返回对象。
 * filePath 仅在测试里覆盖，正常走 BASELINE 常量。
 * 解析后还会做内容校验：语法合法但语义无效（缺 schemaVersion / entries 非对象 / hash 非 64 位 hex）
 * 一律按读取异常返回 null，避免 `{}`、`[]`、`{"entries":null}` 这类内容绕过 fail-safe 导致全量 new。
 */
export function readBaseline(filePath = BASELINE) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return error?.code === 'ENOENT' ? undefined : null;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return isValidBaseline(parsed) ? parsed : null;
}

/**
 * 收敛白名单：命中样例类扩展点的组件 id。
 * componentFamily 覆盖 entry（wrapper）+ 各 variant 的 nodes（单元/预设）。
 */
export function sampleExtensionWhitelist(plugins = CONFIG.plugins) {
  const ids = new Set();
  for (const plugin of plugins) {
    for (const point of SAMPLE_EXTENSION_POINTS) {
      for (const id of Object.keys(plugin[point] ?? {})) ids.add(id);
    }
    if (plugin.componentFamily) {
      ids.add(plugin.componentFamily.entry);
      for (const variant of plugin.componentFamily.variants ?? []) {
        for (const node of variant.nodes ?? []) ids.add(node.id);
      }
    }
  }
  return ids;
}

/** 写基线：格式 { schemaVersion: 1, entries: { "<id>": "<hash>" } }，入 git 保持可读缩进 */
export function writeBaseline(baseline, filePath = BASELINE) {
  const data = {
    schemaVersion: baseline.schemaVersion ?? BASELINE_SCHEMA_VERSION,
    entries: baseline.entries ?? {},
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

/**
 * 基线结构校验：schemaVersion 必须是 number、entries 是非数组对象、每个 value 是 sha256（64 位 hex）。
 * schemaVersion 只校验存在性、不校验具体值（D3：不引入版本迁移，用一次性显式 re-baseline 替代）——
 * 若硬校验版本值，未来 bump BASELINE_SCHEMA_VERSION 会让全仓库旧基线瞬间被判损坏、
 * 静默失去所有告警且无任何提示；但仍要求字段存在，避免 `{"entries":{}}` 这类缺字段内容被当成合法空基线。
 */
function isValidBaseline(parsed) {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false;
  if (typeof parsed.schemaVersion !== 'number') return false;
  const entries = parsed.entries;
  if (typeof entries !== 'object' || entries === null || Array.isArray(entries)) return false;
  return Object.values(entries).every(value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value));
}
