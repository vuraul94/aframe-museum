/**
 * Zero-dependency development server for the A-Frame Museum.
 *
 *  - Serves /public as a static site.
 *  - /vendor/*: disk-cached proxy for third-party libraries (A-Frame,
 *    A-Frame Inspector and the A-Frame CDN: MSDF fonts and controller
 *    models). The first request downloads the file; later ones are served
 *    from ./vendor, so the demo works offline during the talk.
 *  - Optional HTTPS (required for WebXR AR from a phone on the local network):
 *    enabled automatically if certs/key.pem and certs/cert.pem exist
 *    (generate them with `npm run cert`).
 *  - Inspector save service on localhost:51234 (see inspector-save.js):
 *    the Inspector's "Write changes" button saves edits to public/index.html and public/rooms/*.html.
 *    Disable it with SAVE=0.
 *
 * Usage: npm start            → http(s)://localhost:8080
 *       PORT=3000 npm start
 */
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVendor, fetchToCache } from './vendor.js';
import { startInspectorSave } from './inspector-save.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CERT_DIR = path.join(ROOT, 'certs');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.fnt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};
const mimeOf = file => MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';

/**
 * Sends a file. Supports a single `Range: bytes=a-b` request, which <video>
 * uses to seek and loop.
 */
async function sendFile(req, res, file, { cache = 'no-cache' } = {}) {
  res.statusCode = 200; // for the log; 206 below for ranges
  const { size } = await fsp.stat(file);
  const headers = { 'Content-Type': mimeOf(file), 'Cache-Control': cache, 'Accept-Ranges': 'bytes' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    start = Math.max(0, start);
    if (start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      return res.end();
    }
    res.statusCode = 206;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'Content-Length': size });
  fs.createReadStream(file).pipe(res);
}

function sendError(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(msg);
}

async function handler(req, res) {
  const started = Date.now();
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return sendError(res, 400, 'Invalid URL');
  }

  try {
    // 1) Third-party libraries (proxy + cache)
    if (pathname.startsWith('/vendor/')) {
      const v = resolveVendor(pathname);
      if (!v) return sendError(res, 404, 'Unknown vendor resource');
      const file = await fetchToCache(v);
      await sendFile(req, res, file, { cache: 'public, max-age=86400' });
      return log(req, res.statusCode, started, '(vendor)');
    }

    // 2) Static files from /public (protected against path traversal)
    let file = path.normalize(path.join(PUBLIC_DIR, pathname));
    if (!file.startsWith(PUBLIC_DIR)) return sendError(res, 403, 'Forbidden');
    const stat = await fsp.stat(file).catch(() => null);
    if (stat && stat.isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { log(req, 404, started); return sendError(res, 404, 'Not found'); }
    await sendFile(req, res, file);
    log(req, res.statusCode, started);
  } catch (err) {
    console.error(`  ✖ ${pathname}: ${err.message}`);
    if (!res.headersSent) sendError(res, 502, `Error: ${err.message}`);
  }
}

function log(req, code, started, extra = '') {
  if (process.env.QUIET) return;
  console.log(`  ${code} ${req.method} ${req.url} ${Date.now() - started}ms ${extra}`);
}

function lanAddresses() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

const keyFile = path.join(CERT_DIR, 'key.pem');
const certFile = path.join(CERT_DIR, 'cert.pem');
const useHttps = fs.existsSync(keyFile) && fs.existsSync(certFile) && process.env.HTTP !== '1';

const server = useHttps
  ? https.createServer({ key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }, handler)
  : http.createServer(handler);

server.listen(PORT, HOST, () => {
  const proto = useHttps ? 'https' : 'http';
  console.log('\n  🏛  A-Frame Museum ready\n');
  console.log(`  Local:   ${proto}://localhost:${PORT}`);
  for (const ip of lanAddresses()) console.log(`  Network: ${proto}://${ip}:${PORT}`);
  if (!useHttps) {
    console.log('\n  ℹ  WebXR on other devices on the network requires HTTPS → run `npm run cert` and restart.');
  }
  console.log('  ℹ  Preload libraries for offline use: `npm run vendor`\n');
});

if (process.env.SAVE !== '0') startInspectorSave({ publicDir: PUBLIC_DIR });
