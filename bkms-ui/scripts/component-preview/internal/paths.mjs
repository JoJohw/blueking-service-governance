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

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 由本文件（scripts/component-preview/internal/）反推仓库根，脚本整体挪动时只改这一行 */
const MODULE_ROOT = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(MODULE_ROOT, '../../..');
export const SRC_DIR = path.join(ROOT, 'src');
export const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
/** 生成产物统一目录：目录内文件默认忽略，只有同名 d.ts（手工维护的类型声明）入库 */
export const GENERATED_DIR = path.join(SRC_DIR, 'pages/designer/generated');
export const OUTPUT = path.join(GENERATED_DIR, 'component-catalog.js');
export const API_MODULES_DIR = path.join(SRC_DIR, 'api/modules');
/** 接口 mock 样例产物：预览环境按 url 模板命中后返回，代替原先一律返回 [] */
export const API_MOCK_OUTPUT = path.join(GENERATED_DIR, 'api-mock.json');
export const CACHE = path.join(ROOT, 'node_modules/.cache/component-preview-cache.json');
/** 生成器目录（internal 的上一层）：缓存签名要覆盖 internal/ 与配置文件的 mtime */
export const MODULE_DIR = path.resolve(MODULE_ROOT, '..');
/** 写进产物头部注释的来源路径，排查清单来源时直接用 */
export const SCRIPT_NAME = 'scripts/component-preview/index.mjs';
