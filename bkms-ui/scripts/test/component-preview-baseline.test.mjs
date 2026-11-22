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
 * 基线 diff 机制的单测：覆盖签名确定性、Symbol 哨兵、三态判定、removedIds 集合差、
 * 读取异常 fail-safe、完整性守卫的 incomplete 骤降检测（阈值边界）与三路径降级。
 * 这些全部是 computeSignature / computeStatus / applyCompletenessGuard 的纯函数行为，
 * 不依赖真实组件扫描，输入直接用最小 entry 构造。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { CONFIG } from '../component-preview/component-preview.config.mjs';
import {
  applyCompletenessGuard,
  computeEntries,
  computeSignature,
  computeStatus,
  planBaselineWrite,
  readBaseline,
  sampleExtensionWhitelist,
  writeBaseline,
} from '../component-preview/internal/baseline.mjs';

const { placeholders } = CONFIG;

/** 用同一份 entry 生成 baseline entries（id -> sampleSignature） */
function baselineFrom(entries) {
  return {
    schemaVersion: 1,
    entries: Object.fromEntries(entries.map(entry => [entry.id, computeSignature(entry).sampleSignature])),
  };
}

/** 构造一个仅含签名所需字段的最小 catalog entry */
function makeEntry(id, overrides = {}) {
  return {
    id,
    analyzedProps: { title: placeholders.string, count: placeholders.number },
    slots: ['default'],
    fallbackSlots: [],
    guardedSlots: [],
    visibilityProp: null,
    needsForm: false,
    ...overrides,
  };
}

describe('computeSignature', () => {
  it('同一 entry 重复计算得到相同签名（确定性）', () => {
    const entry = makeEntry('a');
    const first = computeSignature(entry);
    const second = computeSignature(entry);
    expect(first.sampleSignature).toBe(second.sampleSignature);
    expect(first.shellSignature).toBe(second.shellSignature);
  });

  it('props 推导变化会改变 sampleSignature', () => {
    const before = makeEntry('a', { analyzedProps: { title: '占位文本' } });
    const after = makeEntry('a', { analyzedProps: { title: '占位文本', extra: '新增字段' } });
    expect(computeSignature(before).sampleSignature).not.toBe(computeSignature(after).sampleSignature);
  });

  it('slot 提取结果变化会改变 sampleSignature', () => {
    const before = makeEntry('a', { slots: ['default'] });
    const after = makeEntry('a', { slots: ['default', 'header'] });
    expect(computeSignature(before).sampleSignature).not.toBe(computeSignature(after).sampleSignature);
  });

  it('Symbol 哨兵：fn 型 prop 不会被 JSON.stringify 丢弃，改变它会改变签名', () => {
    // placeholders.fn 是 Symbol，JSON.stringify 默认会丢弃；replacer 把它映射为 "__fn__" 哨兵，
    // 否则「有 fn prop」和「没有该 prop」会得到相同 hash，fn 型 prop 变更就漏检了。
    const withoutFn = makeEntry('a', { analyzedProps: { title: '占位文本' } });
    const withFn = makeEntry('a', {
      analyzedProps: { title: '占位文本', onConfirm: placeholders.fn },
    });
    expect(computeSignature(withoutFn).sampleSignature).not.toBe(computeSignature(withFn).sampleSignature);
  });

  it('shellSignature 与 sampleSignature 口径分离：layout 壳字段变化不影响 sampleSignature', () => {
    const base = makeEntry('a');
    const shellChanged = makeEntry('a', { visibilityProp: 'visible', needsForm: true });
    expect(computeSignature(base).sampleSignature).toBe(computeSignature(shellChanged).sampleSignature);
    expect(computeSignature(base).shellSignature).not.toBe(computeSignature(shellChanged).shellSignature);
  });
});

