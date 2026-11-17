/**
 * Entry point of the single-scene version (index.html): the five room files
 * are mounted in one <a-scene> and the rig "teleports" between them.
 */
import './register.js';
import { mountMuseum } from './core/museum-loader.js';
import { onSceneReady } from './core/presenter.js';
import { STATIONS } from './config.js';

const scene = await mountMuseum([...Array(STATIONS).keys()]);
onSceneReady(scene);
