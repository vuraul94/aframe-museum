/**
 * Station 5 · Video in a 3D dialog.
 *
 * The <video> element lives in the HTML (outside <a-assets> so it does not
 * block the scene load) with two <source>s: H.264 (.m4v) and a VP9 (.webm)
 * fallback for browsers without H.264. <a-video> turns it into a
 * THREE.VideoTexture. Browsers only allow playback with sound after a user
 * gesture, so the video starts with the click on "Play".
 */
import { FONT_UI } from '../config.js';
import { makeCanvasTexture } from '../lib/canvas.js';
import { MuseumLog } from '../core/feedback.js';
import { openDialog, closeDialog } from './dialog.js';

/**
 * Progress bar + status overlay (loading, ready, buffering, error) on top of
 * the video, so it is always clear what the video is doing.
 * Goes on the dialog entity, next to dialog-frame.
 */
AFRAME.registerComponent('video-dialog', {
  schema: {
    video: { type: 'selector' },
    accent: { default: '#7b61ff' },
    videoWidth: { default: 2.6 }
  },

  init() {
    const { videoWidth: vw, accent } = this.data;
    const vh = vw * 9 / 16;

    // Progress bar (scale.x = currentTime / duration)
    const y = -vh / 2 - 0.07;
    const track = new THREE.Mesh(new THREE.PlaneGeometry(vw, 0.025),
      new THREE.MeshBasicMaterial({ color: '#2a3148', toneMapped: false }));
    track.position.set(0, y, 0);
    this.bar = new THREE.Mesh(new THREE.PlaneGeometry(vw, 0.025).translate(vw / 2, 0, 0),
      new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }));
    this.bar.position.set(-vw / 2, y, 0.002);
    this.bar.scale.x = 0.0001;

    // Status overlay: canvas covering the video
    this.statusCanvas = document.createElement('canvas');
    this.statusCanvas.width = 1024; this.statusCanvas.height = 576;
    this.statusTex = makeCanvasTexture(this.statusCanvas);
    this.status = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh),
      new THREE.MeshBasicMaterial({ map: this.statusTex, transparent: true, toneMapped: false }));
    this.status.position.set(0, 0, 0.012);
    this.el.object3D.add(track, this.bar, this.status);

    const v = this.data.video;
    if (!v) return this.setStatus('No <video> element', '#ff6b6b');
    const sources = [...v.querySelectorAll('source')];
    const onProgress = () => {
      if (!v.paused) return;
      const pct = v.duration && v.buffered.length ? Math.round(100 * v.buffered.end(v.buffered.length - 1) / v.duration) : 0;
      if (v.readyState >= 3) this.setStatus('▶  Ready · press Play', '#ffffff', `${pct}% buffered`);
      else this.setStatus('Loading video…', '#ffffff', pct ? `${pct}%` : v.currentSrc.split('/').pop());
    };
    ['loadstart', 'progress', 'loadedmetadata', 'canplay', 'canplaythrough'].forEach(ev => v.addEventListener(ev, onProgress));
    v.addEventListener('playing', () => this.setStatus(null));
    v.addEventListener('waiting', () => this.setStatus('Buffering…', '#ffffff'));
    v.addEventListener('pause', () => { if (!v.ended && v.readyState >= 2) this.setStatus('❚❚  Paused', '#ffffff'); });
    // With <source> children the error fires on the last <source>, not on <video>
    const onError = () => this.setStatus('Could not load the video', '#ff6b6b',
      'Check the server log (404?). Formats tried: ' + sources.map(s => s.type.split(';')[0]).join(', '));
    (sources.at(-1) || v).addEventListener('error', onError);
    if (v.error) onError(); else onProgress();
    // Nothing after 8 s → say so instead of a silent black square
    setTimeout(() => { if (v.readyState < 2 && !v.error) this.setStatus('Still loading…', '#ffd166', 'Is the server running? Is the file in assets/media?'); }, 8000);
  },

  /** Draws (or hides, with null) the status message over the video */
  setStatus(text, color = '#ffffff', detail = '') {
    this.status.visible = !!text;
    if (!text) return;
    const ctx = this.statusCanvas.getContext('2d'), W = 1024, H = 576;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(8, 10, 20, 0.72)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.font = `700 64px ${FONT_UI}`;
    ctx.fillText(text, W / 2, H / 2, W - 80);
    if (detail) { ctx.fillStyle = '#aab4d0'; ctx.font = `500 30px ${FONT_UI}`; ctx.fillText(detail, W / 2, H / 2 + 60, W - 80); }
    this.statusTex.needsUpdate = true;
  },

  tick() {
    const v = this.data.video;
    if (!v) return;
    if (v.duration) this.bar.scale.x = Math.max(0.0001, v.currentTime / v.duration);
    // Closed dialog → no sound in the background
    if (!this.el._open && !v.paused) v.pause();
  }
});

/** Dialog buttons: toggle (play/pause), restart, open and close */
AFRAME.registerComponent('video-control', {
  schema: {
    video: { type: 'selector' },
    action: { default: 'toggle', oneOf: ['toggle', 'restart', 'open', 'close'] },
    dialog: { type: 'selector' }
  },

  init() {
    const v = this.data.video;
    this.el.classList.add('clickable');
    this.el.addEventListener('click', e => this.run(e));
    if (this.data.action === 'toggle' && v) {
      const sync = () => this.el.setAttribute('ui-button', v.paused
        ? { label: 'Play', icon: '▶' } : { label: 'Pause', icon: '❚❚' });
      v.addEventListener('play', sync);
      v.addEventListener('pause', sync);
    }
  },

  run(e) {
    const { video: v, action, dialog } = this.data;
    if (action === 'open') { openDialog(dialog); MuseumLog.add('click', 'video dialog (open)', e); return; }
    if (action === 'close') { v?.pause(); closeDialog(dialog); MuseumLog.add('click', 'video dialog (close)', e); return; }
    if (!v) return;
    if (action === 'restart') v.currentTime = 0;
    if (action === 'toggle' && !v.paused) { v.pause(); MuseumLog.add('click', 'video.pause()', e); return; }
    v.play().catch(err => {
      console.warn('Video playback failed:', err.message);
      this.el.closest('[video-dialog]')?.components['video-dialog'].setStatus('Playback failed', '#ff6b6b', err.message);
    });
    MuseumLog.add('click', 'video.play()', e);
  }
});
