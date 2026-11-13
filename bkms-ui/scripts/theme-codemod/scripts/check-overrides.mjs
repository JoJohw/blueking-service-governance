/**
 * 覆写漂移自检：校验 patches/bkui-theme/ 的每条覆写在当前 bkui 产物中仍有效。
 *
 * 校验两点（任一失效即报错，exit 1）：
 *   1. 选择器存在性：去掉 `.bkms-themed ` 前缀后的选择器仍在 dist css 中
 *   2. 原值一致性：覆写声明引用的原 hex（行尾注释或占位值）仍在 dist 对应规则的值里
 *
 * 库升级后必跑；可在 dev 启动或 CI 挂载。
 * 用法：node scripts/theme-codemod/scripts/check-overrides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DIST_FILE = path.join(ROOT, 'node_modules/bkui-vue/dist/style.variable.css');
const LITERAL_DIST_FILE = path.join(ROOT, 'node_modules/bkui-vue/dist/style.css');
const PATCHES_DIR = path.join(ROOT, 'src/styles/theme/patches/bkui-theme');

const HEX_RE = /#[0-9a-f]{3,8}\b/gi;
const SCOPE = '.bkms-themed ';

// dist 索引：归一化选择器 -> body 集合（同名选择器可能出现在多处）；字面量源单独建索引
function buildDistIndex(file) {
  const rules = [];
  collectBlocks(fs.readFileSync(file, 'utf8'), null, rules);
  const index = new Map();
  for (const r of rules) {
    // 3 位短写展开成 6 位，与覆写侧注释/值中的归一化 hex 对齐
    const body = r.body.toLowerCase().replace(/#([0-9a-f]{3})(?![0-9a-f])/g, '#$1$1');
    if (!index.has(r.selector)) index.set(r.selector, []);
    index.get(r.selector).push(body);
  }
  return index;
}

/** 与 gen-overrides 相同的块解析（@media 展开、keyframes 跳过） */
function collectBlocks(text, media, out) {
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
const distIndex = buildDistIndex(DIST_FILE);
const literalDistIndex = buildDistIndex(LITERAL_DIST_FILE);

// 扫描 patches：每组件文件含两段——标记行之前为变量版段（对 style.variable.css 校验），
// 之后为字面量段（对 dist/style.css 校验）；标记串与 gen-overrides.mjs 须同步
const LITERAL_SECTION_MARKER = '/* 字面量版源：dist/style.css';

const patchFiles = fs.existsSync(PATCHES_DIR) ? fs.readdirSync(PATCHES_DIR).filter(f => f.endsWith('.css')) : [];
let checked = 0;
const failures = [];

function checkRules(rules, index, file, label) {
  for (const rule of rules) {
    // 首条规则的 prelude 混有文件头/段标记注释（解析器取"上一个 } 到 {"的文本），先剥注释再判定
    const selector = rule.selector
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!selector.startsWith(SCOPE)) continue; // 全局无包裹段不在本脚本职责内
    checked++;
    const originSelector = selector.slice(SCOPE.length).trim();
    const bodies = index.get(originSelector);
    if (!bodies) {
      failures.push({ file: label + file, selector: rule.selector, reason: '选择器已不在 bkui 产物中（库升级漂移）' });
      continue;
    }
    // 原值来源：声明值中的 hex（占位）+ 注释中的 hex（已确认替换）；3 位短写展开成 6 位再比对
    const text = rule.body.toLowerCase();
    const refs = new Set(
      [...text.matchAll(HEX_RE)].map(m => {
        const h = m[0].slice(1).toLowerCase();
        return h.length === 3
          ? h
              .split('')
              .map(c => c + c)
              .join('')
          : h;
      }),
    );
    for (const ref of refs) {
      const ok = bodies.some(b => b.includes(`#${ref}`));
      if (!ok) {
        failures.push({
          file: label + file,
          selector: rule.selector,
          reason: `原值 #${ref} 已不在产物规则中（产物值可能已变化）`,
        });
      }
    }
  }
}

for (const file of patchFiles) {
  const text = fs.readFileSync(path.join(PATCHES_DIR, file), 'utf8');
  const markerIdx = text.indexOf(LITERAL_SECTION_MARKER);
  const varText = markerIdx === -1 ? text : text.slice(0, markerIdx);
  const varRules = [];
  collectBlocks(varText, null, varRules);
  checkRules(varRules, distIndex, file, '');
  if (markerIdx !== -1) {
    const litRules = [];
    collectBlocks(text.slice(markerIdx), null, litRules);
    checkRules(litRules, literalDistIndex, file, '[literal] ');
  }
}

if (failures.length > 0) {
  console.error(`[check-overrides] ${failures.length}/${checked} 条覆写失效：`);
  for (const f of failures) console.error(`  - ${f.file}  ${f.reason}\n    ${f.selector}`);
  process.exit(1);
}
console.log(`[check-overrides] OK — ${checked} 条覆写全部有效（${patchFiles.length} 个文件）`);
