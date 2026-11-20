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
 * the License is distributed on an "AS IS" BASIS, either express or implied. See the
 * License for the specific language governing permissions and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

import { parse } from '@vue/compiler-sfc';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const OUTPUT = path.join(ROOT, 'src/pages/designer/component-catalog.generated.js');
const CACHE = path.join(ROOT, 'node_modules/.cache/component-preview-cache.json');

/**
 * 组件预览清单的生成配置。占位、过滤、风险预判都集中在此，逻辑侧只读取不写死。
 */
const CONFIG = {
  /** 递归展开类型的深度上限，防止自引用类型导致无限递归 */
  maxDepth: 6,
  /** 收录门槛：引用文件数达到此值才进清单——只在一处使用的组件价值低 */
  minUsageToInclude: 2,
  /** 使用次数不足但需强制保留的组件 id */
  usageExcept: new Set([]),
  /** 无论如何都不进预览清单的组件 id */
  ignoreIds: new Set([
    // 纯图标渲染，预览无价值
    'color-icon',
    // 纯图标渲染，预览无价值
    'svg-icon',
    // 仅一行提示文案，无结构可看
    'command-mode-hint',
    // 主体是 iframe，URL 由外部接口/父页面现算，预览恒空白
    'monitor-iframe',
    'grafana-dashboard-iframe',
    // 纯接口下拉，空响应下只剩空壳，无可看的设计信息
    'namespace-selector',
    'pipeline-selector',
  ]),
  warning: {
    /** 风险提示统一用"可能"措辞：静态正则只能预判，无法确认一定会异常 */
    text: '该组件可能无法在预览中完整展示，如显示异常请自行排查',
    /** 每条规则命中即打同一条提示；新增预判特征往这里加即可 */
    patterns: [
      source => /<(Dialog|Sideslider)\b/.test(source) && /render-directive="if"|v-model:is-show|:is-show=/.test(source),
      source => /<iframe\b/.test(source),
      source => /defineModel\s*\(/.test(source),
      source => /defineProps\s*\(\s*\{/.test(source),
      source => /useRouter\s*\(|route\.params/.test(source),
      source => /opacity-0/.test(source) && /group-hover:opacity-100/.test(source),
    ],
  },
  /**
   * 各类型的占位值。string 用可读文案而非空串，避免预览里出现空白；
   * fn 用唯一 Symbol 标记，序列化时再转成函数字面量，避免占位函数被当普通对象展开。
   */
  placeholders: {
    string: '占位文本',
    number: 1,
    boolean: false,
    null: null,
    array: [],
    object: {},
    fn: Symbol('placeholder-fn'),
  },
  /**
   * 按属性名覆写占位值：数字占位默认 1，尺寸/字号用 1 预览看不见，
   * 故放大到可视尺寸。只对"恰好等于数字占位"的值生效，真实默认值不动。
   */
  namedOverrides: [
    // 面板/弹层宽度要容纳多列内容，通用尺寸值会把列挤成竖排
    { pattern: /^(popoverwidth|panelwidth|dialogwidth|drawerwidth)$/i, value: 800 },
    { pattern: /^(size|radius|offset|\w*(width|height))$/i, value: 120 },
    { pattern: /^(fontsize|\w+size)$/i, value: 14 },
  ],
};

/** 静态预判组件展示风险；命中任一特征就统一打一条提示，不区分具体原因 */
function analyzeWarnings(source) {
  return CONFIG.warning.patterns.some(match => match(source)) ? [CONFIG.warning.text] : [];
}

/**
 * 按属性名放大数字占位值。只对"等于数字占位"的值生效，
 * 这样带真实默认值（如 min: 500）的属性不会被误改。
 */
function applyNamedOverrides(name, value) {
  if (typeof value !== 'number' || value !== CONFIG.placeholders.number) return value;
  for (const { pattern, value: override } of CONFIG.namedOverrides) {
    if (pattern.test(name)) return override;
  }
  return value;
}

/**
 * 遍历 components 目录生成清单。单个组件解析失败只跳过它，不中断整批生成。
 * @param {{ file: string, text: string }[]} usageSources 全项目引用源，用于统计使用次数
 */
function buildCatalog(usageSources) {
  const files = walk(COMPONENTS_DIR);
  const catalog = [];
  for (const file of files) {
    const rel = path
      .relative(COMPONENTS_DIR, file)
      .split(path.sep)
      .join('/')
      .replace(/\.vue$/, '');
    if (CONFIG.ignoreIds.has(rel)) continue;
    const usage = countUsages(rel, usageSources);
    if (!CONFIG.usageExcept.has(rel) && usage < CONFIG.minUsageToInclude) continue;
    const source = fs.readFileSync(file, 'utf8');
    try {
      const { descriptor } = parse(source);
      if (!descriptor.scriptSetup) continue;
      const props = generatePlaceholder(descriptor.scriptSetup.content, file);
      const visibilityProp = findVisibilityProp(descriptor);
      if (visibilityProp && typeof props[visibilityProp] === 'boolean') props[visibilityProp] = true;
      const slots = extractSlots(descriptor);
      const fallbackSlots = extractFallbackSlots(descriptor);
      const needsForm = needsFormContext(descriptor);
      const warnings = analyzeWarnings(source);
      catalog.push({ id: rel, props, slots, fallbackSlots, needsForm, warnings, usage });
    } catch (error) {
      console.warn(`[component-preview] 跳过 ${rel}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return catalog;
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

/**
 * 扫描全项目源码作为使用次数统计的引用源。
 * 排除 components.d.ts（自动注册声明，列了全部组件名）和 catalog 产物，
 * 否则每个组件都会被算作"被引用"，统计失真。
 */
function collectUsageSources() {
  const sources = [];
  const excluded = new Set([path.join(SRC_DIR, 'components.d.ts'), OUTPUT]);
  const scan = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        scan(full);
      } else if (/\.(vue|ts|tsx|js)$/.test(entry.name) && !excluded.has(full)) {
        sources.push({ file: full, text: fs.readFileSync(full, 'utf8') });
      }
    }
  };
  scan(SRC_DIR);
  return sources;
}

/**
 * 统计引用该组件的"不同文件数"而非引用次数——更符合"用到几次"的直觉。
 * 命中路径 import 或模板标签（PascalCase/kebab）即计一，类型导入和组件自身不计。
 */
function countUsages(id, sources) {
  const base = id
    .split('/')
    .pop()
    .replace(/\.vue$/, '');
  const pascal = base
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const pathPattern = new RegExp(`components/${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.vue`);
  const tagPattern = new RegExp(`<(${pascal}|${base})\\b`);
  let count = 0;
  for (const { file, text } of sources) {
    if (file.startsWith(COMPONENTS_DIR) && path.basename(file, '.vue') === base) continue;
    const code = text.replace(/^\s*import\s+type\b.*?;\s*$/gm, '');
    if (pathPattern.test(code) || tagPattern.test(code)) count += 1;
  }
  return count;
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

/** 识别带默认内容的 slot（成对标签且内容非空），供预览页并排展示"原生版" */
function extractFallbackSlots(descriptor) {
  const template = descriptor.template?.content ?? '';
  const result = [];
  const tagRegex = /<slot\b([^>]*)>([\s\S]*?)<\/slot>/g;
  for (const match of template.matchAll(tagRegex)) {
    if (!match[2].trim()) continue;
    const named = match[1].match(/\bname\s*=\s*["']([^"']+)["']/);
    result.push(named ? named[1] : 'default');
  }
  return [...new Set(result)];
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
        if (/^Array\b/.test(typeName)) placeholder = CONFIG.placeholders.array;
        else if (/^Object\b/.test(typeName)) placeholder = CONFIG.placeholders.object;
        else if (/^String\b/.test(typeName)) placeholder = CONFIG.placeholders.string;
        else if (/^Number\b/.test(typeName)) placeholder = CONFIG.placeholders.number;
        else if (/^Boolean\b/.test(typeName)) placeholder = CONFIG.placeholders.boolean;
      }
    }
    if (placeholder === undefined) continue;
    if (placeholder === '') placeholder = CONFIG.placeholders.string;
    result[name] = applyNamedOverrides(name, placeholder);
  }
  return result;
}

/** 识别 slot：模板里的 <slot> 标签 + defineSlots<T>() 类型成员两处来源 */
function extractSlots(descriptor) {
  const slots = new Set();
  const template = descriptor.template?.content ?? '';
  const tagRegex = /<slot\b([^>]*)>/g;
  for (const match of template.matchAll(tagRegex)) {
    const attrs = match[1] ?? '';
    const named = attrs.match(/\bname\s*=\s*["']([^"']+)["']/);
    if (named) slots.add(named[1]);
    else if (!/\b:name\s*=/.test(attrs)) slots.add('default');
  }
  const script = descriptor.scriptSetup?.content ?? '';
  const sourceFile = ts.createSourceFile('slots.ts', script, ts.ScriptTarget.Latest, true);
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'defineSlots') {
      const typeNode = node.typeArguments?.[0];
      if (typeNode && ts.isTypeLiteralNode(typeNode)) {
        for (const member of typeNode.members) {
          if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) {
            slots.add(member.name.getText().replace(/^['"]|['"]$/g, ''));
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return [...slots];
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

/**
 * Dialog/Sideslider 用 render-directive="if" 时，显隐 prop 为 false 则弹层 DOM 不生成，预览画布空白。
 * 从 is-show 绑定反查对应 prop：直接同名（visible）或经 computed/ref 映射（localValue = ref(props.modelValue)）。
 */
function findVisibilityProp(descriptor) {
  const template = descriptor.template?.content ?? '';
  const binding = template.match(/<(?:Dialog|Sideslider)\b[^>]*?(?:v-model:is-show|:is-show|is-show)="([^"]+)"/s)?.[1];
  if (!binding) return null;
  const script = descriptor.scriptSetup?.content ?? '';
  const boundName = binding.trim().split(/[.[]/)[0];
  const traced = script.match(
    new RegExp(`(?:const|let)\\s+${boundName}\\s*=\\s*(?:ref|computed)\\s*\\(?[\\s\\S]{0,120}?props\\.(\\w+)`),
  );
  return traced ? traced[1] : boundName;
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
function generatePlaceholder(scriptText, componentFile) {
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

function main() {
  try {
    const usageSources = collectUsageSources();
    const signature = signatureOf(usageSources.map(source => source.file));
    const cached = readCache();
    if (cached === signature && fs.existsSync(OUTPUT)) {
      console.log('[component-preview] 无变更，跳过生成');
      return;
    }
    const catalog = buildCatalog(usageSources);
    writeCatalog(catalog);
    writeCache(signature);
    console.log(`[component-preview] 已生成 ${catalog.length} 个组件条目 -> ${path.relative(ROOT, OUTPUT)}`);
  } catch (error) {
    console.error(
      `[component-preview] 生成失败，写入空清单: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    try {
      writeCatalog([]);
    } catch {
      // 连空清单都写不出时，保持上一次产物不动，避免破坏构建
    }
  }
}

/**
 * 检测组件是否依赖外层 Form：模板用了 FormItem 但自身没有 Form 包裹。
 * bkui-vue 的 FormItem 在无父 Form 时，labelStyles computed 会读 undefined.props 而崩溃；
 * 真实业务里组件都置于 Form 内，预览页单独渲染必须补一层。
 */
function needsFormContext(descriptor) {
  const template = descriptor.template?.content ?? '';
  const hasFormItem = /<Form\.FormItem\b/.test(template) || /<FormItem\b/.test(template);
  const hasFormRoot = /<Form(?=[\s>])/.test(template);
  return hasFormItem && !hasFormRoot;
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * 数组元素占位：函数类型（如 validator 回调数组）和无法解析的类型一律给空数组。
 * 若塞函数/空对象占位，消费方 flatMap(fn => fn(value)) 会把它当函数调用而崩溃。
 */
function resolveArrayItem(elementType, decls, depth) {
  const item = resolveTypeNode(elementType, decls, depth + 1);
  if (item === undefined || item === CONFIG.placeholders.fn) return [];
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
  if (!node || depth > CONFIG.maxDepth) return undefined;
  if (node.kind === ts.SyntaxKind.StringKeyword) return CONFIG.placeholders.string;
  if (node.kind === ts.SyntaxKind.NumberKeyword) return CONFIG.placeholders.number;
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return CONFIG.placeholders.boolean;
  if (node.kind === ts.SyntaxKind.NullKeyword) return CONFIG.placeholders.null;
  if (ts.isLiteralTypeNode(node)) {
    const literal = node.literal;
    if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal)) {
      return literal.text || CONFIG.placeholders.string;
    }
    if (ts.isNumericLiteral(literal)) return Number(literal.text) || CONFIG.placeholders.number;
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
  if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node)) return CONFIG.placeholders.fn;
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

function serialize(value, indent = 0) {
  if (value === CONFIG.placeholders.fn) return "() => ''";
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value);
  if (Array.isArray(value)) return `[${value.map(item => serialize(item, indent + 2)).join(', ')}]`;
  if (typeof value === 'object') {
    const pad = ' '.repeat(indent + 2);
    const closePad = ' '.repeat(indent);
    const entries = Object.entries(value).map(
      ([key, item]) => `${pad}${JSON.stringify(key)}: ${serialize(item, indent + 2)}`,
    );
    return entries.length ? `{\n${entries.join(',\n')}\n${closePad}}` : '{}';
  }
  return 'undefined';
}

/**
 * 生成缓存签名：脚本 mtime + 所有引用源 mtime。
 * 纳入引用源是为了让业务代码里新增/删除组件引用后能触发重生成。
 */
function signatureOf(files) {
  const scriptMtime = fs.statSync(fileURLToPath(import.meta.url)).mtimeMs;
  return `${scriptMtime}|${files.map(file => `${file}:${fs.statSync(file).mtimeMs}`).join('|')}`;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.vue')) out.push(full);
  }
  return out;
}

function writeCache(signature) {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(signature));
}

function writeCatalog(catalog) {
  const body = `/* 自动生成，请勿手动修改；来源 scripts/gen-component-preview.mjs */\n\nexport const componentCatalog = ${serialize(catalog)};\n`;
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, body);
}

main();
