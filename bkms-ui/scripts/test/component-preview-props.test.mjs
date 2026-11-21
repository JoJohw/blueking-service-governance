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
 * 组件预览的 props 占位契约：预览只负责把组件画出来，不提供属性编辑，
 * 所以这里只保证「每个 prop 都拿到能渲染、可区分、语义尽量正确的占位值」。
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { analyzeProps } from '../component-preview/internal/props.mjs';

/** 组件文件路径只用于解析相对 import，测试里给个不存在的路径即可命中兜底分支 */
const FAKE_FILE = '/tmp/fake-component.vue';

describe('占位值：类型声明式组件', () => {
  const script = `
    interface IProps {
      columns?: 2 | 4;
      mode?: 'multi' | 'single';
      disabled?: boolean;
      size?: number;
      title?: string;
      envs?: string[];
      config?: { deep: boolean };
      onChange?: (value: string) => void;
    }
    const props = withDefaults(defineProps<IProps>(), { columns: 4 });
  `;

  it('各基础类型给出可直接渲染的占位', () => {
    const { props } = analyzeProps(script, FAKE_FILE);
    expect(props).toMatchObject({
      mode: 'multi',
      disabled: false,
      title: '占位文本',
      // 普通 string[] 保持空数组：占位文本会被当成过滤条件，反而把 mock 数据滤空
      envs: [],
      config: { deep: false },
    });
  });

  it('尺寸类数字按配置放大，1 在预览里看不见', () => {
    const { props } = analyzeProps(script, FAKE_FILE);
    expect(props.size).toBe(120);
  });

  it('withDefaults 的真实默认值优先于类型推导值', () => {
    const { props } = analyzeProps(script, FAKE_FILE);
    expect(props.columns).toBe(4);
  });

  it('函数型 prop 用 Symbol 标记，避免被当普通对象展开', () => {
    const { props } = analyzeProps(script, FAKE_FILE);
    expect(typeof props.onChange).toBe('symbol');
  });

  it('普通 import 的具名类型也能解析出占位', () => {
    const root = mkdtempSync(join(tmpdir(), 'bkms-props-'));
    try {
      writeFileSync(
        join(root, 'types.ts'),
        'export interface IProps { title?: string; count?: number }\n',
      );
      const { props } = analyzeProps(
        "import { IProps } from './types';\nconst props = defineProps<IProps>();",
        join(root, 'component.vue'),
      );
      expect(props).toMatchObject({ title: '占位文本', count: 1 });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('占位值：运行时对象声明', () => {
  it('default 优先于 type 标识符', () => {
    const { props } = analyzeProps(
      `defineProps({ visible: { type: Boolean, default: true }, label: { type: String } })`,
      FAKE_FILE,
    );
    expect(props).toEqual({ visible: true, label: '占位文本' });
  });

  it('空串默认值转成可读占位，避免预览出现空白', () => {
    const { props } = analyzeProps(`defineProps({ label: { type: String, default: '' } })`, FAKE_FILE);
    expect(props.label).toBe('占位文本');
  });

  it('type 标识符解析不出来时跳过该 prop', () => {
    const { props } = analyzeProps(`defineProps({ payload: { type: SomeExternal } })`, FAKE_FILE);
    expect(props).toEqual({});
  });

  it('PropType 里的字面量联合不参与推导，仍给通用字符串占位', () => {
    const { props } = analyzeProps(
      `defineProps({ mode: { type: String as PropType<'multi' | 'single'> } })`,
      FAKE_FILE,
    );
    expect(props.mode).toBe('占位文本');
  });
});

/**
 * 类型声明里很多字段只写成 string，真实取值只存在于注释里，推导只能得到通用字符串占位。
 * 组件若按固定枚举分支渲染，值对不上就整块落空态，故按「接口名.字段名」配置候选值。
 */
describe('占位值：宽泛 string 字段按配置补枚举值', () => {
  const envScript = `
    interface EnvOutput {
      kind?: string;
      name?: string;
      status?: string;
      type?: string;
    }
    interface IProps {
      envList?: EnvOutput[];
    }
    defineProps<IProps>();
  `;

  it('数组按候选值最多的字段展开，覆盖组件的每个分组', () => {
    const { props } = analyzeProps(envScript, FAKE_FILE);
    expect(props.envList.map(env => env.type)).toEqual(['development', 'test', 'staging', 'production']);
    expect(props.envList[0]).toEqual({
      kind: 'standard',
      name: '占位文本 1',
      status: 'Ready',
      type: 'development',
    });
  });

  it('同一数组的标识字段互不相同，避免预览里一选全选', () => {
    const { props } = analyzeProps(envScript, FAKE_FILE);
    const names = props.envList.map(env => env.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('单条数组不加序号，非标识字段也不动', () => {
    const script = `
      interface ResourceOutput {
        name?: string;
        type?: string;
      }
      interface IProps {
        resource?: ResourceOutput[];
      }
      defineProps<IProps>();
    `;
    const { props } = analyzeProps(script, FAKE_FILE);
    expect(props.resource).toEqual([{ name: '占位文本', type: '占位文本' }]);
  });

  it('只按接口名精确匹配，同名普通字段不被误伤', () => {
    const script = `
      interface ResourceOutput {
        type?: string;
      }
      interface IProps {
        resource?: ResourceOutput;
      }
      defineProps<IProps>();
    `;
    const { props } = analyzeProps(script, FAKE_FILE);
    expect(props.resource.type).toBe('占位文本');
  });

  it('接口返回值的样例与 props 占位同一口径', async () => {
    const { sampleOfTypeNode, loadTypeDecls } = await import('../component-preview/internal/props.mjs');
    const ts = (await import('typescript')).default;
    const source = ts.createSourceFile(
      'env.ts',
      `
      interface EnvOutput {
        status?: string;
        type?: string;
      }
      type EnvList = EnvOutput[];
      `,
      ts.ScriptTarget.Latest,
      true,
    );
    const decls = loadTypeDecls(source, '/tmp/env.ts');
    const alias = decls.get('EnvList');
    expect(sampleOfTypeNode(alias, decls)).toEqual([
      { status: 'Ready', type: 'development' },
      { status: 'Ready', type: 'test' },
      { status: 'Ready', type: 'staging' },
      { status: 'Ready', type: 'production' },
    ]);
  });
});