describe('computeStatus', () => {
  it('首次（基线不存在）全量标 new，含纯推导组件', () => {
    const catalog = [makeEntry('a'), makeEntry('b')];
    const { statuses, removedIds, infoIds, incomplete } = computeStatus(catalog, undefined, new Set());
    expect(statuses.get('a')).toBe('new');
    expect(statuses.get('b')).toBe('new');
    expect(removedIds).toEqual([]);
    expect(infoIds).toEqual([]);
    expect(incomplete).toBe(false);
  });

  it('读取异常 fail-safe：全部按 stable，不误标全量 new，也不产出 removedIds', () => {
    const catalog = [makeEntry('a'), makeEntry('b')];
    const { statuses, removedIds, infoIds, incomplete } = computeStatus(catalog, null, new Set());
    expect(statuses.get('a')).toBe('stable');
    expect(statuses.get('b')).toBe('stable');
    expect(removedIds).toEqual([]);
    expect(infoIds).toEqual([]);
    expect(incomplete).toBe(false);
  });

  it('三态判定：new / changed（白名单内）/ stable，纯推导结构变化归 stable 并进 infoIds', () => {
    const whitelist = new Set(['changed-id']);
    // changed-id 命中样例类扩展点、签名变化 -> changed；pure-id 纯推导、签名变化 -> stable + infoIds
    const oldChanged = makeEntry('changed-id', { analyzedProps: { title: '旧' } });
    const oldPure = makeEntry('pure-id', { analyzedProps: { title: '旧' } });
    const baseline = baselineFrom([oldChanged, oldPure, makeEntry('removed-id')]);

    const catalog = [
      makeEntry('changed-id', { analyzedProps: { title: '新' } }),
      makeEntry('pure-id', { analyzedProps: { title: '新' } }),
      makeEntry('fresh-id'),
    ];
    const { statuses, removedIds, infoIds } = computeStatus(catalog, baseline, whitelist);

    expect(statuses.get('changed-id')).toBe('changed');
    expect(statuses.get('pure-id')).toBe('stable');
    expect(statuses.get('fresh-id')).toBe('new');
    expect(removedIds).toEqual(['removed-id']);
    expect(infoIds).toEqual(['pure-id']);
  });

  it('removedIds 是 baseline.keys 与 catalog.ids 的集合差', () => {
    const baseline = baselineFrom([makeEntry('a'), makeEntry('b'), makeEntry('c')]);
    const catalog = [makeEntry('a')];
    const { removedIds } = computeStatus(catalog, baseline, new Set());
    expect([...removedIds].sort()).toEqual(['b', 'c']);
  });

  it('incomplete 骤降检测：恰好 10% 不触发，临界上（>10%）触发', () => {
    // 基线 100 条、目录 90 条 -> 下降 10%，恰好阈值，不置 incomplete
    const baseline100 = baselineFrom(Array.from({ length: 100 }, (_, i) => makeEntry(`id-${i}`)));
    const catalog90 = Array.from({ length: 90 }, (_, i) => makeEntry(`id-${i}`));
    const atThreshold = computeStatus(catalog90, baseline100, new Set());
    expect(atThreshold.incomplete).toBe(false);

    // 基线 100 条、目录 89 条 -> 下降 11%，触发 incomplete
    const catalog89 = Array.from({ length: 89 }, (_, i) => makeEntry(`id-${i}`));
    const aboveThreshold = computeStatus(catalog89, baseline100, new Set());
    expect(aboveThreshold.incomplete).toBe(true);
  });

  it('incomplete 不被新增组件抵消：删 20 + 增 20 仍触发（removedIds 占比 >10%）', () => {
    // 基线 100 条 id-0..99；catalog 保留 id-20..99（删 id-0..19）+ 新增 new-0..19。
    // 净变化为 0，但 removedIds 有 20 个，守卫必须仍然触发，否则 --prune 会误删 20 条基线
    const baseline = baselineFrom(Array.from({ length: 100 }, (_, i) => makeEntry(`id-${i}`)));
    const catalog = [
      ...Array.from({ length: 80 }, (_, i) => makeEntry(`id-${i + 20}`)),
      ...Array.from({ length: 20 }, (_, i) => makeEntry(`new-${i}`)),
    ];
    const { removedIds, incomplete } = computeStatus(catalog, baseline, new Set());
    expect(removedIds).toHaveLength(20);
    expect(incomplete).toBe(true);
  });

  it('incomplete 只在条目数下降时判定，新增组件不触发', () => {
    const baseline = baselineFrom([makeEntry('a')]);
    const catalog = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
    const { incomplete, removedIds } = computeStatus(catalog, baseline, new Set());
    expect(incomplete).toBe(false);
    expect(removedIds).toEqual([]);
  });
});

