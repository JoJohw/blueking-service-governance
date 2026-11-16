import Vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  plugins: [Vue()],
  server: {
    port: 5300,
    fs: { allow: [path.resolve(dir, '../..')] },
  },
  build: {
    outDir: path.resolve(dir, 'dist'),
    emptyOutDir: true,
  },
});
