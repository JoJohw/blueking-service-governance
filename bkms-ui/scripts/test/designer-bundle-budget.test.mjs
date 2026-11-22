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
import { describe, expect, it } from 'vitest';

import {
  checkDesignerBudget,
  collectDesignerStaticFiles,
  DEFAULT_DESIGNER_BUDGET_KB,
  hasDesignerEntries,
  resolveBudgetBytes,
} from '../designer-bundle-budget.mjs';

/** 模拟 generateBundle：设计器入口 + 共享 chunk + SPA 主入口 + 按需加载的组件 chunk */
const bundle = {
  'designer-shell.js': {
    type: 'chunk',
    isDynamicEntry: true,
    facadeModuleId: '/app/src/pages/designer/designer-shell.vue',
    imports: ['shared.js', 'main-entry.js'],
    code: 'a'.repeat(1000),
  },
  'palette.js': {
    type: 'chunk',
    isDynamicEntry: true,
    facadeModuleId: '/app/src/pages/designer/palette.vue',
    imports: ['shared.js'],
    code: 'b'.repeat(1000),
  },
  'preview-internals.js': {
    type: 'chunk',
    isDynamicEntry: true,
    facadeModuleId: '/app/src/pages/designer/preview/safe-component.ts',
    imports: ['shared.js'],
    code: 'f'.repeat(500),
  },
  'palette-app.js': {
    type: 'chunk',
    isDynamicEntry: true,
    facadeModuleId: '/app/dev/palette/src/App.vue',
    imports: ['shared.js'],
    code: 'g'.repeat(2000),
  },
  'shared.js': { type: 'chunk', isDynamicEntry: false, imports: [], code: 'c'.repeat(1000) },
  'main-entry.js': { type: 'chunk', isEntry: true, imports: [], code: 'e'.repeat(1000000) },
  'lazy-component.js': {
    type: 'chunk',
    isDynamicEntry: true,
    facadeModuleId: '/app/src/components/foo.vue',
    imports: [],
    code: 'd'.repeat(100000),
  },
};

const EXPECTED = ['designer-shell.js', 'palette-app.js', 'palette.js', 'preview-internals.js', 'shared.js'];

describe('designer chunk 体积预算', () => {
  it('统计 designer 目录下的入口及其静态依赖，排除 SPA 主入口与按需加载的组件 chunk', () => {
    expect(collectDesignerStaticFiles(bundle).sort()).toEqual(EXPECTED);
  });

  it('超预算时返回 over 与实际 gzip 字节数', () => {
    const result = checkDesignerBudget(bundle, 1);
    expect(result.over).toBe(true);
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.files).toHaveLength(EXPECTED.length);
  });

  it('预算充足时不报警', () => {
    expect(checkDesignerBudget(bundle, 1024 * 1024).over).toBe(false);
  });
});

describe('预算配置解析', () => {
  it('合法数字按 KiB 换算成字节', () => {
    expect(resolveBudgetBytes('2048')).toEqual({ bytes: 2048 * 1024, invalid: false });
  });

  it('未设置或空串走默认预算，不算非法', () => {
    expect(resolveBudgetBytes(undefined)).toEqual({ bytes: DEFAULT_DESIGNER_BUDGET_KB * 1024, invalid: false });
    expect(resolveBudgetBytes('')).toEqual({ bytes: DEFAULT_DESIGNER_BUDGET_KB * 1024, invalid: false });
  });

  it('非法值（非数字 / <=0）回退默认并标记 invalid，避免静默关闭检查', () => {
    expect(resolveBudgetBytes('abc')).toEqual({ bytes: DEFAULT_DESIGNER_BUDGET_KB * 1024, invalid: true });
    expect(resolveBudgetBytes('0')).toEqual({ bytes: DEFAULT_DESIGNER_BUDGET_KB * 1024, invalid: true });
    expect(resolveBudgetBytes('-10')).toEqual({ bytes: DEFAULT_DESIGNER_BUDGET_KB * 1024, invalid: true });
  });
});

describe('designer 入口识别', () => {
  it('存在 designer 入口时为 true（与是否被排除无关）', () => {
    expect(hasDesignerEntries(bundle)).toBe(true);
  });

  it('生产构建剔除 designer 链路时为 false', () => {
    expect(hasDesignerEntries({ 'main-entry.js': bundle['main-entry.js'], 'shared.js': bundle['shared.js'] })).toBe(
      false,
    );
  });
});
