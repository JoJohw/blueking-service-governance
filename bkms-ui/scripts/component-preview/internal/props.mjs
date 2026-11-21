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

/** 把组件的 props 声明推导成预览可用的占位数据（纯静态分析，不执行组件代码） */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { CONFIG } from '../component-preview.config.mjs';

const { maxDepth, namedOverrides, placeholders } = CONFIG;

/**
 * 按属性名放大数字占位值。只对"等于数字占位"的值生效，
 * 这样带真实默认值（如 min: 500）的属性不会被误改。
 */
function applyNamedOverrides(name, value) {
  if (typeof value !== 'number' || value !== placeholders.number) return value;
  for (const { pattern, value: override } of namedOverrides) {
    if (pattern.test(name)) return override;
  }
  return value;
}

function collectDecls(sourceFile) {
  const decls = new Map();
  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt)) decls.set(stmt.name.text, stmt);
    else if (ts.isTypeAliasDeclaration(stmt)) decls.set(stmt.name.text, stmt.type);
  }
  return decls;
}

function collectTypeImports(sourceFile) {
  const imports = new Map();
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const clause = stmt.importClause;
    const named = clause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    const specifier = stmt.moduleSpecifier.text;
    for (const element of named.elements) {
      if (!ts.isImportSpecifier(element)) continue;
      const isTypeOnly = !!element.isTypeOnly || clause.isTypeOnly;
      const name = element.propertyName?.text ?? element.name.text;
      if (isTypeOnly) imports.set(element.name.text, { name, specifier });
    }
  }
  return imports;
}

