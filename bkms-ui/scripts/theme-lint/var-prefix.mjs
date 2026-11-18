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
 * 主题变量命名空间白名单：no-foreign-var / prefer-uno-class 的唯一填报点。
 * --bkms-viz- 已被 --bkms- 覆盖，双写是显式登记命名空间，不靠前缀包含关系隐式放行。
 * --vscode- 由 monaco 主题服务注入，编辑器自身配色不属于业务令牌体系，单独放行。
 * 独立叶子模块（零 import）：map.mjs 被 uno.config.ts 直接 import，反向 import plugin.mjs
 * 会构成 map → plugin → rules/color → map 环，并把整棵规则树拖进 unconfig 的打包执行路径。
 */
export const THEME_VAR_PREFIXES = ['--bkms-', '--bkms-viz-', '--vscode-'];
