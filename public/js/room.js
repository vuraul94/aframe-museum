/**
 * Multi-scene version: one <a-scene> per room → room.html?station=N
 *
 * Instead of duplicating markup, index.html stays the single source of truth
 * (the Inspector's "Write changes" keeps working): this page downloads it,
 * keeps only room N plus what that room needs, and mounts the resulting scene.
 *
 * Moving to another room is a real page load: the previous scene, its
 * textures, models and audio are freed and only the new room is downloaded.
 * That is the trade-off this version demonstrates against index.html (one
 * big scene, instant teleports, everything loaded up front).
 */
import './register.js';
import { onSceneReady } from './core/presenter.js';
import { STATIONS } from './config.js';

const FOREST = STATIONS - 1;
const MULTIMEDIA = 3;

const param = parseInt(new URLSearchParams(location.search).get('station'), 10);
const room = Math.min(STATIONS, Math.max(1, param || 1)) - 1;
const stationIndex = el => +(/index:\s*(\d+)/.exec(el.getAttribute('museum-station')) || [])[1];

const html = await (await fetch('index.html', { cache: 'no-cache' })).text();
const doc = new DOMParser().parseFromString(html, 'text/html');
const scene = doc.querySelector('a-scene');

// 1. Only this room
scene.querySelectorAll('[museum-station]').forEach(st => { if (stationIndex(st) !== room) st.remove(); });
scene.setAttribute('museum', `room: ${room}`);
// 2. Its own building: a closed room (the forest has none)
scene.querySelector('#museum').setAttribute('museum-architecture', `only: ${room}`);
if (room === FOREST) scene.querySelector('[forest-environment]').setAttribute('forest-environment', 'standalone: true');
// 3. The AR exhibit (the fox) only exists in the forest
if (room !== FOREST) {
  scene.querySelector('#arExhibit')?.remove();
  scene.removeAttribute('ar-hit-test');
}

// 4. HUD, help and toast; the <video> only in the multimedia room
const extras = [...doc.body.children].filter(el =>
  el.tagName !== 'A-SCENE' && el.tagName !== 'SCRIPT' && (el.id !== 'trailer' || room === MULTIMEDIA));
document.getElementById('loading')?.remove();
for (const el of extras) document.body.appendChild(document.importNode(el, true));
const modeLink = document.getElementById('modeLink');
if (modeLink) { modeLink.href = `index.html#station=${room + 1}`; modeLink.textContent = '⇄ One scene'; }
document.title = `Room ${room + 1} · A-Frame Museum (multi-scene)`;

// 5. Mount the scene: A-Frame initializes it as soon as it is in the document
const sceneEl = document.importNode(scene, true);
document.body.appendChild(sceneEl);
onSceneReady(sceneEl);
