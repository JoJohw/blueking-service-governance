#!/usr/bin/env node
/** 提取 bkui style.variable.css 全部 :root 块内变量定义，输出 reports/root-vars.txt */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.resolve(__dirname, '../../../node_modules/bkui-vue/dist/style.variable.css'), 'utf8');

const vars = new Map();
const blockRe = /:root\s*\{([^}]*)\}/g;
for (const block of css.matchAll(blockRe)) {
  for (const d of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!vars.has(d[1])) vars.set(d[1], d[2].trim());
  }
}
const lines = [...vars.entries()].map(([k, v]) => `${k} = ${v}`);
const out = path.join(__dirname, '../reports/root-vars.txt');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log('root vars:', vars.size, '->', out);
