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
 * 扫描 api 模块，把「返回数组」的接口按返回类型推导成样例数据，供预览环境打桩。
 * 目标不是造出真实业务数据（占位值仍是「占位文本」），而是让列表类组件至少有结构完整的行，
 * 不再是清一色的「暂无数据」；详情类接口（对象返回）不参与，避免把详情对象当列表喂给组件。
 *
 * 扩充样例的边际收益很低，别在这里继续投入：预览里真正会发请求的组件只有个位数，
 * 多数组件的数据由 props 传入（见 props.mjs），样例收得再全也用不上。
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { CONFIG } from '../component-preview.config.mjs';
import { writeFileAtomic } from './atomic-write.mjs';
import { loadTypeDecls, sampleOfTypeNode } from './props.mjs';

const plugins = CONFIG.plugins ?? [];
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

/**
 * @returns {{ key: string, sample: unknown[], source: string }[]} 按 key 排序，便于产物稳定 diff
 */
export function collectApiMocks(modulesDir, mockPlugins = plugins) {
  const entries = new Map();
  for (const file of walk(modulesDir)) {
    if (!file.endsWith('.ts')) continue;
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const decls = loadTypeDecls(sourceFile, file);
    for (const endpoint of findArrayEndpoints(sourceFile)) {
      const sample = sampleOfTypeNode(endpoint.responseType, decls);
      if (!Array.isArray(sample) || !sample.length) continue;
      const key = `${endpoint.method} ${endpoint.url}`;
      if (entries.has(key)) continue;
      entries.set(key, { key, sample, source: toPosix(path.relative(modulesDir, file)) });
    }
  }
  for (const plugin of mockPlugins) plugin.transformSamples?.(entries);
  return [...entries.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

/** 写成 JSON：tsconfig 开了 resolveJsonModule，预览页直接 import，无需再维护一份类型声明 */
export function writeApiMock(entries, outputFile) {
  const samples = Object.fromEntries(entries.map(entry => [entry.key, entry.sample]));
  writeFileAtomic(outputFile, `${JSON.stringify(samples, null, 2)}\n`);
  return entries.length;
}

function asFunctionLike(node) {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node) ? node : undefined;
}

/** 抽出所有「泛型第二个参数默认值是数组」的接口：url 模板取 fetch 调用的字符串字面量 */
function findArrayEndpoints(sourceFile) {
  const endpoints = [];
  const visit = node => {
    const typeParameters = ts.isPropertyAssignment(node)
      ? asFunctionLike(node.initializer)?.typeParameters
      : ts.isMethodDeclaration(node)
        ? node.typeParameters
        : undefined;
    const responseType = typeParameters?.[1]?.default;
    if (responseType && isArrayType(responseType)) {
      const call = findFetchCall(node);
      if (call) endpoints.push({ ...call, responseType });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return endpoints;
}

/** 在方法体里找 `xxxFetch.get<...>('/url')`，返回 HTTP 方法与 url 模板 */
function findFetchCall(node) {
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    // 项目里请求实例统一叫 xxxFetch（fetch / repoFetch / v1Fetch），别把普通对象的 .get() 当接口
    if (
      ts.isPropertyAccessExpression(callee) &&
      HTTP_METHODS.has(callee.name.text) &&
      /fetch$/i.test(callee.expression.getText())
    ) {
      const [first] = node.arguments;
      if (first && ts.isStringLiteralLike(first)) {
        return { method: callee.name.text.toUpperCase(), url: first.text };
      }
    }
  }
  let found;
  ts.forEachChild(node, child => {
    found ??= findFetchCall(child);
  });
  return found;
}

function isArrayType(node) {
  if (ts.isArrayTypeNode(node)) return true;
  return (
    ts.isTypeReferenceNode(node) &&
    ['Array', 'ReadonlyArray'].includes(node.typeName.getText()) &&
    Boolean(node.typeArguments?.length)
  );
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}
