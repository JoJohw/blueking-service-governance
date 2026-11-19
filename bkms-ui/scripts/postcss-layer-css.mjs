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

import postcss from 'postcss';

/**
 * 按来源文件把样式包进 @layer，层序由 index.html 的
 * `@layer bkms-boost, bkms-reset, bkms-vendor, bkms-patches;` 声明（普通声明：低 → 高）：
 *
 *   bkms-boost < bkms-reset < bkms-vendor < bkms-patches < 未分层样式（uno 工具类）
 *
 * !important 段的反序：越靠前的层越强，故 bkms-boost 在普通声明上最弱、在 !important 上最强，
 * 只用于收录「必须压过组件库 !important」的声明（见 patches/boost.css）。
 * 覆写层因此仍压得住组件库原厂样式，业务侧工具类则不再需要 `!` 前缀。
 * 层名带 bkms- 前缀：层是同名即合并，避免与第三方库自带的 @layer 撞名。
 *
 * 按节点来源分组而不是只看 root 来源：dev 下每个 CSS 文件独立过 postcss，
 * build 下 @import 已被内联进同一个 root，两种形态都要覆盖。
 */

// 顺序有语义：先命中先生效，@unocss/reset 必须排在 node_modules 之前，否则会被归进 bkms-vendor。
// 不加 $ 锚定：Vite 传进来的 id 可能带 query（如 ?v=1），锚定会让 boost 静默降级进 bkms-patches
const RULES = [
  { layer: 'bkms-boost', test: /[\\/]patches[\\/]boost\.css/ },
  { layer: 'bkms-reset', test: /[\\/]@unocss[\\/]reset[\\/]/ },
  { layer: 'bkms-vendor', test: /[\\/]node_modules[\\/]/ },
  { layer: 'bkms-patches', test: /[\\/]src[\\/]styles[\\/]theme[\\/]patches[\\/]/ },
];

const normalizePath = file => String(file || '').replaceAll('\\', '/');

// 匹配不到即保持无层：uno 工具类、main.css、overrides.css 都走这条路，是有意为之
const pickLayer = file => RULES.find(rule => rule.test.test(normalizePath(file)))?.layer;

export default function layerCss() {
  return {
    postcssPlugin: 'bkms-layer-css',
    OnceExit(root, { result }) {
      const fallback = result.opts.from;
      const groups = [];

      for (const node of [...root.nodes]) {
        // @charset / @import 必须留在最前，进层会失效
        if (node.type === 'atrule' && ['charset', 'import'].includes(node.name)) continue;

        const file = node.source?.input?.file ?? fallback;
        const last = groups.at(-1);
        if (last && last.file === file) last.nodes.push(node);
        else groups.push({ file, nodes: [node] });
      }

      for (const group of groups) {
        const layer = pickLayer(group.file);
        if (!layer) continue;

        const wrapper = postcss.atRule({ name: 'layer', params: layer });
        group.nodes[0].before(wrapper);
        wrapper.append(...group.nodes);
        wrapper.raws.after = '\n';
      }
    },
  };
}
