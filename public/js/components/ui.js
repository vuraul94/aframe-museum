/**
 * 3D UI components: text panels, labels, buttons
 * and "View info" panel pop-ups.
 */
import { PANELS } from '../content/panels.js';
import { FONT_UI } from '../config.js';
import { paintPanel, roundRectPath, makeCanvasTexture } from '../lib/canvas.js';
import { togglePanel, MuseumLog } from '../core/feedback.js';

const CANVAS_W = 1024;
// alphaTest: fully transparent pixels write no depth (no "holes" behind other panels)
const basicMaterial = map => new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.02, toneMapped: false });

/** Readable 3D panel: renders PANELS[id] to a canvas and uses it as a texture */
AFRAME.registerComponent('canvas-panel', {
  schema: { id: { type: 'string' }, width: { default: 2.4 } },

  update() { this.refresh(); },

  /** Redraws (dynamic panels call this after changing PANELS[id]) */
  refresh() {
    const p = PANELS[this.data.id] || { title: `${this.data.id}?` };
    const c = this.canvas || (this.canvas = document.createElement('canvas'));
    c.width = CANVAS_W; c.height = 64;
    const H = Math.ceil(paintPanel(c.getContext('2d'), p, CANVAS_W, false));
    c.height = H;
    paintPanel(c.getContext('2d'), p, CANVAS_W, true);
    const h = this.data.width * H / CANVAS_W;

    if (!this.mesh) {
      this.texture = makeCanvasTexture(c);
      this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.data.width, h), basicMaterial(this.texture));
      this.el.setObject3D('mesh', this.mesh);
      return;
    }
    // Canvas size changes → new texture (WebGL2 uses immutable storage)
    this.texture.dispose();
    this.texture = makeCanvasTexture(c);
    this.mesh.material.map = this.texture;
    this.mesh.material.needsUpdate = true;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(this.data.width, h);
  },

  remove() {
    if (!this.mesh) return;
    this.el.removeObject3D('mesh');
    this.texture.dispose(); this.mesh.geometry.dispose(); this.mesh.material.dispose();
  }
});

/** Single-line text label */
AFRAME.registerComponent('canvas-label', {
  schema: { text: { default: '' }, width: { default: 1 }, color: { default: '#dfe5f3' }, size: { default: 70 } },
  update() {
    const c = document.createElement('canvas'); c.width = CANVAS_W; c.height = 140;
    const ctx = c.getContext('2d');
    ctx.font = `600 ${this.data.size}px ${FONT_UI}`;
    ctx.fillStyle = this.data.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.data.text, CANVAS_W / 2, 70);
    const geo = new THREE.PlaneGeometry(this.data.width, this.data.width * 140 / CANVAS_W);
    this.el.setObject3D('mesh', new THREE.Mesh(geo, basicMaterial(makeCanvasTexture(c))));
  }
});

/** Pill-shaped 3D button with hover state (.clickable class for the raycaster) */
AFRAME.registerComponent('ui-button', {
  schema: {
    label: { default: 'View info' },
    width: { default: 0.7 },
    color: { default: '#ef2d5e' },
    icon: { default: 'i' }
  },

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512; this.canvas.height = 128;
    this.texture = makeCanvasTexture(this.canvas);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.25), basicMaterial(this.texture));
    this.el.setObject3D('mesh', this.mesh);
    this.el.classList.add('clickable');
    this.el.addEventListener('mouseenter', () => { this.hover = true; this.update(); });
    this.el.addEventListener('mouseleave', () => { this.hover = false; this.update(); });
  },

  update() {
    const { width, color, icon, label } = this.data;
    const s = width * (this.hover ? 1.08 : 1);
    this.mesh.scale.set(s, s, 1);

    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    roundRectPath(ctx, 4, 4, 504, 120, 60);
    ctx.fillStyle = color; ctx.globalAlpha = this.hover ? 1 : 0.88; ctx.fill(); ctx.globalAlpha = 1;
    if (this.hover) { ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }

    ctx.beginPath(); ctx.arc(66, 64, 40, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${icon.length > 1 ? 30 : 46}px ${FONT_UI}`;
    ctx.fillText(icon, 66, 67);

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.font = `700 46px ${FONT_UI}`;
    ctx.fillText(label, 124, 67, 370);
    this.texture.needsUpdate = true;
  }
});

/** Marks an entity as a pop-up panel (hidden at start) */
AFRAME.registerComponent('popup', {
  init() {
    this.el._open = false;
    this.el.object3D.visible = false;
    this.el.object3D.scale.setScalar(0.001);
  }
});

/** "View info" button: shows/hides the target panel */
AFRAME.registerComponent('info-toggle', {
  schema: { type: 'selector' },
  init() {
    this.el.addEventListener('click', e => {
      const open = togglePanel(this.data);
      MuseumLog.add('click', `View info (${open ? 'open' : 'close'})`, e);
    });
  }
});
