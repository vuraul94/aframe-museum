/**
 * Keeps the viewer inside the museum's walls.
 *
 * Every way of moving ends up changing the camera's world position: WASD
 * moves #camera inside the rig, the VR thumbstick moves #rig, and in a
 * headset you can simply walk. So each frame we look at where the camera
 * is and, if that spot is not walkable, we push the rig back.
 *
 *  - One scene (index.html): the walls are the limits. Each room's side
 *    limits come from its museum-station `bounds`; between two rooms you can
 *    only cross through the doorway. Walking into another room makes it the
 *    current one (HUD, panels, forest lights).
 *  - One scene per room (room.html): the room is closed, its bounds are the box.
 *
 * Moves are resolved one axis at a time, so you slide along a wall instead
 * of getting stuck. Paused while the rig flies between rooms (museum.goTo)
 * and in AR (there the real room is the limit).
 */
const DOOR_HALF = 1.8 - 0.35;   // doorway half width minus a body margin
const WALL_BAND = 0.5;          // half thickness of a partition + margin
const cam = new THREE.Vector3();

AFRAME.registerComponent('room-bounds', {
  schema: { enabled: { default: true } },

  init() {
    this.museum = this.el.sceneEl.systems.museum;
    this.last = null;   // last walkable camera position (x, z)
  },

  /** Rooms present in this scene, sorted along the corridor */
  rooms() {
    return this.museum.stations
      .map((s, index) => s && { ...s, index, x: s.el.object3D.position.x, z: s.el.object3D.position.z })
      .filter(Boolean);
  },

  /** Room whose area contains z (partitions sit halfway between two rooms) */
  roomAt(rooms, z) {
    return rooms.reduce((best, r) => (Math.abs(r.z - z) < Math.abs(best.z - z) ? r : best), rooms[0]);
  },

  walkable(rooms, x, z) {
    const room = this.roomAt(rooms, z);
    const [xMin, xMax, zMin, zMax] = room.bounds;
    if (x < room.x + xMin || x > room.x + xMax) return false;
    const first = rooms[0], lastRoom = rooms[rooms.length - 1];
    if (rooms.length === 1) return z >= room.z + zMin && z <= room.z + zMax;
    // Ends of the corridor
    if (z > first.z + first.bounds[3] || z < lastRoom.z + lastRoom.bounds[2]) return false;
    // Partitions between consecutive rooms: only the doorway is open
    for (let i = 0; i < rooms.length - 1; i++) {
      const wall = (rooms[i].z + rooms[i + 1].z) / 2;
      if (Math.abs(z - wall) < WALL_BAND && Math.abs(x - room.x) > DOOR_HALF) return false;
    }
    return true;
  },

  tick() {
    const scene = this.el.sceneEl, museum = this.museum;
    if (!this.data.enabled || scene.is('ar-mode')) return;
    if (museum.moving) { this.last = null; return; }
    const rooms = this.rooms().sort((a, b) => b.z - a.z);
    if (!rooms.length || !scene.camera) return;

    scene.camera.getWorldPosition(cam);
    let { x, z } = cam;
    if (!this.walkable(rooms, x, z)) {
      const prev = this.last || this.clampToRoom(this.roomAt(rooms, z), x, z);
      if (this.walkable(rooms, x, prev.z)) z = prev.z;          // slide along x
      else if (this.walkable(rooms, prev.x, z)) x = prev.x;     // slide along z
      else { x = prev.x; z = prev.z; }
      this.el.object3D.position.x += x - cam.x;
      this.el.object3D.position.z += z - cam.z;
    }
    this.last = { x, z };

    // One scene: walking through a doorway changes the current room
    if (!museum.roomMode) {
      const room = this.roomAt(rooms, z);
      if (room.index !== museum.current) museum.enterRoom(room.index);
    }
  },

  /** Fallback when there is no previous position: nearest point of the room box */
  clampToRoom(room, x, z) {
    const [xMin, xMax, zMin, zMax] = room.bounds;
    return {
      x: THREE.MathUtils.clamp(x, room.x + xMin, room.x + xMax),
      z: THREE.MathUtils.clamp(z, room.z + zMin, room.z + zMax)
    };
  }
});

