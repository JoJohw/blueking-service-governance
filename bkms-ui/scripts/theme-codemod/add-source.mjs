import fs from 'node:fs';
import path from 'node:path';

const PENDING_FILE = 'scripts/theme-codemod/pending-design.json';
const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));

const EXTS = new Set(['.vue', '.css', '.ts', '.js', '.scss', '.less', '.mjs', '.mts']);
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      if (n === 'node_modules' || n === 'dist' || n === '.git') continue;
      walk(p, out);
    } else if (EXTS.has(path.extname(n))) out.push(p);
  }
  return out;
}

const SCOPES = [
  { name: 'src(业务)', dir: 'src' },
  { name: 'bkui-vue/dist', dir: 'node_modules/bkui-vue/dist' },
  { name: 'bkui-vue/lib', dir: 'node_modules/bkui-vue/lib' },
  { name: '@blueking/date-picker', dir: 'node_modules/@blueking/date-picker' },
  { name: 'node_modules/highlight.js', dir: 'node_modules/highlight.js' },
  { name: 'uno.config.ts', files: ['uno.config.ts'] },
];

// 预读各 scope 文本
const scopeTexts = SCOPES.map(s => {
  const files = s.dir ? walk(s.dir) : s.files || [];
  let text = '';
  for (const f of files) text += fs.readFileSync(f, 'utf8');
  return { name: s.name, text };
});

const HEXRE = hex => new RegExp(`#${hex}(?![0-9a-f])`, 'gi');

const result = {};
const summary = {};
for (const [hex, entry] of Object.entries(pending)) {
  const hits = [];
  for (const s of scopeTexts) {
    const n = (s.text.match(HEXRE(hex)) || []).length;
    if (n > 0) hits.push(`${s.name} x${n}`);
  }
  const source = hits.length > 0 ? hits.join('；') : '无消费点';
  const e = { occ: entry.occ, source, suggest: entry.suggest, note: entry.note };
  result[hex] = e;
  const bucket = source.split('；')[0].replace(/ x\d+/, '');
  summary[bucket] = (summary[bucket] || 0) + 1;
}

fs.writeFileSync(PENDING_FILE, JSON.stringify(result, null, 2) + '\n');
console.log('== source 分布 ==');
for (const [k, v] of Object.entries(summary).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(3)}  ${k}`);
console.log('== 无消费点条目 ==');
for (const [hex, e] of Object.entries(result)) if (e.source === '无消费点') console.log(`#${hex}  (occ=${e.occ})`);
// JSON 合法性自检
JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
console.log('JSON 校验通过，条目数:', Object.keys(result).length);
