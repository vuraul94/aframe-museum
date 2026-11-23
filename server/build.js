/**
 * `npm run build` — static version for GitHub Pages (or any static host).
 *
 * Pages cannot run server.js, so this copies public/ and the vendor cache
 * (A-Frame, Inspector, fonts, fox model, videos: downloaded first if missing)
 * into ./dist. All paths in the app are relative, so it works under
 * https://<user>.github.io/<repo>/.
 *
 * What changes on a static host:
 *  - no Inspector save service ("Write changes" reports aframe-watcher is not running);
 *  - fonts and controller models load from cdn.aframe.io instead of the local cache;
 *  - resolution is adaptive (dynamic-resolution, min 0.75), while locally it is fixed at 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

await import('./prefetch.js');   // fills ./vendor (cached files are skipped)

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, {
  recursive: true,
  filter: src => !src.endsWith('.bak')
});
// A-Frame's internal assets (fonts, VR controller models) come from its official
// CDN on a static host: Pages is always online and serves only what we copy.
fs.cpSync(path.join(ROOT, 'vendor'), path.join(DIST, 'vendor'), {
  recursive: true,
  filter: src => !src.endsWith('.tmp') && !src.includes(`${path.sep}vendor${path.sep}cdn`)
});
for (const page of ['index.html', 'room.html']) {
  const file = path.join(DIST, page);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8')
    .replace("window.AFRAME_CDN_ROOT = 'vendor/cdn/';", "window.AFRAME_CDN_ROOT = 'https://cdn.aframe.io/';")
    // Local: quality fixed at 1. Published: adaptive resolution (min 0.75) for a steady frame rate
    .replace(/(dynamic-resolution="[^"]*?);\s*fixed:\s*[\d.]+"/, '$1"'));
}
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');   // serve files as they are

console.log(`  ✔ Static build in ${path.relative(ROOT, DIST)}/ (open dist/index.html through any static server)`);
