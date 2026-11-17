/**
 * Streams rooms in and out of the one-scene version, to save memory.
 *
 * Each room starts as an empty anchor (see museum-loader.js). This component
 * mounts a room's content when the visitor gets near and unmounts it when
 * they leave, disposing its GPU resources (geometries, materials, textures).
 *
 * How far is "near":
 *  - fog on  → fog.far: whatever is hidden by the fog is not even loaded;
 *  - fog off → `radius` rooms around the camera (current + neighbours).
 * A room counts as near when its closest edge is within that distance.
 *
 * Trade-off: an unmounted room loses its state (open panels, toggled
 * components) and mounting a room costs a short hitch (DOM + GPU upload).
 * To keep hitches rare:
 *  - hysteresis: a room unloads only `margin` meters beyond the reach, so
 *    standing near the limit does not mount / unmount it over and over;
 *  - materials are not disposed: that would also release their compiled
 *    shaders, and recompiling them on the way back is the costliest part.
 *    Geometries and textures (the actual memory) are freed.
 * With the stats component on you can watch Textures / Geometries change.
 */
import { ROOM_CONTENT } from '../core/museum-loader.js';
import { STATION_SPACING } from '../config.js';

const cam = new THREE.Vector3();

/** Geometries and textures under an Object3D (the scene environment map is shared) */
function collectResources(object, keep) {
  const found = new Set();
  object.traverse(o => {
    if (o.geometry) found.add(o.geometry);
    for (const m of [].concat(o.material || [])) {
      for (const v of Object.values(m)) if (v && v.isTexture && v !== keep) found.add(v);
    }
  });
  return found;
}

AFRAME.registerComponent('room-streamer', {
  schema: {
    radius: { default: 1 },        // rooms, when there is no fog
    margin: { default: 4 },        // extra meters before a loaded room unloads
    interval: { default: 400 }     // ms between checks
  },

  init() {
    this.loaded = new Map();       // room index → mounted elements
    this.tick = AFRAME.utils.throttleTick(this.tick, this.data.interval, this);
    this.el.addEventListener('station-changed', () => this.refresh());
  },

  /** Distance (m) within which rooms stay loaded */
  reach() {
    const fog = this.el.hasAttribute('fog') && this.el.getAttribute('fog');
    if (fog && fog.type === 'linear') return fog.far;
    if (fog) return 2 / fog.density;   // exponential fog: ~98% hidden at this distance
    return this.data.radius * STATION_SPACING;
  },

  refresh() {
    const museum = this.el.systems.museum;
    const stations = museum.stations;
    if (!stations.length || !this.el.camera) return;
    // While teleporting, look from the destination, not from mid-flight
    let z;
    if (museum.moving) z = stations[museum.current].el.object3D.position.z;
    else { this.el.camera.getWorldPosition(cam); z = cam.z; }

    const reach = this.reach(), half = STATION_SPACING / 2;
    stations.forEach((s, i) => {
      if (!s || !ROOM_CONTENT[i]) return;
      const edge = Math.max(0, Math.abs(z - s.el.object3D.position.z) - half);
      const current = i === museum.current;
      if (!this.loaded.has(i) && (current || edge < reach)) this.mount(i);
      else if (this.loaded.has(i) && !current && edge > reach + this.data.margin) this.unmount(i);
    });
  },

  mount(i) {
    const { root, children, extras } = ROOM_CONTENT[i];
    const els = [];
    // Extras first (e.g. the <video> that an <a-video> in the room points to)
    for (const { target, node } of extras) els.push(target.appendChild(document.importNode(node, true)));
    for (const node of children) els.push(root.appendChild(document.importNode(node, true)));
    this.loaded.set(i, els);
    this.el.emit('room-loaded', { index: i });
  },

  unmount(i) {
    const keep = this.el.object3D.environment;
    const resources = new Set();
    for (const el of this.loaded.get(i)) {
      if (el.object3D) for (const r of collectResources(el.object3D, keep)) resources.add(r);
      el.remove();   // A-Frame runs every component's remove()
    }
    // Free GPU memory (anything still used elsewhere is simply re-uploaded)
    resources.forEach(r => r.dispose());
    this.loaded.delete(i);
    this.el.emit('room-unloaded', { index: i });
  },

  tick() { this.refresh(); }
});
