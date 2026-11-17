/**
 * "museum" SYSTEM: global presentation state.
 * Example of the "S" in ECS: a single object per scene that components
 * query (sceneEl.systems.museum) to register stations and navigate.
 *
 * Two modes, configured on the scene like any component:
 *  - <a-scene>                    one scene, 5 rooms: the rig moves between them
 *  - <a-scene museum="room: 2">   one scene per room: going to another room
 *                                 loads another page (room.html?station=N)
 */
import { VIEW_OFFSET, STATIONS } from '../config.js';
import { togglePanel } from './feedback.js';

AFRAME.registerSystem('museum', {
  schema: { room: { default: -1 } },   // -1 = all rooms in this scene

  init() {
    this.stations = [];
    this.roomMode = this.data.room >= 0;
    // index.html#station=N (link back from the multi-scene version)
    const fromHash = parseInt((/station=(\d+)/.exec(location.hash) || [])[1], 10) - 1;
    this.current = this.roomMode ? this.data.room : Math.max(0, Math.min(STATIONS - 1, fromHash || 0));
    this.sceneEl.addEventListener('loaded', () => setTimeout(() => this.goTo(this.current, true), 0));
  },

  register(el, { index, name, bounds }) {
    this.stations[index] = { el, name, bounds: bounds.map(Number) };
  },

  /** Moves (animated) the player rig to station i */
  goTo(i, instant = false) {
    i = Math.max(0, Math.min(STATIONS - 1, i));
    // Multi-scene version: another room is another page (and another <a-scene>)
    if (this.roomMode && i !== this.data.room) {
      location.href = `room.html?station=${i + 1}`;
      return;
    }
    const prev = this.stations[this.current];
    const next = this.stations[i];
    if (prev && prev !== next) prev.el.querySelectorAll('[popup]').forEach(p => togglePanel(p, false));
    this.current = i;

    const rig = document.getElementById('rig');
    const from = rig.object3D.position;
    const to = next.el.object3D.position;
    rig.object3D.rotation.set(0, 0, 0);
    // room-bounds pauses while the rig flies between rooms
    this.moving = true;
    rig.addEventListener('animationcomplete__nav', () => { this.moving = false; }, { once: true });
    rig.setAttribute('animation__nav', {
      property: 'position',
      from: `${from.x} ${from.y} ${from.z}`,
      to: `${to.x} 0 ${to.z + VIEW_OFFSET}`,
      dur: instant ? 1 : 900,
      easing: 'easeInOutCubic'
    }, true);

    // Outside XR: undo WASD movement and face forward
    if (!this.sceneEl.is('vr-mode') && !this.sceneEl.is('ar-mode')) {
      const cam = document.getElementById('camera');
      cam.object3D.position.set(0, 1.6, 0);
      const look = cam.components['look-controls'];
      if (look) { look.pitchObject.rotation.x = 0; look.yawObject.rotation.y = 0; }
    }
    this.sceneEl.emit('station-changed', { index: i, name: next.name });
  },

  /**
   * One scene: the visitor walked through a doorway into room i (room-bounds).
   * Same bookkeeping as goTo, without moving the rig.
   */
  enterRoom(i) {
    if (i === this.current || !this.stations[i]) return;
    this.stations[this.current]?.el.querySelectorAll('[popup]').forEach(p => togglePanel(p, false));
    this.current = i;
    this.sceneEl.emit('station-changed', { index: i, name: this.stations[i].name });
  },

  next() { this.goTo(this.current + 1); },
  prev() { this.goTo(this.current - 1); },

  /** Opens all panels of the current station (or closes them if already open) */
  togglePanelsOfCurrent() {
    const pops = [...this.stations[this.current].el.querySelectorAll('[popup]')];
    const anyClosed = pops.some(p => !p._open);
    pops.forEach(p => togglePanel(p, anyClosed));
  }
});

/** Marks an entity as a tour station */
AFRAME.registerComponent('museum-station', {
  schema: {
    index: { type: 'int' },
    name: { type: 'string' },
    // Walkable area relative to the station: xMin xMax zMin zMax (meters).
    // Default: inside the walls of a 14 × 14 m room (see room-bounds)
    bounds: { type: 'array', default: ['-6.5', '6.5', '-6.5', '6.5'] }
  },
  init() { this.el.sceneEl.systems.museum.register(this.el, this.data); }
});
