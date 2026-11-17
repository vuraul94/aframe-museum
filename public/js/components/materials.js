/**
 * Station 3 · Procedural textures, PBR environment and lights.
 * No external images: everything is generated with <canvas>, SVG or a mini-scene.
 */
import { makeCanvasTexture, applyMap } from '../lib/canvas.js';
import { PATTERNS, SVG_POSTER, svgDataUri } from '../lib/procedural.js';
import { MuseumLog } from '../core/feedback.js';

/** Static texture drawn on a canvas (checker | tiles | marble) */
AFRAME.registerComponent('canvas-texture', {
  schema: {
    pattern: { default: 'checker', oneOf: Object.keys(PATTERNS) },
    size: { default: 256 },
    repeat: { type: 'vec2', default: { x: 1, y: 1 } }
  },
  init() {
    const c = document.createElement('canvas');
    c.width = c.height = this.data.size;
    PATTERNS[this.data.pattern](c.getContext('2d'), this.data.size);
    const tex = makeCanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(this.data.repeat.x, this.data.repeat.y);
    applyMap(this.el, tex);
  }
});

/** Animated texture: the canvas is redrawn in tick() (~30 fps) */
AFRAME.registerComponent('plasma-texture', {
  schema: { size: { default: 96 } },
  init() {
    const s = this.data.size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = s;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(s, s);
    this.tex = makeCanvasTexture(this.canvas);
    applyMap(this.el, this.tex);
    this.tick = AFRAME.utils.throttleTick(this.tick, 33, this);
  },
  tick(time) {
    const s = this.data.size, t = time / 1000, d = this.img.data;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = Math.sin(x / 8 + t) + Math.sin(y / 6 + t * 1.3) + Math.sin((x + y) / 10 + t * 0.7)
        + Math.sin(Math.hypot(x - s / 2, y - s / 2) / 6 - t * 2);
      const k = (x + y * s) * 4;
      d[k] = 128 + 127 * Math.sin(v * Math.PI);
      d[k + 1] = 128 + 127 * Math.sin(v * Math.PI + 2.1);
      d[k + 2] = 128 + 127 * Math.sin(v * Math.PI + 4.2);
      d[k + 3] = 255;
    }
    this.ctx.putImageData(this.img, 0, 0);
    this.tex.needsUpdate = true;
  }
});

/** SVG poster loaded as a Data URI */
AFRAME.registerComponent('svg-texture', {
  init() {
    new THREE.TextureLoader().load(svgDataUri(SVG_POSTER), tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      applyMap(this.el, tex, { transparent: true });
    });
  }
});

/** PMREM environment map built from a mini-scene (PBR reflections without an external HDR) */
AFRAME.registerComponent('procedural-environment', {
  init() {
    const run = () => {
      const renderer = this.el.renderer;
      if (!renderer) return;
      const env = new THREE.Scene();

      const c = document.createElement('canvas'); c.width = 4; c.height = 128;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, '#d8e0ff'); g.addColorStop(0.5, '#4a5068'); g.addColorStop(1, '#141620');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 128);
      env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16),
        new THREE.MeshBasicMaterial({ map: makeCanvasTexture(c), side: THREE.BackSide })));

      const softbox = (x, y, z, w, h, k, color) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
      };
      softbox(0, 15, 0, 12, 12, 3, '#ffffff');
      softbox(-15, 5, 5, 6, 10, 2, '#ffd2a8');
      softbox(15, 4, -5, 6, 10, 2, '#a8c8ff');

      const pmrem = new THREE.PMREMGenerator(renderer);
      this.el.object3D.environment = pmrem.fromScene(env, 0.02).texture;
      pmrem.dispose();
    };
    this.el.hasLoaded ? run() : this.el.addEventListener('loaded', run);
  }
});

/** Button that changes the color of a light and its visible "bulb" */
AFRAME.registerComponent('light-color-cycle', {
  schema: {
    light: { type: 'selector' },
    bulb: { type: 'selector' },
    colors: { type: 'array', default: ['#ffb400', '#4cc9f0', '#ef2d5e', '#2ec4b6', '#ffffff'] }
  },
  init() {
    this.i = 0;
    this.el.addEventListener('click', e => {
      this.i = (this.i + 1) % this.data.colors.length;
      const color = this.data.colors[this.i];
      this.data.light.setAttribute('light', 'color', color);
      this.data.bulb?.setAttribute('material', 'color', color);
      MuseumLog.add('click', `light.color = ${color}`, e);
    });
  }
});
