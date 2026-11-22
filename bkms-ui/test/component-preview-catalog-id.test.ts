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
import { defineComponent, h } from 'vue';

import { render } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import { buildComponentMap, PREVIEW_ID_BASE, resolveComponentId } from '~/pages/designer/preview/catalog';

/**
 * glob key → 清单 id 的规则必须与 component-preview.config.mjs 的
 * componentIdBase / componentIdStripPrefixes 一致，不一致时预览静默缺组件（清单有、页面找不到）。
 */
/** 以 src 为基准时不需要额外前缀 */
const SRC_BASE: string[] = [];

describe('glob key 解析成清单 id', () => {
  it('src/components 下的组件保留 components 前缀', () => {
    expect(resolveComponentId('../../components/overflow-ctrl.vue', SRC_BASE)).toBe('components/overflow-ctrl');
  });

  it('页面内组件保留相对 src 的完整路径', () => {
    expect(resolveComponentId('../../pages/application/template/bkms-app/components/env-card.vue', SRC_BASE)).toBe(
      'pages/application/template/bkms-app/components/env-card',
    );
  });

  it('同目录文件按 base 目录起算', () => {
    expect(resolveComponentId('./local-preview.vue', PREVIEW_ID_BASE)).toBe('pages/designer/preview/local-preview');
  });

  it('回退片段被消解', () => {
    expect(resolveComponentId('../../components/../components/a.vue', SRC_BASE)).toBe('components/a');
  });
});

describe('组件模块表', () => {
  const component = { name: 'Fake' };

  it('按解析后的 id 建立映射', () => {
    const map = buildComponentMap({ '../../components/a.vue': { default: component } }, SRC_BASE);
    expect(map.get('components/a')).toBe(component);
  });

  it('跳过没有默认导出的模块', () => {
    const map = buildComponentMap(
      { '../../components/a.vue': {}, '../../components/b.vue': { default: component } },
      SRC_BASE,
    );
    expect([...map.keys()]).toEqual(['components/b']);
  });
});

describe('组件模块表（按需加载）', () => {
  it('glob loader 建立映射时不加载模块，渲染时才加载', async () => {
    let loads = 0;
    const lazy = defineComponent({
      render: () => h('div', 'lazy-loaded'),
    });
    const map = buildComponentMap(
      {
        '../../components/a.vue': async () => {
          loads += 1;
          return { default: lazy };
        },
      },
      SRC_BASE,
    );
    expect(loads).toBe(0);
    const { findByText } = render(map.get('components/a')!);
    expect(await findByText('lazy-loaded')).toBeInTheDocument();
    expect(loads).toBe(1);
  });

  it('loader 没有默认导出时渲染出可读错误，而不是空白', async () => {
    const map = buildComponentMap({ '../../components/a.vue': async () => ({}) }, SRC_BASE);
    const { findByText } = render(map.get('components/a')!);
    expect(await findByText(/没有默认导出/)).toBeInTheDocument();
  });
});
