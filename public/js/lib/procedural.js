/**
 * Procedural generators with no external assets:
 * 2D noise, texture patterns, an SVG poster and a synthesized WAV.
 */

/** Deterministic 2D value noise (for the marble) */
export function makeNoise(seed = 7) {
  const p = new Uint8Array(512); let s = seed;
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const rnd = (x, y) => p[p[x & 255] + (y & 255)] / 255;
  const smooth = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
    const a = rnd(xi, yi), b = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** Value noise that repeats every `period` units (seamless tiling textures) */
export function makeTileableNoise(period, seed = 1) {
  const r = rng(seed), grid = Array.from({ length: period * period }, r);
  const at = (x, y) => grid[((y % period + period) % period) * period + ((x % period + period) % period)];
  const smooth = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** Seeded random generator (mulberry32): same forest on every load */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Patterns for the canvas-texture component: (ctx, size) => void */
export const PATTERNS = {
  checker(ctx, s) {
    const n = 8, q = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#ffb400' : '#1b2133';
      ctx.fillRect(i * q, j * q, q, q);
    }
  },
  tiles(ctx, s) {
    ctx.fillStyle = '#262c3d'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
    }
    ctx.strokeStyle = '#161a25'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, s, s);
  },
  grass(ctx, s) {
    const big = makeTileableNoise(6, 5), fine = makeTileableNoise(24, 8);
    const img = ctx.createImageData(s, s), r = rng(3);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      // Seamless large patches + fine grain
      const n = big((x / s) * 6, (y / s) * 6) * 0.6 + fine((x / s) * 24, (y / s) * 24) * 0.4;
      const g = 0.75 + 0.5 * n + (r() - 0.5) * 0.18;
      const k = (x + y * s) * 4;
      img.data[k] = 46 * g; img.data[k + 1] = 92 * g; img.data[k + 2] = 38 * g; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Blades
    for (let i = 0; i < s * 3; i++) {
      const x = r() * s, y = r() * s;
      ctx.strokeStyle = `rgba(${120 + r() * 60}, ${170 + r() * 50}, 80, ${0.25 + r() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 5); ctx.stroke();
    }
  },
  dirt(ctx, s) {
    const r = rng(9);
    ctx.fillStyle = '#6b5236'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s * 6; i++) {
      const v = r();
      ctx.fillStyle = v > 0.5 ? `rgba(150, 120, 80, ${r() * 0.5})` : `rgba(50, 36, 22, ${r() * 0.5})`;
      ctx.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 3);
    }
  },
  marble(ctx, s) {
    const noise = makeNoise(11), img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      let n = 0, amp = 1, f = 4 / s;
      for (let o = 0; o < 4; o++) { n += noise(x * f, y * f) * amp; amp *= 0.5; f *= 2; }
      const v = Math.pow(0.5 + 0.5 * Math.sin((x / s) * 10 + n * 6), 0.35);
      const k = (x + y * s) * 4;
      img.data[k] = 235 * v + 20; img.data[k + 1] = 228 * v + 22; img.data[k + 2] = 240 * v + 30; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
};

/** Vector poster loaded as a Data URI */
export const SVG_POSTER = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffb400"/><stop offset="1" stop-color="#ef2d5e"/></linearGradient></defs>
  <rect width="512" height="512" rx="48" fill="#141a2b"/>
  <circle cx="256" cy="226" r="150" fill="none" stroke="url(#g)" stroke-width="18"/>
  <polygon points="256,104 384,318 128,318" fill="url(#g)" opacity="0.92"/>
  <circle cx="256" cy="250" r="40" fill="#141a2b"/>
  <text x="256" y="446" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#ffffff" text-anchor="middle">SVG · Data URI</text>
</svg>`;

export const svgDataUri = svg => 'data:image/svg+xml,' + encodeURIComponent(svg);

/** Synthesizes a looping arpeggio (16-bit mono PCM WAV) and returns a Blob URL */
export function createMelodyWavUrl() {
  const sr = 22050, dur = 4, n = sr * dur;
  const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23];
  const step = dur / notes.length;
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

  // RIFF/WAVE header
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);

  const pcm = new Int16Array(buf, 44);
  for (let i = 0; i < n; i++) {
    const t = i / sr, k = Math.floor(t / step), lt = t - k * step, f = notes[k];
    const env = Math.min(1, lt * 40) * Math.exp(-lt * 4);
    const s = Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(4 * Math.PI * f * t) * 0.2 + Math.sin(Math.PI * f * t) * 0.15;
    pcm[i] = Math.max(-1, Math.min(1, s * env * 0.85)) * 32767;
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
