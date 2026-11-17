/**
 * Inspector save service: a built-in, zero-dependency version of aframe-watcher.
 *
 * The A-Frame Inspector keeps every edit in AFRAME.INSPECTOR.history.updates.
 * Its "Write changes with aframe-watcher" toolbar button POSTs that object to
 * http://localhost:51234/save:
 *
 *   { "ecsDemo": { "position": "0 1.2 0", "material": { "color": "#00ff00" } } }
 *
 *   - key: the entity id (entities without an id cannot be saved)
 *   - single-property component: string value
 *   - multi-property component: object with the changed properties only
 *
 * This service applies those changes to the attributes of the matching tags
 * in public/index.html, keeping a backup in index.html.bak. Like aframe-watcher,
 * it only listens on localhost: it works when the browser runs on this machine.
 */
import http from 'node:http';
import fsp from 'node:fs/promises';

export const SAVE_PORT = 51234;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Chrome Private Network Access preflight (page on a LAN IP → localhost)
  'Access-Control-Allow-Private-Network': 'true'
};

const escapeAttr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "a: 1; b: 2" → Map { a → "1", b → "2" } */
function parseStyle(str) {
  const map = new Map();
  for (const part of str.split(';')) {
    const i = part.indexOf(':');
    if (i > 0) map.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return map;
}
const stringifyStyle = map => [...map].map(([k, v]) => `${k}: ${v}`).join('; ');

/** Finds the opening tag that contains id="…" → { start, end } (end is exclusive) */
function findTag(html, id) {
  const m = new RegExp(`\\sid="${escapeRe(id)}"`).exec(html);
  if (!m) return null;
  const start = html.lastIndexOf('<', m.index);
  // Walk to the closing '>' while ignoring '>' inside quoted values
  let quote = null;
  for (let i = start + 1; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return { start, end: i + 1 };
  }
  return null;
}

/** Sets (or merges, for multi-property components) one attribute in a tag */
function setAttribute(tag, name, value) {
  const re = new RegExp(`(\\s${escapeRe(name)}=)"([^"]*)"`);
  const current = re.exec(tag);
  let text = value;
  if (value && typeof value === 'object') {
    const map = parseStyle(current ? current[2] : '');
    for (const [k, v] of Object.entries(value)) map.set(k, v);
    text = stringifyStyle(map);
  }
  const attr = `${name}="${escapeAttr(text)}"`;
  if (current) return tag.replace(re, (_, pre) => `${pre}"${escapeAttr(text)}"`);
  // New attribute: insert before '>' or '/>'
  return tag.replace(/\s*\/?>$/, end => ` ${attr}${end.trim() === '/>' ? ' />' : '>'}`);
}

/** Applies Inspector updates to an HTML string → { html, saved[], skipped[] } */
export function applyUpdates(html, updates) {
  const saved = [], skipped = [];
  for (const [id, components] of Object.entries(updates || {})) {
    const pos = id && findTag(html, id);
    if (!pos) { skipped.push(id || '(entity without id)'); continue; }
    let tag = html.slice(pos.start, pos.end);
    for (const [name, value] of Object.entries(components)) tag = setAttribute(tag, name, value);
    html = html.slice(0, pos.start) + tag + html.slice(pos.end);
    saved.push(id);
  }
  return { html, saved, skipped };
}

export function startInspectorSave({ htmlFile, port = SAVE_PORT }) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
    if (req.method !== 'POST' || req.url !== '/save') { res.writeHead(404, CORS); return res.end(); }
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const original = await fsp.readFile(htmlFile, 'utf8');
      const { html, saved, skipped } = applyUpdates(original, JSON.parse(body));
      if (saved.length) {
        await fsp.writeFile(htmlFile + '.bak', original);
        await fsp.writeFile(htmlFile, html);
      }
      console.log(`  💾 Inspector → index.html: saved [${saved.join(', ')}]` +
        (skipped.length ? `, skipped [${skipped.join(', ')}] (no id in index.html)` : ''));
      res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ saved, skipped }));
    } catch (err) {
      console.error(`  ✖ Inspector save: ${err.message}`);
      res.writeHead(400, CORS);
      res.end(err.message);
    }
  });
  server.on('error', err => console.log(`  ℹ  Inspector save service disabled (port ${port}: ${err.code}). Is aframe-watcher running?`));
  // Localhost only: nobody else on the network can write to your files
  server.listen(port, '127.0.0.1', () =>
    console.log(`  💾 Inspector save service on http://localhost:${port} → public/index.html (SAVE=0 to disable)`));
  return server;
}
