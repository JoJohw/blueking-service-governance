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
 * bkui Exception 全部类型插图（403/404/500/building/empty/search-empty/login）
 * MagicBox 灰阶 → Figma Soft 3D Brand（Brand/4–6 为主）。
 *
 * Dev 预构建走 esbuild，Vite transform 打不到 `.vite/deps/bkui-vue.js`，
 * 因此同时挂 esbuild onLoad + Vite transform（源码 / 生产打包）。
 */

import fs from 'node:fs';
import path from 'node:path';

/** Soft 3D Brand：偏 Brand 蓝，避免大面积落在 Neutral 近白看不出变化 */
const SOFT_SCALE = [
  { minL: 0.99, hex: '#FFFFFF' },
  { minL: 0.97, hex: '#FBFCFE' }, // Neutral/9 高光
  { minL: 0.94, hex: '#E5EDFF' }, // Brand/6
  { minL: 0.9, hex: '#E5EDFF' }, // Brand/6
  { minL: 0.84, hex: '#C7D8FF' }, // Brand/5
  { minL: 0.76, hex: '#C7D8FF' }, // Brand/5
  { minL: 0.64, hex: '#99B9FF' }, // Brand/4
  { minL: 0.5, hex: '#99B9FF' }, // Brand/4
  { minL: 0.35, hex: '#8F9FBD' }, // Neutral/3
  { minL: 0.0, hex: '#4A5973' }, // Text/2
];

const DATA_URI_RE = /data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g;
const HEX_RE = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
const MAGICBOX_IN_SVG = /#C4C6CC|#979BA5|#DCDEE0|#DCDEE5|#E6E8EB/i;

/** @param {string} hex */
function parseRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) {
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  }
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

/** @param {{r:number,g:number,b:number}} rgb */
function isNearGray({ r, g, b }) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread <= 28;
}

/** @param {{r:number,g:number,b:number}} rgb */
function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** @param {number} L */
function mapLuminance(L) {
  for (const stop of SOFT_SCALE) {
    if (L >= stop.minL) {
      return stop.hex;
    }
  }
  return SOFT_SCALE[SOFT_SCALE.length - 1].hex;
}

/** @param {string} svg */
function recolorSvg(svg) {
  let changed = false;
  const next = svg.replace(HEX_RE, match => {
    const rgb = parseRgb(match);
    if (!isNearGray(rgb)) {
      return match;
    }
    if (rgb.r >= 252 && rgb.g >= 252 && rgb.b >= 252) {
      return '#FFFFFF';
    }
    const mapped = mapLuminance(luminance(rgb));
    if (mapped.toUpperCase() !== match.toUpperCase()) {
      changed = true;
    }
    return mapped;
  });
  return { svg: next, changed };
}

/**
 * base64 流里 MagicBox 灰阶的常见片段（对齐敏感，多写几个）：
 * C4C6CC / #C4C6CC / 979BA5 / DCDEE0 / DCDEE5
 */
const MAGICBOX_IN_B64 = /QzRDNkND|I0M0QzZDQw|OTc5QkE1|RENERUUw|RENERUU1|Izk3OUJBNQ/;

/** @param {string} code */
export function recolorCode(code) {
  // 大 deps chunk 里大量无关 SVG；无 MagicBox 特征则整文件跳过
  if (!MAGICBOX_IN_B64.test(code) && !/#C4C6CC|#979BA5/i.test(code)) {
    return null;
  }
  let touched = false;
  const next = code.replace(DATA_URI_RE, (full, b64) => {
    if (!MAGICBOX_IN_B64.test(b64)) {
      return full;
    }
    let raw;
    try {
      raw = Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return full;
    }
    if (!raw.includes('<svg') && !raw.includes('<SVG')) {
      return full;
    }
    if (!MAGICBOX_IN_SVG.test(raw)) {
      return full;
    }
    const { svg, changed } = recolorSvg(raw);
    if (!changed) {
      return full;
    }
    touched = true;
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  });
  return touched ? next : null;
}

/** @param {string} id */
function shouldTouchModule(id) {
  const normalized = id.replace(/\\/g, '/');
  if (normalized.includes('vite-plugin-exception-recolor')) {
    return false;
  }
  if (!normalized.includes('bkui-vue')) {
    return false;
  }
  return (
    normalized.includes('/exception/') ||
    /\/(?:lib|es|dist)\/index\.(?:js|mjs|cjs)$/.test(normalized) ||
    normalized.includes('.vite/deps/')
  );
}

/** @param {string} depsDir */
function patchDepsDir(depsDir) {
  if (!fs.existsSync(depsDir)) {
    return 0;
  }
  let patched = 0;
  for (const name of fs.readdirSync(depsDir)) {
    if (!name.endsWith('.js')) {
      continue;
    }
    const file = path.join(depsDir, name);
    let source;
    try {
      source = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!source.includes('data:image/svg+xml;base64,')) {
      continue;
    }
    const next = recolorCode(source);
    if (next) {
      fs.writeFileSync(file, next);
      patched += 1;
    }
  }
  return patched;
}

/** esbuild：预构建读到 bkui-vue 源文件时换色（含 exception 与被内联的模块） */
function createEsbuildRecolorPlugin() {
  return {
    name: 'bkms-exception-recolor-esbuild',
    setup(build) {
      build.onLoad({ filter: /node_modules[/\\]bkui-vue[/\\].*\.js$/ }, async args => {
        const source = await fs.promises.readFile(args.path, 'utf8');
        if (!source.includes('data:image/svg+xml;base64,')) {
          return null;
        }
        const next = recolorCode(source);
        if (!next) {
          return null;
        }
        return { contents: next, loader: 'js' };
      });
    },
  };
}

/**
 * @returns {import('vite').Plugin}
 */
export default function exceptionRecolorPlugin() {
  /** @type {string} */
  let depsDir = '';

  return {
    name: 'bkms-exception-recolor',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [createEsbuildRecolorPlugin()],
          },
        },
      };
    },
    configResolved(config) {
      depsDir = path.join(config.cacheDir || path.join(config.root, 'node_modules/.vite'), 'deps');
      patchDepsDir(depsDir);
    },
    transform(code, id) {
      // 源码 exception、整包、以及任意已含 MagicBox Exception SVG 的模块 / chunk
      const normalized = id.replace(/\\/g, '/');
      const maybe =
        shouldTouchModule(id) ||
        (normalized.includes('.vite/deps/') && code.includes('data:image/svg+xml;base64,'));
      if (!maybe) {
        return;
      }
      if (!code.includes('data:image/svg+xml;base64,')) {
        return;
      }
      const next = recolorCode(code);
      if (!next) {
        return;
      }
      return { code: next, map: null };
    },
    configureServer(server) {
      const runPatch = () => {
        const n = patchDepsDir(depsDir);
        if (n > 0) {
          server.config.logger.info(`[bkms-exception-recolor] patched ${n} dep file(s)`);
        }
      };
      // 预构建完成后再扫一遍 chunk（SVG 常被打进 chunk-*.js）
      server.httpServer?.once('listening', () => {
        runPatch();
        // optimizeDeps 可能稍晚完成
        setTimeout(runPatch, 2000);
        setTimeout(runPatch, 6000);
      });
    },
  };
}
