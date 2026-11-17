/**
 * Entry point of the single-scene version (index.html): the five rooms
 * live in one <a-scene> and the rig "teleports" between them.
 * Components are registered first (A-Frame waits for DOMContentLoaded,
 * and modules run before that event).
 */
import './register.js';
import { onSceneReady } from './core/presenter.js';

onSceneReady(document.querySelector('a-scene'));
