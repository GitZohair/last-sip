import { defineConfig } from 'vite';
import { resolve } from 'node:path';
// index.html = LAST SIP (new game). legacy.html + lab/ = Codex's first prototypes, kept for reference only.
export default defineConfig({ build: { rollupOptions: { input: { main: resolve('index.html'), legacy: resolve('legacy.html'), lab: resolve('lab/index.html') } } } });
