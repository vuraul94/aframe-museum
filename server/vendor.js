/**
 * Map of third-party libraries served under /vendor/, plus the disk cache.
 * Change the versions here to upgrade A-Frame or the Inspector.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const AFRAME_VERSION = '1.7.1';
export const INSPECTOR_VERSION = '1.7.0';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VENDOR_DIR = path.join(ROOT, 'vendor');

/**
 * Files with a fixed name. Besides the libraries, the two external
 * (non-native) assets of the museum, both free to use:
 *  - Fox.glb: Khronos glTF Sample Assets. Model by PixelMannen (CC0), rigging and
 *    animation by tomkranis (CC BY 4.0), glTF conversion by AsoboStudio & scurest (CC BY 4.0).
 *  - Big Buck Bunny trailer: (c) 2008 Blender Foundation, peach.blender.org (CC BY 3.0).
 */
export const FILES = {
  '/vendor/aframe.min.js': `https://aframe.io/releases/${AFRAME_VERSION}/aframe.min.js`,
  '/vendor/aframe-inspector.min.js': `https://cdn.jsdelivr.net/npm/aframe-inspector@${INSPECTOR_VERSION}/dist/aframe-inspector.min.js`,
  '/vendor/models/fox.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
  '/vendor/media/big-buck-bunny-trailer.m4v': 'https://download.blender.org/peach/trailer/trailer_iphone.m4v',
  // Fallback for browsers without H.264 (e.g. some Linux builds): VP9 transcode from Wikimedia Commons
  '/vendor/media/big-buck-bunny-trailer.webm': 'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b3/Big_Buck_Bunny_Trailer_400p.ogv/Big_Buck_Bunny_Trailer_400p.ogv.240p.vp9.webm'
};

/** Prefix that replaces https://cdn.aframe.io/ (see window.AFRAME_CDN_ROOT in index.html) */
const CDN_PREFIX = '/vendor/cdn/';
const CDN_ORIGIN = 'https://cdn.aframe.io/';

const SAFE = /^[A-Za-z0-9._\-/]+$/;

/** Returns { url, file } for a /vendor/... path, or null if it is not allowed */
export function resolveVendor(pathname) {
  if (FILES[pathname]) {
    return { url: FILES[pathname], file: path.join(VENDOR_DIR, pathname.slice('/vendor/'.length)) };
  }
  if (pathname.startsWith(CDN_PREFIX)) {
    const rel = pathname.slice(CDN_PREFIX.length);
    if (!rel || !SAFE.test(rel) || rel.includes('..')) return null;
    return { url: CDN_ORIGIN + rel, file: path.join(VENDOR_DIR, 'cdn', rel) };
  }
  return null;
}

const inflight = new Map();

/** Downloads (only once) and returns the cached local path */
export async function fetchToCache({ url, file }) {
  if (fs.existsSync(file)) return file;
  if (inflight.has(file)) return inflight.get(file);
  const job = (async () => {
    console.log(`  ↓ downloading ${url}`);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} while downloading ${url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file + '.tmp', buf);
    await fsp.rename(file + '.tmp', file);
    return file;
  })().finally(() => inflight.delete(file));
  inflight.set(file, job);
  return job;
}
