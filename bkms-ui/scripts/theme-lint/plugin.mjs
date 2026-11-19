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

/**
 * theme-lint/plugin —— 主题令牌漂移检查（聚合入口）
 *
 * 一个令牌维度一个模块，本文件只合并导出，eslint 配置里的 plugin 名保持 `theme` 不变：
 *   rules/color.mjs   颜色：no-hardcoded-color / no-default-palette / prefer-uno-class / no-foreign-var
 *   rules/radius.mjs  圆角：no-hardcoded-radius / prefer-radius-class / no-stacked-radius
 *
 * 覆盖范围：template / script / <style> 块 / 独立 .css（@eslint/css 提供 css language）。
 * 四路挂载与定位换算在 rules/shared.mjs；令牌反查真源在 map.mjs（与 uno.config.ts 同源）。
 *
 * 接入新维度：写 rules/<维度>.mjs 导出规则对象，再在这里合并——不要往聚合入口里堆规则。
 */
import colorRules from './rules/color.mjs';
import radiusRules from './rules/radius.mjs';

export { THEME_VAR_PREFIXES } from './var-prefix.mjs';

export default {
  meta: { name: 'theme' },
  rules: {
    ...colorRules,
    ...radiusRules,
  },
};
