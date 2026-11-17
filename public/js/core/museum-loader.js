/**
 * Builds the museum scene from separate files:
 *
 *   index.html          shell: HUD + <template id="scene-template"> with the
 *                       <a-scene>, the player rig, global lights and an empty #museum
 *   rooms/N-name.html   one fragment per room (see config.js ROOM_FILES)
 *
 * mountMuseum([0,1,2,3,4])          → one scene with every room (index.html)
 * mountMuseum([2], { room: 2 })     → one scene with a single room (room.html)
 *
 * The scene lives in a <template> so A-Frame does not start it before the
 * rooms are in place (selectors like ar-hit-test="target: #arExhibit" must
 * resolve when the components initialize).
 *
 * Streaming (one scene): only each room's anchor is mounted up front (the
 * museum-station entity, so navigation and walls work). Its content stays
 * here, in ROOM_CONTENT, and the room-streamer component mounts / unmounts it
 * when the visitor gets near / far. Always mounted: data-mount="scene"
 * elements (the AR fox, which scene components reference at start-up) and
 * every part of a room that contains a light (adding or removing a light
 * makes Three.js recompile every shader in the scene: a long hitch).
 */
import { ROOM_FILES, STATIONS } from '../config.js';

const FOREST = STATIONS - 1;

/** Streamed content per room index: { root, children: Node[], extras: [{ target, node }] } */
export const ROOM_CONTENT = [];

const stationIndex = el => +(/index:\s*(\d+)/.exec(el.getAttribute('museum-station') || '') || [])[1];

/** The shell: this document (index.html) or the downloaded index.html (room.html) */
async function getShell() {
  if (document.getElementById('scene-template')) return { doc: document, external: false };
  const html = await (await fetch('index.html', { cache: 'no-cache' })).text();
  return { doc: new DOMParser().parseFromString(html, 'text/html'), external: true };
}

async function fetchRoom(i) {
  const res = await fetch(`rooms/${ROOM_FILES[i]}.html`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`rooms/${ROOM_FILES[i]}.html: ${res.status}`);
  const tpl = document.createElement('template');
  tpl.innerHTML = await res.text();
  return tpl.content;
}

export async function mountMuseum(rooms, { room = -1, stream = false } = {}) {
  const [{ doc, external }, ...fragments] = await Promise.all([getShell(), ...rooms.map(fetchRoom)]);

  // room.html: copy the HUD, help and toast from the shell
  if (external) {
    for (const el of doc.body.children) {
      if (!['TEMPLATE', 'SCRIPT'].includes(el.tagName)) document.body.appendChild(document.importNode(el, true));
    }
  }

  const scene = document.importNode(doc.getElementById('scene-template').content.querySelector('a-scene'), true);
  const museum = scene.querySelector('#museum');

  // Each room: top-level elements go to #museum, the scene root or <body> (data-mount)
  for (const fragment of fragments) {
    const top = [...fragment.children];
    const station = top.find(el => el.hasAttribute('museum-station'));
    const content = stream && station && { children: [], extras: [] };
    for (const el of top) {
      const where = el.dataset.mount;
      const target = { scene, body: document.body }[where] || museum;
      if (!content || where === 'scene') { target.appendChild(document.importNode(el, true)); continue; }
      if (el === station) {
        // Mount the anchor and the parts with lights; keep the rest as a template
        content.root = target.appendChild(document.importNode(el.cloneNode(false), true));
        for (const child of [...el.childNodes]) {
          const hasLight = child.nodeType === 1 && (child.matches('[light]') || child.querySelector('[light]'));
          if (hasLight) content.root.appendChild(document.importNode(child, true));
          else content.children.push(child);
        }
      } else {
        content.extras.push({ target, node: el });
      }
    }
    if (content) ROOM_CONTENT[stationIndex(station)] = content;
  }
  if (stream) scene.setAttribute('room-streamer', '');

  if (room >= 0) {
    // One scene per room: the museum system navigates by loading pages,
    // the building is a single closed room and the forest has no museum behind it
    scene.setAttribute('museum', `room: ${room}`);
    museum.setAttribute('museum-architecture', `only: ${room}`);
    if (room === FOREST) scene.querySelector('[forest-environment]')?.setAttribute('forest-environment', 'standalone: true');
  }
  if (!scene.querySelector('#arExhibit')) scene.removeAttribute('ar-hit-test');

  document.getElementById('loading')?.remove();
  document.body.appendChild(scene);   // A-Frame starts the scene here
  return scene;
}
