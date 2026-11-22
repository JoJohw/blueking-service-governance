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

import { parse } from '@vue/compiler-sfc';
/**
 * 预览插件的声明契约：插件全靠「按组件 id 打表」扩展预览行为，
 * id 或 slot 名写错既不会报错也不会提示，只会静默不生效（tab 插件曾把 id 写成裸组件名 `tab`，
 * 覆盖一直没生效，预览里只剩通用推导的 1 个占位 tab）。
 * 这里拿真实源码做校验，把静默失效变成会红的用例。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { CONFIG } from '../component-preview/component-preview.config.mjs';
import { buildCatalog, collectUsageSources } from '../component-preview/internal/catalog.mjs';
import { extractSlots } from '../component-preview/internal/slots.mjs';
import tabPlugin from '../component-preview/plugins/tab.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const componentFile = id => path.join(ROOT, 'src', `${id}.vue`);

/** slotCombos 有数组与 { base, extras } 两种写法，统一展开成若干组 slot 名 */
function comboSlotNames(value) {
  if (Array.isArray(value)) return value.flatMap(combo => combo.slots);
  const base = value?.base ?? [];
  return [base, ...(value?.extras ?? []).map(extra => [...base, extra])].flat();
}

/** 插件里「组件 id -> 配置」的表都在这里列出，新增扩展点时同步补一行 */
function declaredIds() {
  const rows = [];
  for (const plugin of CONFIG.plugins) {
    const push = (kind, ids) => ids.forEach(id => rows.push({ id, kind, plugin: plugin.name }));
    push('slotOverrides', Object.keys(plugin.slotOverrides ?? {}));
    push('previewVariants', Object.keys(plugin.previewVariants ?? {}));
    push('slotCombos', Object.keys(plugin.slotCombos ?? {}));
    push('propOverrides', Object.keys(plugin.propOverrides ?? {}));
    push('containerWidth', Object.keys(plugin.containerWidth ?? {}));
    push('heightProp', Object.keys(plugin.heightProp ?? {}));
    push('fillHeight', plugin.fillHeight ?? []);
    push('fillWidth', plugin.fillWidth ?? []);
    if (plugin.componentFamily) push('componentFamily', [plugin.componentFamily.entry]);
  }
  return rows;
}

/** 插件对各组件的 slot 声明，按来源分类，便于失败时定位 */
function declaredSlots() {
  const rows = [];
  for (const plugin of CONFIG.plugins) {
    for (const [id, overrides] of Object.entries(plugin.slotOverrides ?? {})) {
      rows.push({ id, kind: 'slotOverrides', plugin: plugin.name, slots: Object.keys(overrides) });
    }
    for (const [id, variants] of Object.entries(plugin.previewVariants ?? {})) {
      for (const variant of variants) {
        rows.push({
          id,
          kind: `previewVariants/${variant.label}`,
          plugin: plugin.name,
          slots: Object.keys(variant.slotOverrides ?? {}),
        });
      }
    }
    for (const [id, value] of Object.entries(plugin.slotCombos ?? {})) {
      rows.push({ id, kind: 'slotCombos', plugin: plugin.name, slots: comboSlotNames(value) });
    }
  }
  return rows;
}

describe('预览插件的组件 id 声明', () => {
  it('每个声明都对应到 src 下的组件文件', () => {
    const missing = declaredIds()
      .filter(row => !fs.existsSync(componentFile(row.id)))
      .map(row => `${row.plugin}.${row.kind}: ${row.id}`);
    expect(missing).toEqual([]);
  });

  it('每个 slot 声明都命中组件真实存在的 slot', () => {
    const invalid = declaredSlots().flatMap(row => {
      if (!fs.existsSync(componentFile(row.id))) return [];
      const { descriptor } = parse(fs.readFileSync(componentFile(row.id), 'utf8'));
      const real = extractSlots(descriptor);
      return row.slots.filter(slot => !real.includes(slot)).map(slot => `${row.id} <- ${row.kind}: ${slot}`);
    });
    expect(invalid).toEqual([]);
  });

  it('同一组件不同时声明组件族与预览变体', () => {
    // 预览页标题栏的切换按钮二选一（family 优先），两者并存时 variants 会被静默忽略
    const familyIds = CONFIG.plugins
      .filter(plugin => plugin.componentFamily)
      .map(plugin => plugin.componentFamily.entry);
    const variantIds = CONFIG.plugins.flatMap(plugin => Object.keys(plugin.previewVariants ?? {}));
    expect(familyIds.filter(id => variantIds.includes(id))).toEqual([]);
  });

  it('结构视图开关指向的组件都在清单里', () => {
    const ids = [...CONFIG.hideSlotStructure];
    expect(ids.filter(id => !fs.existsSync(componentFile(id)))).toEqual([]);
  });
});

describe('清单生成的扩展点透传', () => {
  let catalog;

  beforeAll(() => {
    catalog = buildCatalog(collectUsageSources());
  });

  it('previewVariants 落到条目的 variants，顺序与插件声明一致', () => {
    const declared = new Map(CONFIG.plugins.flatMap(plugin => Object.entries(plugin.previewVariants ?? {})));
    for (const [id, variants] of declared) {
      const entry = catalog.find(item => item.id === id);
      expect(entry, `清单里缺少 ${id}`).toBeTruthy();
      expect(
        entry.variants?.map(variant => variant.label),
        id,
      ).toEqual(variants.map(variant => variant.label));
    }
  });

  it('hideSlotStructure 落到条目上', () => {
    for (const id of CONFIG.hideSlotStructure) {
      const entry = catalog.find(item => item.id === id);
      expect(entry, `清单里缺少 ${id}`).toBeTruthy();
      expect(entry.hideSlotStructure, id).toBe(true);
    }
  });

  it('propOverrides 落到条目的 props 上', () => {
    const declared = new Map(CONFIG.plugins.flatMap(plugin => Object.entries(plugin.propOverrides ?? {})));
    for (const [id, overrides] of declared) {
      const entry = catalog.find(item => item.id === id);
      expect(entry, `清单里缺少 ${id}`).toBeTruthy();
      expect(entry.props, id).toMatchObject(overrides);
    }
  });

  it('对象形式 slotCombos 自动展开后标签齐全且互不重复', () => {
    // 结构视图多卡并排靠 label 区分，标签为空会让几块几乎一样的占位卡无法分辨
    const declared = CONFIG.plugins.flatMap(plugin => Object.entries(plugin.slotCombos ?? {}));
    for (const [id, value] of declared) {
      if (Array.isArray(value)) continue; // 数组形式由插件自己写 label
      const entry = catalog.find(item => item.id === id);
      expect(entry, `清单里缺少 ${id}`).toBeTruthy();
      const labels = (entry.slotCombos ?? []).map(combo => combo.label);
      expect(labels.length, id).toBe(1 + (value.extras?.length ?? 0));
      expect(
        labels.every(label => label.length > 0),
        id,
      ).toBe(true);
      expect(new Set(labels).size, id).toBe(labels.length);
    }
  });
});

describe('手写样例的跨字段引用', () => {
  it('tab 的 active 指向 tabs 里真实存在的 name（样例侧静默失效守卫）', () => {
    // 基线签名只盯「组件推导变了」，抓不到「手写样例本身被改坏」。
    // 这类跨字段引用是可静态验证的：active 指向不存在的 name 会让预览里选中的 tab 落空。
    const { active, tabs } = tabPlugin.propOverrides['components/tab'];
    expect(tabs.map(tab => tab.name)).toContain(active);
  });
});
