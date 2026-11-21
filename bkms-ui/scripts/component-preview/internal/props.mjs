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

const { genericArraySize, maxDepth, namedOverrides, placeholders } = CONFIG;
const plugins = CONFIG.plugins ?? [];
const enumOverrides = Object.assign({}, ...plugins.map(plugin => plugin.enumOverrides ?? {}));
const GENERIC_TYPES = Symbol('generic-types');

/**
 * 生成 props 占位。优先走类型声明（能解析嵌套类型），缺失时兜底到运行时对象声明。
 * 最后用 withDefaults 的真实默认值覆盖类型推导值。
 * 预览只负责把组件画出来，不提供属性编辑，故此处不再产出控件 schema。
 */
export function analyzeProps(scriptText, componentFile, generic = '') {
  const sourceFile = ts.createSourceFile('component.ts', scriptText, ts.ScriptTarget.Latest, true);
  const typeNode = findDefinePropsType(sourceFile);
  if (!typeNode) return analyzeRuntimeProps(sourceFile);
  const decls = loadTypeDecls(sourceFile, componentFile);
  const genericNames = generic
    .split(',')
    .map(part => part.trim().split(/\s*(?:extends|=)\s*/)[0])
    .filter(name => /^[A-Za-z_$][\w$]*$/.test(name));
  decls.set(GENERIC_TYPES, new Set(genericNames));
  const value = resolveTypeNode(typeNode, decls, 0);
  const base = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return { props: { ...base, ...extractDefaults(sourceFile) } };
}

/**
 * 收集某文件及其 import 链上的类型声明。接口 mock 生成器复用同一套逻辑，
 * 保证 props 与接口返回值推导出的占位值口径一致。
 */
export function loadTypeDecls(sourceFile, fromFile) {
  const decls = collectDecls(sourceFile);
  const seen = new Set([fromFile]);
  for (const { specifier } of collectTypeImports(sourceFile).values()) {
    const resolved = resolveImportPath(fromFile, specifier);
    if (resolved) loadDeclsFromFile(resolved, decls, seen);
  }
  return decls;
}

/** 把任意类型节点推导成占位样例；数组给一条元素、对象给全字段、字面量联合取第一个 */
export function sampleOfTypeNode(typeNode, decls) {
  return resolveTypeNode(typeNode, decls, 0);
}

/**
 * 解析运行时 defineProps({...}) 对象声明的占位——类型声明式 defineProps<T>() 解析不了时的兜底。
 * default 优先于 type；空串转可读占位避免预览空白。
 */
function analyzeRuntimeProps(sourceFile) {
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
  if (!object) return { props: {} };
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
  return { props: result };
}

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

/** 数组样例的通用后处理阶段：只传约定产物给插件，业务规则由插件自己实现 */
function applyPluginArrayTransforms(items, elementType) {
  const typeName = ts.isTypeReferenceNode(elementType) ? elementType.typeName.getText() : undefined;
  return plugins.reduce((result, plugin) => plugin.transformArrayItems?.(result, { typeName }) ?? result, items);
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
      // defineProps<T>() 既可以接 import type，也可以接普通 import 的具名类型。
      // 这里只用来加载声明体，读文件是只读的，多收普通 import 不会改变 props 推导结果。
      const name = element.propertyName?.text ?? element.name.text;
      imports.set(element.name.text, { name, specifier });
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
  // 无语义的字符串数组（如 kinds?: string[]）不塞占位文本：这类数组常被当过滤条件，
  // 假值会把 mock 返回的数据全滤掉；空数组表示不过滤。
  const genericElement =
    ts.isTypeReferenceNode(elementType) && decls.get(GENERIC_TYPES)?.has(elementType.typeName.getText());
  if (item === placeholders.string && genericElement) {
    return Array.from({ length: genericArraySize }, (_, index) => `${placeholders.string} ${index + 1}`);
  }
  if (item === placeholders.string) return [];
  const variants = variantValuesOf(elementType, decls);
  // 按候选值各展开一条，让按枚举分组的组件每一栏都有内容；只改顶层字段，嵌套结构共享足够安全
  const items = variants ? variants.values.map(value => ({ ...item, [variants.field]: value })) : [item];
  const suffixed = items.map((entry, index) => withIdentitySuffix(entry, index + 1, items.length));
  return applyPluginArrayTransforms(suffixed, elementType);
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
  // 外部 enum 成员（如 PlacementEnum.TOP）拿不到声明，按成员名推导：TOP → top、TOP_START → top-start
  if (ts.isPropertyAccessExpression(node)) {
    const member = node.name.getText();
    if (/^[A-Z][A-Z0-9_]*$/.test(member)) return member.replace(/_/g, '-').toLowerCase();
  }
  return undefined;
}

