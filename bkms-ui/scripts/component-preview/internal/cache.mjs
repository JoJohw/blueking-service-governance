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

/** 生成缓存：内容签名一致就跳过重算，避免每次 dev 启动都全量扫一遍 */

import crypto from 'node:crypto';
import fs from 'node:fs';

import { writeFileAtomic } from './atomic-write.mjs';
import { BASELINE, CACHE, MODULE_DIR } from './paths.mjs';

export function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * 生成缓存签名：生成器所有模块 + 所有引用源 + 基线的「内容 hash」。
 * 用内容而不是 mtime：CI checkout 会把 mtime 全部刷新（每次重算），而可复现构建
 * 又可能归一化 mtime（内容变了却跳过生成），两头都不可靠。
 * 文件路径本身也在签名里，所以新增/删除文件同样会触发重生成。
 */
export function signatureOf(files) {
  const tracked = [...collectModuleFiles(MODULE_DIR), ...(fs.existsSync(BASELINE) ? [BASELINE] : []), ...files];
  return tracked.map(file => `${file}:${contentHash(file)}`).join('|');
}

export function writeCache(signature) {
  writeFileAtomic(CACHE, JSON.stringify(signature));
}

function contentHash(file) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
  } catch {
    return 'missing';
  }
}

function collectModuleFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) collectModuleFiles(full, out);
    else if (entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}
