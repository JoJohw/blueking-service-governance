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

/** 从 SFC 描述符里读结构信息：slot 清单、默认 slot 内容、显隐 prop、是否依赖外层 Form */

import ts from 'typescript';

/** 识别带默认内容的 slot（成对标签且内容非空），供预览页并排展示"原生版" */
export function extractFallbackSlots(descriptor) {
  const template = descriptor.template?.content ?? '';
  const result = [];
  // prettier 会把收尾标签折成 `</slot\n>`，所以闭合标签要允许尾随空白，否则这段 fallback 会被漏掉
  const tagRegex = /<slot\b([^>]*)>([\s\S]*?)<\/slot\s*>/g;
  for (const match of template.matchAll(tagRegex)) {
    if (!match[2].trim()) continue;
    const named = match[1].match(/\bname\s*=\s*["']([^"']+)["']/);
    result.push(named ? named[1] : 'default');
  }
  return [...new Set(result)];
}

/**
 * 识别「组件自带默认视觉」的 slot：模板里用 $slots.x 判断是否接管该区域。
 * 这类 slot 一旦传内容就会切到另一个分支，把组件自带的插画/图标顶掉
 * （如 table-exception 的 type：不传时 Exception 渲染空状态图，传了就只剩占位内容），
 * 预览真实态不能塞占位块。
 */
export function extractGuardedSlots(descriptor) {
  const template = descriptor.template?.content ?? '';
  const result = new Set();
  for (const match of template.matchAll(/\$slots\.(\w+)/g)) {
    result.add(match[1]);
  }
  return [...result];
}

/** 识别 slot：模板里的 <slot> 标签 + defineSlots<T>() 类型成员两处来源 */
export function extractSlots(descriptor) {
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

/**
 * Dialog/Sideslider 用 render-directive="if" 时，显隐 prop 为 false 则弹层 DOM 不生成，预览画布空白。
 * 从 is-show 绑定反查对应 prop：直接同名（visible）或经 computed/ref 映射（localValue = ref(props.modelValue)）。
 */
export function findVisibilityProp(descriptor) {
  const template = descriptor.template?.content ?? '';
  const binding = template.match(/<(?:Dialog|Sideslider)\b[^>]*?(?:v-model:is-show|:is-show|is-show)="([^"]+)"/s)?.[1];
  if (!binding) return null;
  const script = descriptor.scriptSetup?.content ?? '';
  const boundName = binding.trim().split(/[.[]/)[0];
  // defineModel 声明的 prop 名可能与变量名不同（如 visible = defineModel('isShow')），先映射回 prop 名
  const modelAlias = script.match(
    new RegExp(`(?:const|let)\\s+${boundName}\\s*=\\s*defineModel(?:\\s*<[^>]*>)?\\s*\\(\\s*['"]([\\w-]+)['"]`),
  )?.[1];
  if (modelAlias) return modelAlias;
  const traced = script.match(
    new RegExp(`(?:const|let)\\s+${boundName}\\s*=\\s*(?:ref|computed)\\s*\\(?[\\s\\S]{0,120}?props\\.(\\w+)`),
  );
  return traced ? traced[1] : boundName;
}

/**
 * 检测组件是否依赖外层 Form：模板用了 FormItem 但自身没有 Form 包裹。
 * bkui-vue 的 FormItem 在无父 Form 时，labelStyles computed 会读 undefined.props 而崩溃；
 * 真实业务里组件都置于 Form 内，预览页单独渲染必须补一层。
 */
export function needsFormContext(descriptor) {
  const template = descriptor.template?.content ?? '';
  const hasFormItem = /<Form\.FormItem\b/.test(template) || /<FormItem\b/.test(template);
  const hasFormRoot = /<Form(?=[\s>])/.test(template);
  return hasFormItem && !hasFormRoot;
}
