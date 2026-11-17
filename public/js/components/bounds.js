/**
 * Keeps the viewer inside the current room.
 *
 * Every way of moving ends up changing the camera's world position: WASD
 * moves #camera inside the rig, the VR thumbstick moves #rig, and in a
 * headset you can simply walk. So each frame we look at where the camera
 * is and, if it went past the room's limits (museum-station `bounds`), we
 * push the rig back by the difference. The camera stops at the wall.
 *
 * Paused while the rig flies between rooms (museum.goTo) and in AR (there
 * the real room is the limit).
 */
const cam = new THREE.Vector3();

AFRAME.registerComponent('room-bounds', {
  schema: { enabled: { default: true } },

  init() {
    this.museum = this.el.sceneEl.systems.museum;
  },

  tick() {
    const scene = this.el.sceneEl, museum = this.museum;
    if (!this.data.enabled || museum.moving || scene.is('ar-mode')) return;
    const station = museum.stations[museum.current];
    const camera = scene.camera;
    if (!station || !camera) return;

    const [xMin, xMax, zMin, zMax] = station.bounds;
    const origin = station.el.object3D.position;   // stations hang from #museum, at the origin
    camera.getWorldPosition(cam);
    const x = THREE.MathUtils.clamp(cam.x, origin.x + xMin, origin.x + xMax);
    const z = THREE.MathUtils.clamp(cam.z, origin.z + zMin, origin.z + zMax);
    if (x !== cam.x || z !== cam.z) {
      this.el.object3D.position.x += x - cam.x;
      this.el.object3D.position.z += z - cam.z;
    }
  }
});
