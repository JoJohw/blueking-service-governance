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
 * 消费端对齐护栏：清单里除「显式排除项」外的字段都必须出现在 previewItems 的 pick 里，
 * 否则往 ComponentCatalogEntry 加字段、却忘了同步 preview/index.vue 的 pick，会静默丢字段。
 * 断言「ComponentCatalogEntry 全量 key − NOT_PICKED ⊆ pick」：默认所有字段都要透传，
 * 新增字段若漏写 pick 会红，提醒你「要么透传、要么加进 NOT_PICKED 显式声明不透传」——
 * 这比「白名单」更安全：白名单需逐条维护、漏列会让新字段静默丢失。
 */
import { parse as parseSfc } from '@vue/compiler-sfc';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DTS = path.join(ROOT, 'src/pages/designer/generated/component-catalog.d.ts');
const PREVIEW_INDEX = path.join(ROOT, 'src/pages/designer/preview/index.vue');

/** 故意不透传到 previewItems 的字段：usage 只用于收录统计，预览 UI 不展示 */
const NOT_PICKED = new Set(['usage']);

/** 用 TypeScript 解析 ComponentCatalogEntry 的顶层字段名 */
function catalogEntryFields() {
  const text = fs.readFileSync(DTS, 'utf8');
  const sourceFile = ts.createSourceFile(DTS, text, ts.ScriptTarget.Latest, true);
  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'ComponentCatalogEntry') {
      return statement.members
        .filter(member => ts.isPropertySignature(member) && member.name)
        .map(member => member.name.getText());
    }
  }
  return [];
}

/**
 * 从 preview/index.vue 的 previewItems .map(entry => ({...})) 里抽出 pick 的字段名。
 * 用 @vue/compiler-sfc 提取 <script setup>，交给 TypeScript AST 精确定位 previewItems 变量
 * 的初始化链式调用里的 `.map(...)`，取箭头函数体对象字面量的属性名——
 * 不做字符串切片 / 大括号计数，天然规避字符串、模板字符串、注释里的 `{`/`}` 干扰，
 * 也避免把其它 `.map(combo => ({...}))`（如 slotCombos 展示字段）误算进来。
 */
function previewPickFields() {
  const text = fs.readFileSync(PREVIEW_INDEX, 'utf8');
  const { descriptor } = parseSfc(text);
  const script = descriptor.scriptSetup?.content ?? descriptor.script?.content ?? '';
  if (!script) return [];
  const sourceFile = ts.createSourceFile('preview-script.ts', script, ts.ScriptTarget.Latest, true);

  let previewItemsInitializer = null;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'previewItems') {
        previewItemsInitializer = declaration.initializer;
      }
    }
  }
  if (!previewItemsInitializer) return [];

  const fields = [];
  const visit = node => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'map'
    ) {
      const callback = node.arguments[0];
      if (callback && ts.isArrowFunction(callback)) {
        const body = callback.body;
        // entry => ({ ... }) 的 body 是带括号的对象字面量
        const literal =
          ts.isParenthesizedExpression(body) && ts.isObjectLiteralExpression(body.expression)
            ? body.expression
            : ts.isObjectLiteralExpression(body)
              ? body
              : null;
        if (literal) {
          for (const property of literal.properties) {
            if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
              fields.push(property.name.getText());
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(previewItemsInitializer);
  return fields;
}

describe('消费端对齐护栏', () => {
  it('catalog 字段（全量 − NOT_PICKED）⊆ previewItems pick 字段集合', () => {
    const entryFields = catalogEntryFields();
    const pickFields = previewPickFields();
    expect(entryFields.length, '未解析到 ComponentCatalogEntry 字段').toBeGreaterThan(0);
    expect(pickFields.length, '未解析到 previewItems pick 字段').toBeGreaterThan(0);

    const mustPass = entryFields.filter(field => !NOT_PICKED.has(field));
    const missing = mustPass.filter(field => !pickFields.includes(field));
    expect(missing, `catalog 必须透传字段未出现在 previewItems pick: ${missing.join(', ')}`).toEqual([]);
  });
});
