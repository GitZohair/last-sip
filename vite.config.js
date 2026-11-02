import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
// Dev only: POST /__film/<clip>/<file> saves a rendered frame (or shot log) to film/<clip>/<file>,
// so ?film can record frame-perfect 1080p clips that ffmpeg turns into video. Not part of the build.
const filmSink = () => ({
  name: 'film-sink', apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__film/', (req, res) => {
      const m = /^\/([a-z0-9_-]{1,40})\/([a-z0-9_.-]{1,60})$/i.exec(req.url || '');
      if (req.method !== 'POST' || !m || m[2].includes('..')) { res.statusCode = 400; return res.end(); }
      const out = resolve('film', m[1], m[2]), chunks = [];
      req.on('data', c => chunks.push(c)); req.on('end', () => { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, Buffer.concat(chunks)); res.end('ok'); });
    });
  },
});
// index.html = LAST SIP (new game). legacy.html + lab/ = Codex's first prototypes, kept for reference only.
export default defineConfig({ plugins: [filmSink()], server: { watch: { ignored: ['**/film/**', '**/video/**', '**/screenshots/**', '**/.asset-sources/**', '**/output/**'] } }, build: { rollupOptions: { input: { main: resolve('index.html'), legacy: resolve('legacy.html'), lab: resolve('lab/index.html') } } } });
