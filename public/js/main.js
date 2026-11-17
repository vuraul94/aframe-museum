/**
 * Entry point of the single-scene version (index.html): the five room files
 * are mounted in one <a-scene> and the rig "teleports" between them.
 */
import './register.js';
import { mountMuseum } from './core/museum-loader.js';
import { onSceneReady } from './core/presenter.js';
import { STATIONS } from './config.js';

// stream: rooms are mounted when you get near and unmounted when you leave (room-streamer).
// index.html?stream=0 loads every room up front (to compare memory and FPS).
const stream = new URLSearchParams(location.search).get('stream') !== '0';
const scene = await mountMuseum([...Array(STATIONS).keys()], { stream });
onSceneReady(scene);
