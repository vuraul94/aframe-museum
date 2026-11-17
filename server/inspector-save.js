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
 * in public/index.html or the room files (public/rooms/*.html): each id is
 * looked up in whichever file defines it. Every modified file keeps a backup
 * (<file>.bak). Like aframe-watcher, it only listens on localhost: it works
 * when the browser runs on this machine.
 */
import http from 'node:http';
import fsp from 'node:fs/promises';
import path from 'node:path';

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

/** Applies the updates of one entity to an HTML string (null if the id is not there) */
function applyToEntity(html, id, components) {
  const pos = id && findTag(html, id);
  if (!pos) return null;
  let tag = html.slice(pos.start, pos.end);
  for (const [name, value] of Object.entries(components)) tag = setAttribute(tag, name, value);
  return html.slice(0, pos.start) + tag + html.slice(pos.end);
}

/** Applies Inspector updates to an HTML string → { html, saved[], skipped[] } */
export function applyUpdates(html, updates) {
  const files = new Map([['page', html]]);
  const { saved, skipped } = applyToFiles(files, updates);
  return { html: files.get('page'), saved, skipped };
}

/** Same, over several files (Map name → html, modified in place) */
export function applyToFiles(files, updates) {
  const saved = [], skipped = [], changed = new Set();
  for (const [id, components] of Object.entries(updates || {})) {
    let done = false;
    for (const [name, html] of files) {
      const next = applyToEntity(html, id, components);
      if (next === null) continue;
      files.set(name, next); changed.add(name); saved.push(`${id} (${name})`); done = true;
      break;
    }
    if (!done) skipped.push(id || '(entity without id)');
  }
  return { saved, skipped, changed };
}

/** index.html + rooms/*.html */
async function listHtmlFiles(publicDir) {
  const rooms = await fsp.readdir(path.join(publicDir, 'rooms')).catch(() => []);
  return ['index.html', ...rooms.filter(f => f.endsWith('.html')).sort().map(f => `rooms/${f}`)];
}

export function startInspectorSave({ publicDir, port = SAVE_PORT }) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
    if (req.method !== 'POST' || req.url !== '/save') { res.writeHead(404, CORS); return res.end(); }
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const names = await listHtmlFiles(publicDir);
      const originals = new Map(await Promise.all(names.map(async n => [n, await fsp.readFile(path.join(publicDir, n), 'utf8')])));
      const files = new Map(originals);
      const { saved, skipped, changed } = applyToFiles(files, JSON.parse(body));
      for (const name of changed) {
        const file = path.join(publicDir, name);
        await fsp.writeFile(file + '.bak', originals.get(name));
        await fsp.writeFile(file, files.get(name));
      }
      console.log(`  💾 Inspector: saved [${saved.join(', ')}]` +
        (skipped.length ? `, skipped [${skipped.join(', ')}] (no such id in index.html or rooms/)` : ''));
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
    console.log(`  💾 Inspector save service on http://localhost:${port} → public/index.html + public/rooms/*.html (SAVE=0 to disable)`));
  return server;
}
