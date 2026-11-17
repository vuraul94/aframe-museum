/**
 * Museum architecture generated in code: floor, ceiling, walls,
 * partition walls with doorways between stations, rugs and overhead lights.
 * Applied to #museum, which has hide-on-enter-ar (hidden in AR).
 * With outdoorLast (default) the building ends at the last partition: its
 * doorway opens onto the outdoor forest of the final station (forest.js).
 */
import { ACCENTS, STATION_SPACING, STATIONS } from '../config.js';

const WALL = 'color: #232a3d; roughness: 0.92; metalness: 0';
const DOOR = { width: 3.6, height: 3.4 };

AFRAME.registerComponent('museum-architecture', {
  schema: {
    stations: { default: STATIONS },
    width: { default: 14 },
    height: { default: 5 },
    outdoorLast: { default: true },
    only: { default: -1 }   // multi-scene version: build just this room, closed on both ends
  },

  init() {
    const { stations, width, height, outdoorLast, only } = this.data;
    const sp = STATION_SPACING, half = width / 2;
    const indoor = outdoorLast ? stations - 1 : stations; // rooms under the roof
    if (only >= indoor) return;                           // the outdoor room has no building
    const first = only >= 0 ? only : 0;
    const last = only >= 0 ? only : indoor - 1;
    const zStart = -first * sp + sp / 2 + (first === 0 ? 1 : 0);
    // Outdoor: the building ends at the last partition (it becomes the facade)
    const zEnd = -last * sp - sp / 2;
    const closedEnd = !outdoorLast || only >= 0;
    const len = zStart - zEnd, zc = (zStart + zEnd) / 2;
    const add = this.add.bind(this);

    // Floor, ceiling and enclosing walls
    add('a-plane', { width, height: len, rotation: '-90 0 0', position: `0 0 ${zc}`,
      'canvas-texture': `pattern: tiles; repeat: ${width / 2} ${len / 2}`,
      material: 'roughness: 0.5; metalness: 0.15', shadow: 'receive: true' });
    add('a-plane', { width, height: len, rotation: '90 0 0', position: `0 ${height} ${zc}`, material: 'color: #11141d; roughness: 1' });
    [-1, 1].forEach(s => add('a-box', { width: 0.2, height, depth: len, position: `${s * (half + 0.1)} ${height / 2} ${zc}`, material: WALL }));
    add('a-box', { width, height, depth: 0.2, position: `0 ${height / 2} ${zStart + 0.1}`, material: WALL });
    if (closedEnd) add('a-box', { width, height, depth: 0.2, position: `0 ${height / 2} ${zEnd - 0.1}`, material: WALL });

    // Light strips on the ceiling
    [-3, 3].forEach(x => add('a-box', { width: 0.12, height: 0.04, depth: len - 1,
      position: `${x} ${height - 0.03} ${zc}`, material: 'shader: flat; color: #e8f0ff' }));

    // Partition walls with doorways between stations
    const segW = half - DOOR.width / 2;
    for (let i = 0; i < (only >= 0 ? 0 : stations - 1); i++) {
      const z = -i * sp - sp / 2;
      [-1, 1].forEach(s => add('a-box', { width: segW, height, depth: 0.3,
        position: `${s * (DOOR.width / 2 + segW / 2)} ${height / 2} ${z}`, material: WALL }));
      add('a-box', { width: DOOR.width, height: height - DOOR.height, depth: 0.3,
        position: `0 ${DOOR.height + (height - DOOR.height) / 2} ${z}`, material: WALL });
      add('a-box', { width: DOOR.width + 0.2, height: 0.06, depth: 0.32,
        position: `0 ${DOOR.height} ${z}`, material: `shader: flat; color: ${ACCENTS[i + 1]}` });
    }

    // Rug, colored ring and overhead light per station
    const floor = new THREE.Color('#1a1f2c');
    for (let i = first; i <= last; i++) {
      const z = -i * sp, accent = ACCENTS[i];
      const rug = new THREE.Color(accent).lerp(floor, 0.93);
      add('a-circle', { radius: 3.3, rotation: '-90 0 0', position: `0 0.01 ${z - 1.4}`,
        material: `color: #${rug.getHexString()}; roughness: 1`, shadow: 'receive: true' });
      add('a-ring', { 'radius-inner': 3.3, 'radius-outer': 3.42, rotation: '-90 0 0',
        position: `0 0.012 ${z - 1.4}`, material: `shader: flat; color: ${accent}` });
      add('a-entity', { light: 'type: point; color: #fff1e0; intensity: 3.5; distance: 14; decay: 1.4',
        position: `0 4.3 ${z - 1}` });
    }
  },

  add(tag, attrs) {
    const e = document.createElement(tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    this.el.appendChild(e);
    return e;
  }
});
