/**
 * postcss 插件：对 bkui-vue/dist 下流经 Vite CSS 管线的样式做编译期 hex → var(--bkms-*) 替换。
 * 规则（docs/THEME_STEPS-v4.md Step 2）：
 * - 匹配 node_modules/bkui-vue 下所有样式（dist 的 css + lib 各组件 less，含 pnpm 多版本副本）；磁盘 node_modules 不动
 * - 先小写化再匹配，仅 6 位 hex（词边界），不碰 3 位短写与 rgba()；8 位 hex 因词边界天然不命中
 * - 跳过 prop 以 -- 开头的 declaration（变量定义值归 bridge.css）
 * - 命中 mapping → var(--bkms-*)；命中 keep → 原样；未命中（含 pending）→ 不改并输出未命中清单，禁止静默跳过
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const mapping = readJson('mapping.json');
const keep = readJson('keep.json');
const pending = readJson('pending-design.json');

const HEX6 = /#[0-9a-f]{6}\b/gi;
const reported = new Set();

export default function bkmsThemeReplace() {
  return {
    postcssPlugin: 'bkms-theme-replace',
    Declaration(decl) {
      if (decl.prop.startsWith('--')) return;
      const file = (decl.source?.input?.file || '').replaceAll('\\', '/');
      // bkui 色值除 dist 的 css 外还随组件 JS 引入 lib 各组件 less（含 pnpm 多版本副本），须一并覆盖；
      // @blueking/date-picker 为独立日期组件包，选择器同为 .bk- 前缀，经确认纳入同一份 mapping
      if (!/node_modules\/(bkui-vue|@blueking\/date-picker)\//i.test(file)) return;

      const before = decl.value;
      const after = before.replace(HEX6, m => {
        const hex = m.slice(1).toLowerCase();
        if (keep[hex]) return m;
        if (mapping[hex]) return `var(${mapping[hex]})`;
        // 未命中（含 pending-design）：不替换，进未命中清单
        if (!reported.has(hex)) {
          reported.add(hex);
          const tag = pending[hex] ? 'pending 待设计' : 'unknown 未记录';
          console.warn(`[bkms-theme-replace] 未命中色值 ${hex} [${tag}]（${file}）`);
        }
        return m;
      });
      if (after !== before) decl.value = after;
    },
  };
}
