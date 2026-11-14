#!/usr/bin/env node
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

/** 提取 bkui style.variable.css 全部 :root 块内变量定义，输出 reports/root-vars.txt */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.resolve(__dirname, '../../../node_modules/bkui-vue/dist/style.variable.css'), 'utf8');

const vars = new Map();
const blockRe = /:root\s*\{([^}]*)\}/g;
for (const block of css.matchAll(blockRe)) {
  for (const d of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!vars.has(d[1])) vars.set(d[1], d[2].trim());
  }
}
const lines = [...vars.entries()].map(([k, v]) => `${k} = ${v}`);
const out = path.join(__dirname, '../reports/root-vars.txt');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log('root vars:', vars.size, '->', out);
