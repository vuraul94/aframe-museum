/**
 * `npm run vendor` — preloads all libraries and fonts into ./vendor
 * so the talk can be given without an internet connection.
 */
import { FILES, resolveVendor, fetchToCache } from './vendor.js';

const FONTS = [
  'Roboto-msdf.json', 'Exo2Bold.fnt', 'mozillavr.fnt', 'Monoid.fnt',
  'KelsonSans.fnt', 'Aileron-Semibold.fnt'
];

// Libraries, the fox model and the trailer video
for (const p of Object.keys(FILES)) await fetchToCache(resolveVendor(p));

for (const font of FONTS) {
  await fetchToCache(resolveVendor(`/vendor/cdn/fonts/${font}`));
  // A-Frame derives the glyph atlas by replacing the extension with .png
  const atlas = font.replace(/\.(fnt|json)$/, '.png');
  await fetchToCache(resolveVendor(`/vendor/cdn/fonts/${atlas}`));
}

console.log('\n  ✔ Libraries, fonts, model and video cached in ./vendor (offline mode ready).');
console.log('  ℹ  VR controller 3D models are cached the first time they are used.\n');
