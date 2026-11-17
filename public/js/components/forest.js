/**
 * Station 5 · Procedural forest: the fox's habitat.
 *
 * Everything is generated in code (no images): grass and dirt textures on
 * <canvas>, gradient sky, hill silhouettes, and trees, rocks, flowers and
 * grass tufts drawn with THREE.InstancedMesh (one draw call per part, no
 * matter how many trees there are).
 *
 * Coordinates are local to the station. The museum's last wall (with the
 * door) is at z = +7, so nothing is placed inside the building.
 */
import { PATTERNS, rng } from '../lib/procedural.js';
import { makeCanvasTexture } from '../lib/canvas.js';

const PINE_COLORS = ['#2f5d34', '#356b3a', '#2a5230', '#3d7442'];
const LEAF_COLORS = ['#4f8a3c', '#6a9a3a', '#3f7a3a', '#88a83f'];
const FLOWER_COLORS = ['#ffffff', '#ffd23f', '#c792ea', '#ff6b8b', '#7fd1ff'];

function patternTexture(name, size, repeatX, repeatY) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  PATTERNS[name](c.getContext('2d'), size);
  const tex = makeCanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  return tex;
}

/** Horizontal ground plane covering the rectangle [x0,x1] × [z0,z1] */
function groundPlane(x0, x1, z0, z1, y, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  m.receiveShadow = true;
  return m;
}

