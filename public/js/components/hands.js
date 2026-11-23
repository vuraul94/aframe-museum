/**
 * Station 5 · Hand tracking and XR features.
 *
 * Real hand tracking needs a headset that supports it (Quest, Vision Pro…),
 * so this room works on two levels:
 *  - illustrative, everywhere: `hand-illustration` animates the 25 WebXR hand
 *    joints doing a pinch, and the panels explain the API;
 *  - live, when the device can: the rig's hand-tracking-grab-controls
 *    (index.html) render the real hands, `grabbable` objects can be picked up
 *    with a pinch, and `xr-capabilities` reports what this device supports and
 *    every pinch it sees.
 */
import { PANELS } from '../content/panels.js';
import { toast, MuseumLog } from '../core/feedback.js';

/* ───────────── Illustrated hand ───────────── */

// Open pose, in meters: wrist at the origin, fingers up (+Y), palm facing the viewer (+Z)
const FINGERS = {
  //        metacarpal base     knuckle (proximal)      segment lengths
  index:  { base: [-0.012, 0.01], knuckle: [-0.028, 0.085], len: [0.040, 0.024, 0.022] },
  middle: { base: [0, 0.01],      knuckle: [-0.008, 0.088], len: [0.045, 0.028, 0.024] },
  ring:   { base: [0.012, 0.01],  knuckle: [0.012, 0.084],  len: [0.041, 0.026, 0.023] },
  pinky:  { base: [0.022, 0.01],  knuckle: [0.030, 0.076],  len: [0.032, 0.019, 0.019] }
};
const THUMB_OPEN = [[-0.02, 0.02, 0.005], [-0.045, 0.045, 0.012], [-0.058, 0.075, 0.018], [-0.065, 0.098, 0.022]];
const PINCH_CURL = [0.55, 0.75, 0.6];   // index finger joint angles at full pinch (radians)

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** Joint chain of a finger curled by `curl` (0 open … 1 pinch) toward the palm */
function fingerChain(f, curlAngles, amount) {
  const pts = [v3(f.base[0], f.base[1], 0), v3(f.knuckle[0], f.knuckle[1], 0)];
  let angle = 0;
  f.len.forEach((l, i) => {
    angle += curlAngles[i] * amount;
    const prev = pts[pts.length - 1];
    pts.push(v3(prev.x, prev.y + Math.cos(angle) * l, prev.z + Math.sin(angle) * l));
  });
  return pts;   // metacarpal, proximal, intermediate, distal, tip
}

AFRAME.registerComponent('hand-illustration', {
  schema: { period: { default: 3200 } },

  init() {
    this.group = new THREE.Group();
    const jointGeo = new THREE.SphereGeometry(0.0055, 12, 8);
    const tipGeo = new THREE.SphereGeometry(0.0075, 14, 10);
    const boneGeo = new THREE.CylinderGeometry(0.0028, 0.0028, 1, 6).rotateX(Math.PI / 2);   // axis = +Z
    const jointMat = new THREE.MeshStandardMaterial({ color: '#ffd2b0', roughness: 0.5 });
    const boneMat = new THREE.MeshStandardMaterial({ color: '#e8732a', roughness: 0.6 });
    this.pinchMat = new THREE.MeshStandardMaterial({ color: '#ffd2b0', emissive: '#ff8a3d', emissiveIntensity: 0, roughness: 0.4 });

    // 25 joints: wrist + thumb (4) + 4 fingers × 5
    this.joints = [];
    const addJoint = (tip, pinchTip) => {
      const m = new THREE.Mesh(tip ? tipGeo : jointGeo, pinchTip ? this.pinchMat : jointMat);
      this.group.add(m); this.joints.push(m);
    };
    addJoint(false);                                                     // wrist
    for (let i = 0; i < 4; i++) addJoint(i === 3, i === 3);              // thumb
    Object.keys(FINGERS).forEach(name => {
      for (let i = 0; i < 5; i++) addJoint(i === 4, name === 'index' && i === 4);
    });
    // Bones: wrist → thumb chain, wrist → each metacarpal, then along each finger
    this.bones = [];
    const chains = [[0, 1, 2, 3, 4]];
    for (let f = 0; f < 4; f++) { const s = 5 + f * 5; chains.push([0, s, s + 1, s + 2, s + 3, s + 4]); }
    chains.forEach(c => { for (let i = 0; i < c.length - 1; i++) {
      const m = new THREE.Mesh(boneGeo, boneMat);
      this.group.add(m); this.bones.push({ mesh: m, a: c[i], b: c[i + 1] });
    } });
    // Spark at the pinch point
    this.spark = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.011, 24),
      new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, side: THREE.DoubleSide }));
    this.group.add(this.spark);

    this.el.setObject3D('hand', this.group);
    // Index tip at full pinch: where the thumb tip has to go
    this.pinchTarget = fingerChain(FINGERS.index, PINCH_CURL, 1)[4];
    this.dir = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.Z = new THREE.Vector3(0, 0, 1);
  },

  tick(time) {
    // 0 → 1 → 0 with a short hold at the pinch
    const phase = (time % this.data.period) / this.data.period;
    const t = Math.min(1, 1.15 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2)));

    const pts = [v3(0, 0, 0)];
    // Thumb: from the open pose toward the index tip
    const meta = v3(...THUMB_OPEN[0]), target = this.pinchTarget;
    const closed = [
      meta,
      meta.clone().lerp(target, 0.35).add(v3(-0.014, 0, 0.012)),
      meta.clone().lerp(target, 0.7).add(v3(-0.007, 0, 0.014)),
      target.clone().add(v3(-0.003, -0.004, 0.006))
    ];
    THUMB_OPEN.forEach((p, i) => pts.push(v3(...p).lerp(closed[i], t)));
    // Fingers: the index curls fully, the others a little
    Object.entries(FINGERS).forEach(([name, f]) =>
      pts.push(...fingerChain(f, name === 'index' ? PINCH_CURL : [0.25, 0.3, 0.2], name === 'index' ? t : t * 0.6)));

    pts.forEach((p, i) => this.joints[i].position.copy(p));
    for (const { mesh, a, b } of this.bones) {
      const pa = pts[a], pb = pts[b];
      this.dir.subVectors(pb, pa);
      const len = this.dir.length();
      mesh.position.copy(pa).addScaledVector(this.dir, 0.5);
      mesh.quaternion.copy(this.q.setFromUnitVectors(this.Z, this.dir.normalize()));
      mesh.scale.set(1, 1, len);
    }
    // Pinch feedback: glowing tips + an expanding ring
    const pinching = t > 0.97;
    this.pinchMat.emissiveIntensity = pinching ? 1.2 : 0;
    this.spark.visible = pinching;
    if (pinching) {
      this.spark.position.copy(pts[4]).lerp(pts[9], 0.5);   // thumb tip ↔ index tip
      const s = 1 + ((time / 120) % 1) * 1.5;
      this.spark.scale.setScalar(s);
      this.spark.material.opacity = 1.6 - s * 0.6;
    }
  }
});

