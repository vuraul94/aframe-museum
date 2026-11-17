/**
 * Station 5 · Web pages and YouTube inside the 3D scene with <iframe>.
 *
 * WebGL cannot draw an iframe (it is DOM from another origin), so we use the
 * Three.js CSS3DRenderer technique: a DOM layer over the canvas whose CSS
 * `perspective` and `matrix3d` reproduce the A-Frame camera, so the iframe
 * looks glued to a 3D "screen" plane and you can still click and scroll it.
 *
 * Limits (good to mention in the talk):
 *  - The DOM layer sits on top of the canvas: 3D objects never cover it.
 *  - In VR/AR the DOM is not rendered: the screen shows a notice instead.
 *  - Sites can forbid framing (X-Frame-Options / CSP frame-ancestors).
 */
import { FONT_UI } from '../config.js';
import { makeCanvasTexture } from '../lib/canvas.js';
import { MuseumLog } from '../core/feedback.js';
import { openDialog, closeDialog } from './dialog.js';
import { isInspectorOpen } from './inspector.js';

const EPS = v => (Math.abs(v) < 1e-10 ? 0 : v);
const cameraCSS = e => `matrix3d(${[e[0], -e[1], e[2], e[3], e[4], -e[5], e[6], e[7], e[8], -e[9], e[10], e[11], e[12], -e[13], e[14], e[15]].map(EPS).join(',')})`;
const objectCSS = e => `translate(-50%,-50%) matrix3d(${[e[0], e[1], e[2], e[3], -e[4], -e[5], -e[6], -e[7], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]].map(EPS).join(',')})`;

/** Shared CSS3D layer: one per page */
const layer = {
  init() {
    if (this.root) return;
    this.root = document.createElement('div');
    this.root.id = 'css3d-layer';
    this.camera = document.createElement('div');
    this.camera.className = 'css3d-camera';
    this.root.appendChild(this.camera);
    document.body.appendChild(this.root);
  },
  /** Syncs the CSS "camera" with the Three.js camera (CSS3DRenderer.render) */
  sync(camera, canvas) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const fov = camera.projectionMatrix.elements[5] * h / 2;
    this.root.style.perspective = `${fov}px`;
    this.camera.style.width = `${w}px`;
    this.camera.style.height = `${h}px`;
    this.camera.style.transform = `translateZ(${fov}px) ${cameraCSS(camera.matrixWorldInverse.elements)} translate(${w / 2}px, ${h / 2}px)`;
  }
};

/**
 * A 3D screen that shows an iframe. Usage:
 * <a-entity html-iframe="src: https://…; width: 2.6; height: 1.4625">
 * Changing `src` reloads it; an empty src unloads it (stops YouTube audio).
 */
AFRAME.registerComponent('html-iframe', {
  schema: {
    src: { default: '' },
    width: { default: 2.6 },          // meters
    height: { default: 1.4625 },
    pxWidth: { default: 1280 },       // CSS pixels of the page inside
    title: { default: 'Embedded content' }
  },

  init() {
    layer.init();
    const { width, height, pxWidth } = this.data;
    this.pxHeight = Math.round(pxWidth * height / width);

    this.wrap = document.createElement('div');
    this.wrap.className = 'css3d-object';
    this.wrap.style.width = `${pxWidth}px`;
    this.wrap.style.height = `${this.pxHeight}px`;
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    this.iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    this.wrap.appendChild(this.iframe);
    layer.camera.appendChild(this.wrap);

    // Plane behind the iframe: notice when the DOM is not visible (VR/AR)
    const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0d1120'; ctx.fillRect(0, 0, 1024, 576);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = `700 54px ${FONT_UI}`;
    ctx.fillText('<iframe> = DOM, not WebGL', 512, 260);
    ctx.fillStyle = '#9aa5c4'; ctx.font = `500 30px ${FONT_UI}`;
    ctx.fillText('Visible on desktop and mobile; not inside a VR/AR headset.', 512, 320);
    this.el.setObject3D('mesh', new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: makeCanvasTexture(c), toneMapped: false })));

    this.matrix = new THREE.Matrix4();
    this.scale = new THREE.Matrix4().makeScale(width / pxWidth, width / pxWidth, width / pxWidth);
    this.viewPos = new THREE.Vector3();
  },

  update(old) {
    if (old.src === this.data.src) return;
    this.iframe.title = this.data.title;
    this.iframe.src = this.data.src || 'about:blank';
  },

  /** Is the entity (and every ancestor) visible and open? */
  shown() {
    for (let o = this.el.object3D; o; o = o.parent) {
      if (!o.visible || o.scale.x < 0.2) return false;
    }
    return true;
  },

  tock() {
    const scene = this.el.sceneEl, camera = scene.camera;
    const xr = scene.is('vr-mode') || scene.is('ar-mode');
    // Hidden if closed, in XR, with the Inspector open or behind the camera
    this.viewPos.setFromMatrixPosition(this.el.object3D.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    const visible = !!this.data.src && !xr && !isInspectorOpen() && this.shown() && this.viewPos.z < 0;
    this.wrap.style.display = visible ? '' : 'none';
    if (!visible) return;
    layer.sync(camera, scene.canvas);
    this.matrix.copy(this.el.object3D.matrixWorld).multiply(this.scale);
    this.wrap.style.transform = objectCSS(this.matrix.elements);
  },

  remove() {
    this.wrap.remove();
    this.el.removeObject3D('mesh');
  }
});

/** Dialog buttons: load a URL in the screen, open or close the dialog */
AFRAME.registerComponent('iframe-control', {
  schema: {
    screen: { type: 'selector' },
    dialog: { type: 'selector' },
    action: { default: 'load', oneOf: ['load', 'open', 'close'] },
    src: { default: '' },
    title: { default: '' }
  },

  init() {
    this.el.classList.add('clickable');
    this.el.addEventListener('click', e => {
      const { screen, dialog, action, src, title } = this.data;
      if (action === 'open') {
        openDialog(dialog);
        // Lazy: nothing is downloaded until the dialog opens
        if (!screen.getAttribute('html-iframe').src) screen.setAttribute('html-iframe', { src, title });
      } else if (action === 'close') {
        closeDialog(dialog);
      } else {
        screen.setAttribute('html-iframe', { src, title });
      }
      MuseumLog.add('click', `iframe ${action}${title ? ` (${title})` : ''}`, e);
    });
  }
});

/** Closing the dialog unloads the iframe (stops YouTube audio) */
AFRAME.registerComponent('iframe-dialog', {
  schema: { screen: { type: 'selector' } },
  init() {
    this.el.addEventListener('dialog-closed', () => this.data.screen.setAttribute('html-iframe', 'src', ''));
  }
});