/** InstancedMesh from a list of matrices (+ optional per-instance colors) */
function instanced(geometry, material, matrices, colors, { cast = true } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((m, i) => {
    mesh.setMatrixAt(i, m);
    if (colors) mesh.setColorAt(i, new THREE.Color(colors[i]));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

AFRAME.registerComponent('forest-environment', {
  schema: {
    seed: { default: 42 },
    trees: { default: 140 },
    radius: { default: 40 },        // ground half-size
    center: { type: 'vec2', default: { x: 0, y: -2.4 } }, // clearing center (x, z)
    clearing: { default: 7.5 },     // tree-free radius
    front: { default: 7 },          // z of the museum wall with the door
    museumHalfWidth: { default: 7.3 },
    standalone: { default: false }  // multi-scene version: no museum behind, full ground
  },

  init() {
    this.random = rng(this.data.seed);
    this.group = new THREE.Group();
    this.buildGround();
    this.buildSky();
    this.buildVegetation();
    this.el.setObject3D('forest', this.group);
  },

  /** Is (x, z) inside the building or too close to it? */
  insideMuseum(x, z, margin = 0.8) {
    const d = this.data;
    if (d.standalone) return false;   // nothing to avoid
    return Math.abs(x) < d.museumHalfWidth + margin && z > d.front - margin;
  },

  /** Random point in a ring around the clearing, outside the museum */
  scatter(rMin, rMax) {
    const { center } = this.data;
    for (let tries = 0; tries < 50; tries++) {
      const a = this.random() * Math.PI * 2;
      const r = Math.sqrt(rMin * rMin + this.random() * (rMax * rMax - rMin * rMin));
      const x = center.x + Math.cos(a) * r, z = center.y + Math.sin(a) * r;
      if (!this.insideMuseum(x, z)) return { x, z };
    }
    return null;
  },

  buildGround() {
    const { radius: R, front, museumHalfWidth: hw } = this.data;
    const grass = new THREE.MeshStandardMaterial({ map: patternTexture('grass', 512, 1, 1), roughness: 1 });
    // Three pieces around the museum footprint, so they never overlap its floor
    const pieces = this.data.standalone ? [[-R, R, -R, R]] : [
      [-R, R, -R, front],
      [-R, -hw, front, R],
      [hw, R, front, R]
    ];
    for (const [x0, x1, z0, z1] of pieces) {
      const mat = grass.clone();
      mat.map = grass.map.clone();
      mat.map.repeat.set((x1 - x0) / 4, (z1 - z0) / 4);
      mat.map.needsUpdate = true;
      this.group.add(groundPlane(x0, x1, z0, z1, 0, mat));
    }

    // Dirt path from the door to the clearing, and the clearing itself
    const dirtMat = len => new THREE.MeshStandardMaterial({
      map: patternTexture('dirt', 256, 1, len / 1.6), roughness: 1, transparent: true, opacity: 0.92
    });
    const path = groundPlane(-0.8, 0.8, -1, front, 0.004, dirtMat(front + 1));
    this.group.add(path);
    const { center } = this.data;
    const clearing = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48),
      new THREE.MeshStandardMaterial({ map: patternTexture('dirt', 256, 3, 3), roughness: 1 }));
    clearing.rotation.x = -Math.PI / 2;
    clearing.position.set(center.x, 0.006, center.y);
    clearing.receiveShadow = true;
    this.group.add(clearing);
  },

  buildSky() {
    // Vertical gradient on an inverted sphere
    const c = document.createElement('canvas'); c.width = 8; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#3f7fd0'); g.addColorStop(0.42, '#9cc8ee'); g.addColorStop(0.5, '#e8f1f2');
    g.addColorStop(0.52, '#b9cfa6'); g.addColorStop(1, '#4d6a3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16),
      new THREE.MeshBasicMaterial({ map: makeCanvasTexture(c), side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
    sky.renderOrder = -2;
    this.group.add(sky);

    // Hills and distant tree line on a cylinder (sines with whole periods → seamless)
    const W = 2048, H = 256;
    const h = document.createElement('canvas'); h.width = W; h.height = H;
    const hc = h.getContext('2d');
    const layer = (color, base, amp, k, phase, pines) => {
      hc.fillStyle = color; hc.beginPath(); hc.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const t = (x / W) * Math.PI * 2;
        let y = base - amp * (0.6 * Math.sin(k * t + phase) + 0.4 * Math.sin(k * 2.0 * t + phase * 3));
        if (pines) y -= Math.max(0, Math.sin(x * 0.45) * 0.5 + Math.sin(x * 0.11) * 0.5) * 22;
        hc.lineTo(x, y);
      }
      hc.lineTo(W, H); hc.closePath(); hc.fill();
    };
    layer('#8fb0b8', 150, 40, 3, 0.5, false);
    layer('#5f8a6a', 185, 28, 5, 1.7, true);
    layer('#2f5537', 215, 14, 7, 2.3, true);
    const hillTex = makeCanvasTexture(h);
    hillTex.wrapS = THREE.RepeatWrapping;
    const hills = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 18, 64, 1, true),
      new THREE.MeshBasicMaterial({ map: hillTex, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false }));
    hills.position.set(this.data.center.x, 8.4, this.data.center.y);
    hills.renderOrder = -1;
    this.group.add(hills);

    // Clouds: sprites that always face the camera
    const cc = document.createElement('canvas'); cc.width = 256; cc.height = 128;
    const cx = cc.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = 50 + this.random() * 156, y = 60 + this.random() * 30, r = 22 + this.random() * 26;
      const rg = cx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      cx.fillStyle = rg; cx.fillRect(0, 0, 256, 128);
    }
    const cloudMat = new THREE.SpriteMaterial({ map: makeCanvasTexture(cc), depthWrite: false, fog: false, opacity: 0.9 });
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(cloudMat);
      // Decorative: never raycast (Sprite.raycast also needs raycaster.camera, which A-Frame's raycaster does not set)
      s.raycast = () => {};
      const a = this.random() * Math.PI * 2, r = 45 + this.random() * 25;
      s.position.set(Math.cos(a) * r, 22 + this.random() * 14, this.data.center.y + Math.sin(a) * r);
      const k = 14 + this.random() * 12;
      s.scale.set(k * 2, k, 1);
      this.group.add(s);
    }
  },

  buildVegetation() {
    const { trees, radius, clearing } = this.data;
    const rnd = this.random;
    const M = () => new THREE.Matrix4();
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const compose = (x, y, z, rotY, sx, sy = sx, sz = sx) =>
      M().compose(new THREE.Vector3(x, y, z), q.clone().setFromAxisAngle(up, rotY), new THREE.Vector3(sx, sy, sz));

    // --- Trees: 70% pines, 30% round trees
    const pine = [], pineColors = [], round = [], leafColors = [];
    for (let i = 0; i < trees; i++) {
      const p = this.scatter(clearing, radius - 6);
      if (!p) continue;
      const s = 0.8 + rnd() * 0.9;
      const m = compose(p.x, 0, p.z, rnd() * Math.PI * 2, s, s * (0.9 + rnd() * 0.35));
      if (rnd() < 0.7) { pine.push(m); pineColors.push(PINE_COLORS[i % PINE_COLORS.length]); }
      else { round.push(m); leafColors.push(LEAF_COLORS[i % LEAF_COLORS.length]); }
    }
    const bark = new THREE.MeshStandardMaterial({ color: '#5a3d26', roughness: 1 });
    const foliage = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true });

    const trunk = new THREE.CylinderGeometry(0.12, 0.2, 1.4, 6).translate(0, 0.7, 0);
    this.group.add(instanced(trunk, bark, [...pine, ...round]));
    // Pine = three stacked cones baked into the same matrix
    [[1.25, 1.6, 1.5], [0.98, 1.4, 2.35], [0.68, 1.2, 3.1]].forEach(([r, h, y]) =>
      this.group.add(instanced(new THREE.ConeGeometry(r, h, 7).translate(0, y, 0), foliage, pine, pineColors)));
    // Round tree = flattened icosahedron
    const canopy = new THREE.IcosahedronGeometry(1.15, 0).scale(1, 0.9, 1).translate(0, 2.3, 0);
    this.group.add(instanced(canopy, foliage, round, leafColors));

    // --- Rocks
    const rocks = [];
    for (let i = 0; i < 34; i++) {
      const p = this.scatter(3.8, radius - 8);
      if (p) rocks.push(compose(p.x, 0.05, p.z, rnd() * 6, 0.25 + rnd() * 0.6, 0.18 + rnd() * 0.35, 0.25 + rnd() * 0.6));
    }
    this.group.add(instanced(new THREE.DodecahedronGeometry(0.6, 0),
      new THREE.MeshStandardMaterial({ color: '#8a8f96', roughness: 0.95, flatShading: true }), rocks));

    // --- Grass tufts and flowers (no shadows: they are tiny)
    const tufts = [], flowers = [], flowerColors = [];
    for (let i = 0; i < 700; i++) {
      const p = this.scatter(3.5, 24);
      if (!p || (Math.abs(p.x) < 1 && p.z > -1)) continue; // keep the path clean
      tufts.push(compose(p.x, 0, p.z, rnd() * 6, 0.6 + rnd() * 0.8));
      if (i % 4 === 0) {
        flowers.push(compose(p.x + 0.12, 0.2 + rnd() * 0.1, p.z + 0.08, 0, 1));
        flowerColors.push(FLOWER_COLORS[Math.floor(rnd() * FLOWER_COLORS.length)]);
      }
    }
    const tuft = new THREE.ConeGeometry(0.06, 0.38, 3).translate(0, 0.19, 0);
    this.group.add(instanced(tuft, new THREE.MeshStandardMaterial({ color: '#5f9a3e', roughness: 1, flatShading: true }), tufts, null, { cast: false }));
    this.group.add(instanced(new THREE.IcosahedronGeometry(0.055, 0),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, emissive: '#222222' }), flowers, flowerColors, { cast: false }));
  },

  remove() {
    this.el.removeObject3D('forest');
  }
});

/**
 * Light that only turns on while the viewer is at one station.
 * Three.js lights affect the whole scene, so the forest "sun" would also
 * light the indoor rooms: we fade it in when you arrive and out when you leave.
 */
AFRAME.registerComponent('station-light', {
  schema: { station: { type: 'int' }, intensity: { default: 1 } },
  init() {
    this.onChange = e => {
      const on = e.detail.index === this.data.station || this.el.sceneEl.is('ar-mode');
      this.el.setAttribute('animation__light',
        { property: 'light.intensity', to: on ? this.data.intensity : 0, dur: 900, easing: 'easeInOutQuad' }, true);
    };
    this.el.setAttribute('light', 'intensity', 0);
    this.el.sceneEl.addEventListener('station-changed', this.onChange);
  },
  remove() {
    this.el.sceneEl.removeEventListener('station-changed', this.onChange);
  }
});
