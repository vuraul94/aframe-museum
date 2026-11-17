/**
 * 3D dialogs shared by the video and iframe kiosks (station 4).
 *
 * A dialog is a `popup` entity (opens/closes with a scale animation) with a
 * `dialog-frame`: background, title, subtitle and credits drawn on a canvas.
 * Its content (an <a-video>, an iframe screen, buttons) goes in the HTML.
 */
import { FONT_UI } from '../config.js';
import { roundRectPath, makeCanvasTexture } from '../lib/canvas.js';
import { togglePanel } from '../core/feedback.js';

const PX = 1024;

/** Opens a dialog and closes any other open `.dialog` (only one at a time) */
export function openDialog(dialog) {
  document.querySelectorAll('.dialog').forEach(d => { if (d !== dialog) closeDialog(d); });
  // It opens on top of its kiosk: close the kiosk's other panels (same spot)
  dialog.parentElement?.querySelectorAll(':scope > [popup]').forEach(p => { if (p !== dialog) togglePanel(p, false); });
  togglePanel(dialog, true);
  dialog.emit('dialog-opened');
}

export function closeDialog(dialog) {
  if (!dialog._open) return;
  togglePanel(dialog, false);
  dialog.emit('dialog-closed');
}

/** Frame: header above the content (centered at 0,0), controls and credits below */
AFRAME.registerComponent('dialog-frame', {
  schema: {
    title: { default: '' },
    subtitle: { default: '' },
    credits: { default: '' },
    accent: { default: '#7b61ff' },
    width: { default: 2.9 },
    height: { default: 2.5 }
  },

  init() {
    this.el.classList.add('dialog');
  },

  update() {
    const { width: W, height: H } = this.data;
    const c = document.createElement('canvas');
    c.width = PX; c.height = Math.round(PX * H / W);
    this.draw(c.getContext('2d'), c.width, c.height);
    if (this.mesh) { this.mesh.material.map.dispose(); this.mesh.material.dispose(); this.mesh.geometry.dispose(); }
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: makeCanvasTexture(c), transparent: true, alphaTest: 0.02, toneMapped: false }));
    this.mesh.position.set(0, -0.1, -0.01);
    this.el.setObject3D('frame', this.mesh);
  },

  draw(ctx, w, h) {
    const { title, subtitle, credits, accent } = this.data;
    roundRectPath(ctx, 6, 6, w - 12, h - 12, 34);
    ctx.fillStyle = 'rgba(12, 16, 28, 0.96)'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = accent; ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(40, 30, 70, 8);
    ctx.fillStyle = '#ffffff'; ctx.font = `700 46px ${FONT_UI}`;
    ctx.fillText(title, 40, 92, w - 80);
    ctx.fillStyle = '#9aa5c4'; ctx.font = `500 26px ${FONT_UI}`;
    ctx.fillText(subtitle, 40, 128, w - 80);
    ctx.fillStyle = '#7d88a8'; ctx.font = `500 22px ${FONT_UI}`;
    ctx.fillText(credits, 40, h - 30, w - 80);
  }
});
