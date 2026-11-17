/**
 * 2D <canvas> drawing utilities for generating textures:
 * text panels, code highlighting and Three.js helpers.
 */
import { FONT_UI, FONT_MONO } from '../config.js';

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function wrapText(ctx, text, maxWidth) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/* Minimal syntax highlighting (comments, strings, tags, keywords, numbers) */
const CODE_RE = /(\/\/.*$|<!--.*-->|"[^"]*"|'[^']*'|<\/?[a-z][\w-]*|\/?>|\b(?:const|let|function|return|new|this|if|else)\b|\b\d+(?:\.\d+)?\b)/g;
const CODE_COLORS = { plain: '#d6deeb', comment: '#7f8aa3', string: '#addb67', tag: '#ff6b8b', number: '#f78c6c', keyword: '#c792ea' };

function tokenColor(t) {
  if (t.startsWith('//') || t.startsWith('<!--')) return CODE_COLORS.comment;
  if (/^["']/.test(t)) return CODE_COLORS.string;
  if (/^<|>$/.test(t)) return CODE_COLORS.tag;
  if (/^\d/.test(t)) return CODE_COLORS.number;
  return CODE_COLORS.keyword;
}

export function drawCodeLine(ctx, line, x, y) {
  let last = 0, m;
  const put = (txt, color) => { ctx.fillStyle = color; ctx.fillText(txt, x, y); x += ctx.measureText(txt).width; };
  CODE_RE.lastIndex = 0;
  while ((m = CODE_RE.exec(line))) {
    if (m.index > last) put(line.slice(last, m.index), CODE_COLORS.plain);
    put(m[0], tokenColor(m[0]));
    last = CODE_RE.lastIndex;
  }
  if (last < line.length) put(line.slice(last), CODE_COLORS.plain);
}

/**
 * Paints a full panel. With draw=false it only measures and returns the
 * required height (used to size the canvas before drawing).
 */
export function paintPanel(ctx, p, W, draw) {
  const pad = 56, maxW = W - pad * 2, accent = p.accent || '#ef2d5e';
  let y = pad;

  if (draw) {
    roundRectPath(ctx, 4, 4, W - 8, ctx.canvas.height - 8, 36);
    ctx.fillStyle = 'rgba(14, 19, 34, 0.95)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.stroke();
    ctx.fillStyle = accent; roundRectPath(ctx, pad, 26, 90, 8, 4); ctx.fill();
  }
  if (p.kicker) {
    ctx.font = `600 28px ${FONT_UI}`;
    if (draw) { ctx.fillStyle = accent; ctx.fillText(p.kicker.toUpperCase(), pad, y + 26); }
    y += 46;
  }
  if (p.title) {
    ctx.font = `700 56px ${FONT_UI}`;
    for (const l of wrapText(ctx, p.title, maxW)) {
      if (draw) { ctx.fillStyle = '#ffffff'; ctx.fillText(l, pad, y + 52); }
      y += 66;
    }
    y += 10;
  }
  if (p.body) {
    ctx.font = `400 34px ${FONT_UI}`;
    for (const para of p.body) {
      const bullet = para.startsWith('• ');
      const indent = bullet ? 34 : 0;
      wrapText(ctx, bullet ? para.slice(2) : para, maxW - indent).forEach((l, i) => {
        if (draw) {
          if (bullet && i === 0) { ctx.fillStyle = accent; ctx.fillText('•', pad, y + 32); }
          ctx.fillStyle = '#dfe5f3'; ctx.fillText(l, pad + indent, y + 32);
        }
        y += 44;
      });
      y += 10;
    }
  }
  if (p.code && p.code.length) {
    y += 6;
    ctx.font = `500 27px ${FONT_MONO}`;
    const lh = 37, boxH = p.code.length * lh + 36;
    if (draw) {
      ctx.fillStyle = '#060912'; roundRectPath(ctx, pad - 14, y, maxW + 28, boxH, 18); ctx.fill();
      p.code.forEach((l, i) => drawCodeLine(ctx, l, pad + 6, y + 45 + i * lh));
    }
    y += boxH + 14;
  }
  if (p.footer) {
    ctx.font = `italic 600 30px ${FONT_UI}`;
    for (const l of wrapText(ctx, p.footer, maxW)) {
      if (draw) { ctx.fillStyle = accent; ctx.fillText(l, pad, y + 30); }
      y += 42;
    }
  }
  return y + pad - 14;
}

/** CanvasTexture in sRGB color space (consistent with colorManagement) */
export function makeCanvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Sets a texture as the entity mesh's `map` as soon as the mesh exists */
export function applyMap(el, tex, extra = {}) {
  const apply = () => {
    const mesh = el.getObject3D('mesh');
    if (!mesh) return false;
    mesh.material.map = tex;
    Object.assign(mesh.material, extra);
    mesh.material.needsUpdate = true;
    return true;
  };
  if (!apply()) {
    el.addEventListener('object3dset', function onSet() { if (apply()) el.removeEventListener('object3dset', onSet); });
  }
}
