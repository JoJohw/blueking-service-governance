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

/** 生成缓存：签名一致就跳过重算，避免每次 dev 启动都全量扫一遍 */

import fs from 'node:fs';
import path from 'node:path';

import { CACHE, MODULE_DIR } from './paths.mjs';

export function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * 生成缓存签名：生成器所有模块 + 所有引用源的 mtime。
 * 生成器拆成多模块后必须整体纳入，否则改了 config/ 或某个模块不会触发重生成；
 * 纳入引用源是为了让业务代码里新增/删除组件引用后能触发重生成。
 */
export function signatureOf(files) {
  const scriptMtimes = collectModuleFiles(MODULE_DIR).map(file => `${file}:${fs.statSync(file).mtimeMs}`);
  return [...scriptMtimes, ...files.map(file => `${file}:${fs.statSync(file).mtimeMs}`)].join('|');
}

export function writeCache(signature) {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(signature));
}

function collectModuleFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectModuleFiles(full, out);
    else if (entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}