describe('applyCompletenessGuard 三路径降级', () => {
  const incompleteResult = { statuses: new Map(), removedIds: ['orphan'], infoIds: [], incomplete: true };
  const completeResult = { statuses: new Map(), removedIds: ['orphan'], infoIds: [], incomplete: false };

  it('--prune：incomplete 时拒绝执行', () => {
    expect(applyCompletenessGuard(incompleteResult, 'prune')).toEqual({ allowed: false });
    expect(applyCompletenessGuard(completeResult, 'prune')).toEqual({ allowed: true });
  });

  it('--check：incomplete 时只警告，仍列出 removedIds', () => {
    expect(applyCompletenessGuard(incompleteResult, 'check')).toEqual({
      removedIds: ['orphan'],
      warnIncomplete: true,
    });
    expect(applyCompletenessGuard(completeResult, 'check')).toEqual({
      removedIds: ['orphan'],
      warnIncomplete: false,
    });
  });

  it('日常生成：incomplete 时抑制 removedIds 告警', () => {
    expect(applyCompletenessGuard(incompleteResult, 'build')).toEqual({ removedIds: [] });
    expect(applyCompletenessGuard(completeResult, 'build')).toEqual({ removedIds: ['orphan'] });
  });
});

describe('baseline 读写', () => {
  it('写出的基线格式为 { schemaVersion: 1, entries: { id: hash } }，且可读回', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-baseline-'));
    const file = path.join(dir, 'baseline.json');
    try {
      const baseline = baselineFrom([makeEntry('a')]);
      writeBaseline(baseline, file);
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      expect(raw.schemaVersion).toBe(1);
      expect(raw.entries.a).toBe(baseline.entries.a);
      expect(readBaseline(file)).toEqual(baseline);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('基线文件不存在返回 undefined（首次），损坏返回 null（读取异常）', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-baseline-'));
    try {
      expect(readBaseline(path.join(dir, 'missing.json'))).toBeUndefined();
      const corrupt = path.join(dir, 'corrupt.json');
      fs.writeFileSync(corrupt, '{ not valid json');
      expect(readBaseline(corrupt)).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('语法合法但语义无效的内容返回 null（不绕过 fail-safe 误判全量 new）', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-baseline-'));
    try {
      const invalidContents = [
        '{}',
        '[]',
        '{"entries":null}',
        '{"entries":{}}',
        '{"schemaVersion":1}',
        '{"schemaVersion":1,"entries":[]}',
        '{"schemaVersion":1,"entries":{"a":"not-a-hash"}}',
      ];
      invalidContents.forEach((content, index) => {
        const file = path.join(dir, `invalid-${index}.json`);
        fs.writeFileSync(file, content);
        expect(readBaseline(file), content).toBeNull();
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('schemaVersion 不参与有效性判定（版本号不同也按合法基线读回）', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-baseline-'));
    try {
      const file = path.join(dir, 'version-mismatch.json');
      const hash = 'a'.repeat(64);
      fs.writeFileSync(file, JSON.stringify({ schemaVersion: 2, entries: { comp: hash } }));
      expect(readBaseline(file)).toEqual({ schemaVersion: 2, entries: { comp: hash } });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('缺 schemaVersion 字段判 null（即使 entries 合法）', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-baseline-'));
    try {
      const file = path.join(dir, 'no-schema-version.json');
      fs.writeFileSync(file, JSON.stringify({ entries: { comp: 'a'.repeat(64) } }));
      expect(readBaseline(file)).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('computeEntries（--only / --force 写回决策）', () => {
  it('--force 全量写回保留 removed 条目（不隐式删 removed）', () => {
    // 基线有 a、b、removed 三条；catalog 只有 a、b，removed 不在 catalog
    const baseline = baselineFrom([makeEntry('a'), makeEntry('b'), makeEntry('removed')]);
    const catalog = [makeEntry('a'), makeEntry('b')];
    const entries = computeEntries(baseline, catalog);
    expect(Object.keys(entries).sort()).toEqual(['a', 'b', 'removed']);
  });

  it('--only 只更新目标 id，保留其它条目', () => {
    const baseline = baselineFrom([makeEntry('a'), makeEntry('b')]);
    const catalog = [makeEntry('a', { analyzedProps: { title: '新' } }), makeEntry('b')];
    const entries = computeEntries(baseline, catalog, new Set(['a']));
    expect(Object.keys(entries).sort()).toEqual(['a', 'b']);
    // a 的签名更新为「新」推导，b 保持原签名
    expect(entries.a).toBe(computeSignature(makeEntry('a', { analyzedProps: { title: '新' } })).sampleSignature);
    expect(entries.b).toBe(baseline.entries.b);
  });
});

describe('planBaselineWrite（--only 增量写回决策）', () => {
  it('正常：只更新目标 id、保留其它条目、返回 schemaVersion', () => {
    const baseline = baselineFrom([makeEntry('a'), makeEntry('b')]);
    const catalog = [makeEntry('a', { analyzedProps: { title: '新' } }), makeEntry('b')];
    const plan = planBaselineWrite('a', baseline, catalog);
    expect(plan.error).toBeUndefined();
    expect(Object.keys(plan.entries).sort()).toEqual(['a', 'b']);
    expect(plan.entries.a).toBe(computeSignature(makeEntry('a', { analyzedProps: { title: '新' } })).sampleSignature);
    expect(plan.entries.b).toBe(baseline.entries.b);
    expect(plan.schemaVersion).toBe(1);
  });

  it('基线损坏（null）拒绝写回', () => {
    const plan = planBaselineWrite('a', null, [makeEntry('a')]);
    expect(plan.error).toContain('基线读取异常');
    expect(plan.entries).toBeUndefined();
  });

  it('基线不存在（undefined）拒绝写回', () => {
    const plan = planBaselineWrite('a', undefined, [makeEntry('a')]);
    expect(plan.error).toContain('基线不存在');
    expect(plan.entries).toBeUndefined();
  });

  it('组件不在 catalog 拒绝写回', () => {
    const baseline = baselineFrom([makeEntry('a')]);
    const plan = planBaselineWrite('missing', baseline, [makeEntry('a')]);
    expect(plan.error).toContain('组件不在 catalog');
    expect(plan.entries).toBeUndefined();
  });
});

describe('sampleExtensionWhitelist', () => {
  it('收集命中样例类扩展点的组件 id（含 componentFamily 的 entry 与 nodes）', () => {
    const whitelist = sampleExtensionWhitelist();
    // tab 有 propOverrides，skeleton 有 componentFamily（entry + 若干 node id）
    expect(whitelist.has('components/tab')).toBe(true);
    expect(whitelist.has('components/skeleton/skeleton')).toBe(true);
    expect(whitelist.has('components/skeleton/skeleton-shape')).toBe(true);
  });

  it('纯布局壳扩展点（fillHeight 等）不进入白名单', () => {
    // 手工构造一个只有 fillHeight 的插件，验证它不会进白名单
    const whitelist = sampleExtensionWhitelist([{ name: 'only-layout', fillHeight: ['components/only-layout'] }]);
    expect(whitelist.has('components/only-layout')).toBe(false);
  });
});
