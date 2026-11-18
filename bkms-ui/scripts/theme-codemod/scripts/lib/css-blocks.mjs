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

/**
 * CSS 文本解析工具：gen-overrides.mjs 与 check-overrides.mjs 共用。
 * 两侧对选择器拆分与块解析的口径必须一致，否则产物与自检会各说各话，故抽到同一处。
 */

/** 解析 css 文本为扁平规则列表（展开 @media / @supports / @layer 嵌套；keyframes、font-face、charset 跳过） */
export function collectBlocks(text, media, out) {
  let pos = 0;
  while (pos < text.length) {
    const open = text.indexOf('{', pos);
    if (open === -1) break;
    const prelude = text.slice(pos, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      const ch = text[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      j++;
    }
    const body = text.slice(open + 1, j - 1);
    pos = j;
    if (prelude.startsWith('@')) {
      const at = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
      if (at === 'media' || at === 'supports' || at === 'layer') {
        collectBlocks(body, at === 'media' ? prelude.replace(/\s+/g, ' ') : media, out);
      }
      continue;
    }
    out.push({ selector: prelude.replace(/\s+/g, ' '), body, media });
  }
}

/** 逗号分隔的选择器列表拆分：跳过 :is()/:not() 与属性值内的逗号 */
export function splitSelectorList(selector) {
  const parts = [];
  let cur = '';
  let depth = 0;
  let quote = '';
  for (const ch of selector) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
