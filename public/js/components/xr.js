/**
 * WebXR: VR controller locomotion, station navigation from the headset
 * and AR mode handling (station 5).
 */
import { toast } from '../core/feedback.js';

const UP = new THREE.Vector3(0, 1, 0);

/** Smooth thumbstick movement (relative to where you are looking) */
AFRAME.registerComponent('thumbstick-locomotion', {
  schema: { rig: { type: 'selector', default: '#rig' }, speed: { default: 2.2 } },
  init() {
    this.axis = { x: 0, y: 0 };
    this.dir = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.el.addEventListener('thumbstickmoved', e => { this.axis.x = e.detail.x; this.axis.y = e.detail.y; });
  },
  tick(t, dt) {
    const { x, y } = this.axis;
    if (Math.abs(x) < 0.15 && Math.abs(y) < 0.15) return;
    this.el.sceneEl.camera.getWorldDirection(this.dir);
    this.dir.y = 0; this.dir.normalize();
    this.right.crossVectors(this.dir, UP);
    const step = this.data.speed * dt / 1000;
    this.data.rig.object3D.position.addScaledVector(this.dir, -y * step).addScaledVector(this.right, x * step);
  }
});

/** Snap turning (reduces motion sickness) around the head position */
AFRAME.registerComponent('snap-turn', {
  schema: { rig: { type: 'selector', default: '#rig' }, angle: { default: 45 } },
  init() {
    this.ready = true;
    const head = new THREE.Vector3();
    this.el.addEventListener('thumbstickmoved', e => {
      const x = e.detail.x;
      if (Math.abs(x) < 0.3) { this.ready = true; return; }
      if (!this.ready || Math.abs(x) < 0.75) return;
      this.ready = false;
      const a = THREE.MathUtils.degToRad(this.data.angle) * (x > 0 ? -1 : 1);
      const rig = this.data.rig.object3D;
      this.el.sceneEl.camera.getWorldPosition(head);
      rig.position.sub(head).applyAxisAngle(UP, a).add(head);
      rig.rotation.y += a;
    });
  }
});

/** Present from the headset: A/X = next station, B/Y = previous */
AFRAME.registerComponent('vr-station-buttons', {
  init() {
    const museum = this.el.sceneEl.systems.museum;
    ['abuttondown', 'xbuttondown'].forEach(ev => this.el.addEventListener(ev, () => museum.next()));
    ['bbuttondown', 'ybuttondown'].forEach(ev => this.el.addEventListener(ev, () => museum.prev()));
  }
});

/**
 * On entering AR: rig to the origin and exhibit in front of the user (ar-hit-test
 * repositions it on real surfaces). On exit: everything goes back in place.
 */
AFRAME.registerComponent('ar-mode-handler', {
  schema: { exhibit: { type: 'selector', default: '#arExhibit' }, returnTo: { default: 4 } },
  init() {
    const ex = this.data.exhibit;
    if (!ex) return;   // multi-scene version: only the forest room has the AR exhibit
    this.home = ex.object3D.position.clone();
    this.el.addEventListener('enter-vr', () => {
      if (!this.el.is('ar-mode')) return;
      this.inAR = true;
      const rig = document.getElementById('rig').object3D;
      rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
      ex.object3D.position.set(0, 0, -1.2);
      ex.object3D.scale.setScalar(0.6);
    });
    this.el.addEventListener('exit-vr', () => {
      if (!this.inAR) return;
      this.inAR = false;
      ex.object3D.position.copy(this.home);
      ex.object3D.scale.setScalar(1);
      this.el.systems.museum.goTo(this.data.returnTo, true);
    });
  }
});

/** 3D "Enter AR" button with support check */
AFRAME.registerComponent('enter-ar-button', {
  init() {
    this.el.addEventListener('click', async () => {
      const supported = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
      if (supported) this.el.sceneEl.enterAR();
      else toast('AR (immersive-ar) is not available on this device/browser');
    });
  }
});
