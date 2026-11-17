/**
 * Station 6 · External (non-native) animated models.
 *
 * A-Frame loads glTF/GLB natively with `gltf-model`, but it does NOT play
 * the animation clips stored inside the file. That needs a THREE.AnimationMixer:
 * either the `animation-mixer` component from aframe-extras, or a small
 * component like `gltf-animation` below.
 */
import { MuseumLog } from '../core/feedback.js';

/**
 * Plays a glTF animation clip with cross-fades between clips.
 * Usage: <a-entity gltf-model="url(fox.glb)" gltf-animation="clip: Walk">
 * Emits `animations-ready` with the list of clip names.
 */
AFRAME.registerComponent('gltf-animation', {
  schema: {
    clip: { default: '' },          // empty = first clip in the file
    crossFade: { default: 0.45 },   // seconds
    timeScale: { default: 1 }
  },

  init() {
    this.actions = {};
    this.onModel = e => this.setup(e.detail.model);
    this.el.addEventListener('model-loaded', this.onModel);
    const mesh = this.el.getObject3D('mesh');
    if (mesh) this.setup(mesh);
  },

  /** gltf-model copies the file's clips to model.animations */
  setup(model) {
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    for (const clip of model.animations || []) this.actions[clip.name] = this.mixer.clipAction(clip);
    this.current = null;
    this.update({});
    this.el.emit('animations-ready', { clips: Object.keys(this.actions) });
  },

  update(old) {
    if (!this.mixer) return;
    this.mixer.timeScale = this.data.timeScale;
    if (old.clip !== this.data.clip || !this.current) this.playClip(this.data.clip);
  },

  /** Not called play(): that name is reserved for A-Frame's component lifecycle */
  playClip(name) {
    const next = this.actions[name] || Object.values(this.actions)[0];
    if (!next || next === this.current) return;
    next.reset().play();
    if (this.current) this.current.crossFadeTo(next, this.data.crossFade, false);
    this.current = next;
  },

  tick(t, dt) {
    if (this.mixer) this.mixer.update(Math.min(dt, 100) / 1000);
  },

  remove() {
    this.el.removeEventListener('model-loaded', this.onModel);
    this.mixer?.stopAllAction();
  }
});

/** Rotates the entity around its Y axis (degrees per second): a child placed at radius r walks in a circle */
AFRAME.registerComponent('orbit', {
  schema: { speed: { default: 15 } },
  tick(t, dt) {
    this.el.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.speed) * Math.min(dt, 100) / 1000;
  }
});

/**
 * Click on the model → next clip. Each clip has its own orbit speed so the
 * paws roughly match the ground (Survey = stop, Walk, Run).
 */
AFRAME.registerComponent('clip-cycler', {
  schema: {
    clips: { type: 'array', default: ['Survey', 'Walk', 'Run'] },
    speeds: { type: 'array', default: ['0', '14', '42'] },
    start: { default: 1 },
    orbit: { type: 'selector' },
    label: { type: 'selector' }
  },

  init() {
    this.i = this.data.start;
    this.el.classList.add('clickable');
    this.apply();
    this.el.addEventListener('click', e => {
      this.i = (this.i + 1) % this.data.clips.length;
      this.apply();
      MuseumLog.add('click', `fox → ${this.data.clips[this.i]}`, e);
    });
    // Subtle hover feedback: the label grows
    this.el.addEventListener('mouseenter', () => this.data.label?.object3D.scale.setScalar(1.15));
    this.el.addEventListener('mouseleave', () => this.data.label?.object3D.scale.setScalar(1));
  },

  apply() {
    const clip = this.data.clips[this.i];
    this.el.setAttribute('gltf-animation', 'clip', clip);
    this.data.orbit?.setAttribute('orbit', 'speed', Number(this.data.speeds[this.i]) || 0);
    this.data.label?.setAttribute('canvas-label', 'text', `${clip} · click to change`);
  }
});