/* ───────────── What this device supports, live ───────────── */

const mark = v => (v === true ? '✓' : v === false ? '✗' : '…');

AFRAME.registerComponent('xr-capabilities', {
  dependencies: ['canvas-panel'],

  init() {
    const scene = this.el.sceneEl;
    this.state = {
      api: 'xr' in navigator, secure: window.isSecureContext,
      vr: null, ar: null, handsFeature: null, handsNow: [], lastPinch: null, lastGrab: null
    };
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(v => this.set({ vr: v })).catch(() => this.set({ vr: false }));
      navigator.xr.isSessionSupported('immersive-ar').then(v => this.set({ ar: v })).catch(() => this.set({ ar: false }));
    } else this.set({ vr: false, ar: false });

    this.onEnter = () => {
      const session = scene.xrSession;
      if (!session) return;
      const features = session.enabledFeatures;   // not every browser reports it
      this.set({ handsFeature: features ? features.includes('hand-tracking') : 'unknown' });
      this.onInputs = () => this.set({ handsNow: [...session.inputSources].filter(s => s.hand).map(s => s.handedness) });
      session.addEventListener('inputsourceschange', this.onInputs);
      this.onInputs();
    };
    this.onExit = () => this.set({ handsNow: [] });
    this.onPinch = e => {
      const hand = e.target.id.startsWith('left') ? 'left' : 'right';
      this.set({ lastPinch: `${hand} hand at ${new Date().toLocaleTimeString()}` });
      MuseumLog.add('pinchstarted', `${hand} hand`);
    };
    scene.addEventListener('enter-vr', this.onEnter);
    scene.addEventListener('exit-vr', this.onExit);
    scene.addEventListener('pinchstarted', this.onPinch);
    this.render();
  },

  set(changes) { Object.assign(this.state, changes); this.render(); },

  render() {
    const s = this.state;
    const hands = s.handsFeature === 'unknown' ? '… enabled? the browser does not say'
      : s.handsFeature === null ? '… enter VR to find out' : mark(s.handsFeature);
    PANELS['xr-status'].body = [
      `${mark(s.api)}  WebXR API (navigator.xr)`,
      `${mark(s.secure)}  Secure context (HTTPS or localhost)`,
      `${mark(s.vr)}  immersive-vr sessions`,
      `${mark(s.ar)}  immersive-ar sessions`,
      `Hand tracking: ${hands}`,
      `Hands tracked now: ${s.handsNow.length ? s.handsNow.join(' + ') : 'none'}`,
      `Last pinch: ${s.lastPinch || '—'}`
    ];
    this.el.components['canvas-panel']?.refresh();
  },

  remove() {
    const scene = this.el.sceneEl;
    scene.removeEventListener('enter-vr', this.onEnter);
    scene.removeEventListener('exit-vr', this.onExit);
    scene.removeEventListener('pinchstarted', this.onPinch);
    if (scene.xrSession && this.onInputs) scene.xrSession.removeEventListener('inputsourceschange', this.onInputs);
  }
});

/** Clicking a grabbable with the mouse explains how to really grab it */
AFRAME.registerComponent('grab-hint', {
  init() {
    this.el.classList.add('clickable');
    this.el.addEventListener('click', e => {
      toast('In a headset with hand tracking: pinch this cube to pick it up');
      MuseumLog.add('click', 'grabbable (needs hands)', e);
    });
  }
});