/** 取 withDefaults 里的真实默认值；空串跳过，让类型推导的占位生效而非显示空白 */
function extractDefaults(sourceFile) {
  const object = findWithDefaults(sourceFile);
  if (!object) return {};
  const result = {};
  for (const prop of object.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name.getText().replace(/^['"]|['"]$/g, '');
    const value = resolveDefaultValue(prop.initializer);
    if (value === undefined) continue;
    if (typeof value === 'string' && value === '') continue;
    result[name] = value;
  }
  return result;
}

/**
 * 解析运行时 defineProps({...}) 对象声明的占位——类型声明式 defineProps<T>() 解析不了时的兜底。
 * default 优先于 type；空串转可读占位避免预览空白。
 */
function extractRuntimeProps(sourceFile) {
  let object = null;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'defineProps') {
      const arg = node.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        object = arg;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  if (!object) return {};
  const result = {};
  for (const prop of object.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name.getText().replace(/^['"]|['"]$/g, '');
    if (!ts.isObjectLiteralExpression(prop.initializer)) continue;
    let placeholder;
    let hasDefault = false;
    for (const field of prop.initializer.properties) {
      if (!ts.isPropertyAssignment(field)) continue;
      const key = field.name.getText().replace(/^['"]|['"]$/g, '');
      if (key === 'default') {
        hasDefault = true;
        const value = resolveDefaultValue(field.initializer);
        if (value !== undefined) placeholder = value;
      } else if (key === 'type' && !hasDefault) {
        // 锚定开头：type: Array as PropType<...string...> 不能因泛型里的 string 被误判成 String
        const typeName = field.initializer.getText().trim();
        if (/^Array\b/.test(typeName)) placeholder = placeholders.array;
        else if (/^Object\b/.test(typeName)) placeholder = placeholders.object;
        else if (/^String\b/.test(typeName)) placeholder = placeholders.string;
        else if (/^Number\b/.test(typeName)) placeholder = placeholders.number;
        else if (/^Boolean\b/.test(typeName)) placeholder = placeholders.boolean;
      }
    }
    if (placeholder === undefined) continue;
    if (placeholder === '') placeholder = placeholders.string;
    result[name] = applyNamedOverrides(name, placeholder);
  }
  return result;
}

function findDefinePropsType(sourceFile) {
  let typeNode = null;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'defineProps' && node.typeArguments?.[0]) {
      typeNode = node.typeArguments[0];
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return typeNode;
}

function findWithDefaults(sourceFile) {
  let defaults = null;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'withDefaults') {
      const arg = node.arguments[1];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        defaults = arg;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return defaults;
}

/**
 * 生成 props 占位。优先走类型声明（能解析嵌套类型），缺失时兜底到运行时对象声明。
 * 最后用 withDefaults 的真实默认值覆盖类型推导值。
 */
export function generatePlaceholder(scriptText, componentFile) {
  const sourceFile = ts.createSourceFile('component.ts', scriptText, ts.ScriptTarget.Latest, true);
  const typeNode = findDefinePropsType(sourceFile);
  if (!typeNode) return extractRuntimeProps(sourceFile);
  const decls = collectDecls(sourceFile);
  const seen = new Set([componentFile]);
  for (const { specifier } of collectTypeImports(sourceFile).values()) {
    const resolved = resolveImportPath(componentFile, specifier);
    if (resolved) loadDeclsFromFile(resolved, decls, seen);
  }
  const value = resolveTypeNode(typeNode, decls, 0);
  const base = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return { ...base, ...extractDefaults(sourceFile) };
}

function loadDeclsFromFile(filePath, decls, seen) {
  if (seen.has(filePath)) return;
  seen.add(filePath);
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt)) decls.set(stmt.name.text, stmt);
    else if (ts.isTypeAliasDeclaration(stmt)) decls.set(stmt.name.text, stmt.type);
  }
  for (const { name, specifier } of collectTypeImports(sourceFile).values()) {
    if (decls.has(name)) continue;
    const resolved = resolveImportPath(filePath, specifier);
    if (resolved) loadDeclsFromFile(resolved, decls, seen);
  }
}

/**
 * 数组元素占位：函数类型（如 validator 回调数组）和无法解析的类型一律给空数组。
 * 若塞函数/空对象占位，消费方 flatMap(fn => fn(value)) 会把它当函数调用而崩溃。
 */
function resolveArrayItem(elementType, decls, depth) {
  const item = resolveTypeNode(elementType, decls, depth + 1);
  if (item === undefined || item === placeholders.fn) return [];
  return [item];
}

function resolveDefaultValue(node) {
  if (!node) return undefined;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    if (ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  }
  return undefined;
}

function resolveImportPath(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.d.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function resolveMembers(members, decls, depth) {
  const result = {};
  for (const member of members) {
    if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) continue;
    const name = member.name.getText().replace(/^['"]|['"]$/g, '');
    const value = applyNamedOverrides(name, resolveTypeNode(member.type, decls, depth + 1));
    if (value !== undefined) result[name] = value;
  }
  return result;
}

/**
 * 递归把 TS 类型节点转成占位数据。union 取第一个非空成员；
 * depth 超过 maxDepth 就放弃，防止自引用类型无限展开。
 */
function resolveTypeNode(node, decls, depth) {
  if (!node || depth > maxDepth) return undefined;
  if (node.kind === ts.SyntaxKind.StringKeyword) return placeholders.string;
  if (node.kind === ts.SyntaxKind.NumberKeyword) return placeholders.number;
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return placeholders.boolean;
  if (node.kind === ts.SyntaxKind.NullKeyword) return placeholders.null;
  if (ts.isLiteralTypeNode(node)) {
    const literal = node.literal;
    if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal)) {
      return literal.text || placeholders.string;
    }
    if (ts.isNumericLiteral(literal)) return Number(literal.text) || placeholders.number;
    if (literal.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (literal.kind === ts.SyntaxKind.FalseKeyword) return false;
    return undefined;
  }
  if (ts.isUnionTypeNode(node)) {
    const nonNull = node.types.filter(
      t => t.kind !== ts.SyntaxKind.UndefinedKeyword && t.kind !== ts.SyntaxKind.NullKeyword,
    );
    return resolveTypeNode(nonNull[0], decls, depth + 1);
  }
  if (ts.isArrayTypeNode(node)) {
    return resolveArrayItem(node.elementType, decls, depth);
  }
  if (ts.isTupleTypeNode(node)) {
    return node.elements.map(el => resolveTypeNode(el, decls, depth + 1) ?? {});
  }
  if (ts.isTypeLiteralNode(node)) return resolveMembers(node.members, decls, depth + 1);
  if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node)) return placeholders.fn;
  if (ts.isTypeReferenceNode(node)) {
    if (node.typeName.getText() === 'Array' && node.typeArguments?.[0]) {
      return resolveArrayItem(node.typeArguments[0], decls, depth);
    }
    const target = decls.get(node.typeName.getText());
    if (!target) return {};
    return ts.isInterfaceDeclaration(target)
      ? resolveMembers(target.members, decls, depth + 1)
      : resolveTypeNode(target, decls, depth + 1);
  }
  if (ts.isTypeQueryNode(node)) return undefined;
  return undefined;
}
