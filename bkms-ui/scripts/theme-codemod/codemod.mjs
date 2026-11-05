#!/usr/bin/env node
/**
 * theme codemod：业务侧 hex → var(--bkms-*)
 * 数据源：mapping.json（spec 颜色映射）/ keep.json（不替换清单）/ pending-design.json（待设计确认）
 *
 * 用法：
 *   node codemod.mjs bkui   扫描 bkui dist style.variable.css，输出未覆盖色清单（供 pending-design）
 *   node codemod.mjs scan   只扫 src/**，输出报告，不写文件
 *   node codemod.mjs apply [dir]  扫指定目录（默认 src/**）并写回替换
 *
 * 口径（docs/theme-style/THEME-v4.md 第四节）：
 * - 先小写化再匹配；仅 6 位 hex（词边界），8 位 hex（带 alpha）整体跳过
 * - 3 位短写先展开成 6 位，仅当命中 mapping 才替换，命中 keep 或未命中一律不动
 * - rgba( 不进脚本
 * - 报告同时输出「色值种类数」与「出现处数」两列
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MAPPING = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapping.json'), 'utf8'));
const KEEP = JSON.parse(fs.readFileSync(path.join(__dirname, 'keep.json'), 'utf8'));
const PENDING_FILE = path.join(__dirname, 'pending-design.json');
const PENDING = fs.existsSync(PENDING_FILE) ? JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')) : {};

const mode = process.argv[2] || 'scan';
const targetArg = process.argv[3] || 'src';
const HEX6 = /#([0-9a-f]{6})(?![0-9a-f])/gi;
const HEX3 = /#([0-9a-f]{3})(?![0-9a-f])/gi;
const HEX8 = /#([0-9a-f]{8})(?![0-9a-f])/gi;
const EXTS = new Set(['.vue', '.css', '.ts', '.js', '.scss', '.less']);
const TOKEN_FILES = ['colors.css', 'semantic.css'].map(name => path.join(ROOT, 'src/theme', name));

function applyReplacements() {
  const files = sourceFiles();
  let changed = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let next = text;
    const doMap = (m, hex6) => {
      const normalizedHex = hex6.toLowerCase();
      const cls = classify(normalizedHex);
      if (cls !== 'mapping') return m;
      return `var(${MAPPING[normalizedHex]})`;
    };
    next = next.replace(HEX6, doMap);
    next = next.replace(HEX3, (m, h3) => {
      const expanded = (h3[0] + h3[0] + h3[1] + h3[1] + h3[2] + h3[2]).toLowerCase();
      return doMap(m, expanded);
    });
    if (next !== text) {
      fs.writeFileSync(file, next, 'utf8');
      changed += 1;
    }
  }
  console.log(`apply: ${changed} files changed`);
}

// 命中分类：mapping / keep / pending / unknown
function classify(hex6) {
  if (MAPPING[hex6]) return 'mapping';
  if (KEEP[hex6]) return 'keep';
  if (PENDING[hex6]) return 'pending';
  return 'unknown';
}

function report({ total, perFile, distinct, occurrences: _occurrences, hex8Count }) {
  const byCls = { mapping: [], keep: [], pending: [], unknown: [] };
  let kindTotal = 0;
  let occTotal = 0;
  for (const [hex, { count, cls }] of [...distinct.entries()].sort()) {
    kindTotal += 1;
    occTotal += count;
    byCls[cls].push(`${hex}  x${count}`);
  }
  console.log(
    `扫描文件数: ${total}；6 位 hex 色值种类: ${kindTotal}；出现处数: ${occTotal}；8 位 hex 处数(整体跳过): ${hex8Count}`,
  );
  for (const cls of ['mapping', 'keep', 'pending', 'unknown']) {
    console.log(`\n== ${cls}（种类 ${byCls[cls].length}）==\n${byCls[cls].join('\n') || '(无)'}`);
  }
  console.log(`\n== 命中文件（前 50 / 共 ${perFile.length}）==`);
  for (const { file, hits } of perFile.slice(0, 50)) console.log(`${file}  x${hits}`);
  if (byCls.unknown.length > 0) {
    console.log('\n[!] 存在 unknown 色值：未命中 → 补 spec → 补 mapping.json → 重跑；禁止现场造 token。');
    process.exitCode = 2;
  }
}

function scanBkui() {
  const file = path.join(ROOT, 'node_modules/bkui-vue/dist/style.variable.css');
  const text = fs.readFileSync(file, 'utf8');
  const distinct = new Map();
  for (const m of text.matchAll(HEX6)) {
    const hex = m[1].toLowerCase();
    const cls = classify(hex);
    const entry = distinct.get(hex) || { count: 0, cls };
    entry.count += 1;
    distinct.set(hex, entry);
  }
  const covered = [];
  const uncovered = [];
  for (const [hex, { count, cls }] of [...distinct.entries()].sort()) {
    (cls === 'unknown' ? uncovered : covered).push(`${hex}  x${count}  [${cls}]`);
  }
  console.log(`bkui style.variable.css 色值种类: ${distinct.size}`);
  console.log(`\n== 已覆盖（mapping/keep/pending）==\n${covered.join('\n')}`);
  console.log(`\n== 全新未记录（uncovered，需补 spec/pending-design）==\n${uncovered.join('\n')}`);
}

function scanSource() {
  const files = sourceFiles();
  const perFile = [];
  const distinct = new Map(); // hex6 -> { count, classify }
  let occurrences = 0;
  let hex8Count = 0;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file).replaceAll('\\', '/');
    let fileHits = 0;

    for (const m of text.matchAll(HEX6)) {
      const hex = m[1].toLowerCase();
      const cls = classify(hex);
      const entry = distinct.get(hex) || { count: 0, cls };
      entry.count += 1;
      distinct.set(hex, entry);
      fileHits += 1;
    }
    for (const m of text.matchAll(HEX3)) {
      const hex = m[1].toLowerCase();
      const expanded = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      const cls = classify(expanded);
      // 3 位短写仅命中 mapping 才计为可替换，keep/unknown 均不动
      if (cls !== 'mapping') continue;
      const entry = distinct.get(expanded) || { count: 0, cls };
      entry.count += 1;
      distinct.set(expanded, entry);
      fileHits += 1;
    }
    hex8Count += [...text.matchAll(HEX8)].length;
    occurrences += fileHits;
    if (fileHits > 0) perFile.push({ file: rel, hits: fileHits });
  }
  return { total: files.length, perFile, distinct, occurrences, hex8Count };
}

function sourceFiles(target = targetArg) {
  const targetPath = path.resolve(ROOT, target);
  return walk(targetPath).filter(file => !TOKEN_FILES.includes(path.resolve(file)));
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXTS.has(path.extname(name))) files.push(full);
  }
  return files;
}

if (mode === 'bkui') scanBkui();
else if (mode === 'apply') applyReplacements();
else report(scanSource());
