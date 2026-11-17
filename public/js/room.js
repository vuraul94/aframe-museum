/**
 * Multi-scene version: one <a-scene> per room → room.html?station=N
 *
 * Mounts only rooms/N-name.html in the same shell as index.html (HUD, rig,
 * lights). Moving to another room is a real page load: the previous scene,
 * its textures, models and audio are freed and only the new room is
 * downloaded. That is the trade-off this version demonstrates against
 * index.html (one big scene, instant teleports, everything loaded up front).
 */
import './register.js';
import { mountMuseum } from './core/museum-loader.js';
import { onSceneReady } from './core/presenter.js';
import { STATIONS, ROOM_FILES } from './config.js';

const param = parseInt(new URLSearchParams(location.search).get('station'), 10);
const room = Math.min(STATIONS, Math.max(1, param || 1)) - 1;

const scene = await mountMuseum([room], { room });

const modeLink = document.getElementById('modeLink');
if (modeLink) { modeLink.href = `index.html#station=${room + 1}`; modeLink.textContent = '⇄ One scene'; }
document.title = `Room ${room + 1} · A-Frame Museum (rooms/${ROOM_FILES[room]}.html)`;
onSceneReady(scene);