function resolveFileCandidate(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.d.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/**
 * 解析 import 到真实文件：先按相对路径，再按工程 tsconfig paths 里的别名（如 ~/* -> src/*）。
 * 类型定义基本都在 `~/@types/...` 下，不认别名就解析不出返回类型，接口 mock 会全部退化成空数组。
 */
function resolveImportPath(fromFile, specifier) {
  if (specifier.startsWith('.')) {
    return resolveFileCandidate(path.resolve(path.dirname(fromFile), specifier));
  }
  for (const alias of loadAliases(fromFile)) {
    if (!specifier.startsWith(alias.prefix)) continue;
    const rest = specifier.slice(alias.prefix.length);
    for (const root of alias.roots) {
      const resolved = resolveFileCandidate(path.join(root, rest));
      if (resolved) return resolved;
    }
  }
  return null;
}

/**
 * 数组元素若是已知接口、且该接口配了枚举候选，返回「字段名 + 候选值」，供数组按候选展开。
 * 只按候选值最多的那个字段展开：多字段同时展开会让条目数相乘，预览里反而更难看清；
 * 取最多的那个通常就是组件的主分组维度（如环境列表按 type 分四栏，而非按 kind 分两类）。
 */
function variantValuesOf(elementType, decls) {
  if (!ts.isTypeReferenceNode(elementType)) return undefined;
  const typeName = elementType.typeName.getText();
  const target = decls.get(typeName);
  if (!target || !ts.isInterfaceDeclaration(target)) return undefined;
  let primary;
  for (const [key, values] of Object.entries(enumOverrides)) {
    const separator = key.lastIndexOf('.');
    if (separator < 0 || key.slice(0, separator) !== typeName) continue;
    if (values.length < 2) continue;
    if (!primary || values.length > primary.values.length) {
      primary = { field: key.slice(separator + 1), values };
    }
  }
  return primary;
}

/**
 * 同一数组里条目的取值必须互不相同，否则预览会出现「选一个全选」这类假象：
 * env-group-selector 用 name 当 v-model 的值，多条都叫「占位文本」时勾一条会全部一起亮。
 *
 * 判据不看字段名（按名字猜 id/name/title 既会漏字段，也会误伤同名的展示文案），
 * 只看值本身：只给「仍是通用字符串占位」的顶层字段追加序号。真实默认值、
 * 从字面量联合或 enumOverrides 推导出的枚举值（Ready / standard / development …）
 * 都不是通用占位，天然不会被改写，也就不需要白名单。
 */
function withIdentitySuffix(item, index, total) {
  if (total < 2 || typeof item !== 'object' || item === null || Array.isArray(item)) return item;
  const result = { ...item };
  for (const [key, value] of Object.entries(result)) {
    if (value !== placeholders.string) continue;
    result[key] = `${value} ${index}`;
  }
  return result;
}

/** 别名表按 tsconfig 缓存，避免每个 import 都重新读盘解析 */
const aliasCache = new Map();

/**
 * 宽泛 string 字段在声明里丢掉了枚举信息，只能靠配置补回业务已知取值。
 * 只覆盖「当前仍是通用字符串占位」的字段：真实默认值、以及能推导出字面量联合的字段都保持原样，
 * 避免把本来正确的值改坏。key 形如 `EnvOutput.type`，不匹配当前接口名就直接跳过，不做模糊匹配。
 */
function applyEnumOverrides(typeName, members) {
  for (const [key, candidates] of Object.entries(enumOverrides)) {
    const separator = key.lastIndexOf('.');
    if (separator < 0 || key.slice(0, separator) !== typeName) continue;
    const field = key.slice(separator + 1);
    if (!candidates.length || !Object.hasOwn(members, field)) continue;
    if (members[field] !== placeholders.string) continue;
    members[field] = candidates[0];
  }
  return members;
}

/** 从文件往上找最近的 tsconfig.json，把 paths 编译成「前缀 + 绝对根目录」 */
function loadAliases(fromFile) {
  let dir = path.dirname(fromFile);
  while (dir !== path.dirname(dir)) {
    const configFile = path.join(dir, 'tsconfig.json');
    if (fs.existsSync(configFile)) {
      if (!aliasCache.has(configFile)) {
        const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
        const paths = config?.compilerOptions?.paths ?? {};
        aliasCache.set(
          configFile,
          Object.entries(paths).map(([pattern, targets]) => ({
            prefix: pattern.replace(/\*$/, ''),
            roots: (targets ?? []).map(target => path.resolve(dir, target.replace(/\*$/, ''))),
          })),
        );
      }
      return aliasCache.get(configFile);
    }
    dir = path.dirname(dir);
  }
  return [];
}

/**
 * 可选成员（`xxx?: T`）同样会被填上占位值。这会让「未传 prop 就自己请求」的组件走 props 分支、
 * 不再发请求（如 components-sideSlider 的 appEnvList）。全仓库这种写法只有 2 处，
 * 且改走接口拿到的数据与占位值等价，故暂不区分可选性；日后若想扩大接口样例的覆盖面，得先改这里。
 */
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
    if (['Array', 'ReadonlyArray'].includes(node.typeName.getText()) && node.typeArguments?.[0]) {
      return resolveArrayItem(node.typeArguments[0], decls, depth);
    }
    const typeName = node.typeName.getText();
    // 泛型参数（如 <script setup generic="T">）没有声明体，按可读字符串占位，
    // 否则 T[] 会变成 [{}]，预览里显示成字面量 {}
    if (decls.get(GENERIC_TYPES)?.has(typeName)) return placeholders.string;
    const target = decls.get(typeName);
    if (!target) return {};
    return ts.isInterfaceDeclaration(target)
      ? applyEnumOverrides(typeName, resolveMembers(target.members, decls, depth + 1))
      : resolveTypeNode(target, decls, depth + 1);
  }
  if (ts.isTypeQueryNode(node)) return undefined;
  return undefined;
}
