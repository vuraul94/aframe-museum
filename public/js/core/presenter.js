/**
 * Presenter mode: timer, 2D HUD and keyboard shortcuts.
 *
 *  1–5 / N P / PgDn PgUp : stations (works with presentation clickers)
 *  I : open/close station panels                E : A-Frame Inspector
 *  G : gaze cursor         T / R : timer        H : hide HUD
 */
import { ACCENTS, TALK_DURATION } from '../config.js';
import { toast } from './feedback.js';
import { openInspector, isInspectorOpen } from '../components/inspector.js';

const TIMER_KEY = 'aframe-museum-timer';

/**
 * Talk timer. Its state is kept in sessionStorage so it keeps counting
 * across page loads in the multi-scene version (one page per room).
 */
export const Timer = {
  total: TALK_DURATION, left: TALK_DURATION, running: false, iv: null,
  toggle() { this.running ? this.pause() : this.start(); },
  save() {
    try { sessionStorage.setItem(TIMER_KEY, JSON.stringify({ left: this.left, running: this.running, at: Date.now() })); } catch { /* private mode */ }
  },
  restore() {
    try {
      const s = JSON.parse(sessionStorage.getItem(TIMER_KEY));
      if (!s) return;
      this.left = Math.max(0, s.left - (s.running ? Math.round((Date.now() - s.at) / 1000) : 0));
      if (s.running && this.left) this.start();
      this.render();
    } catch { /* nothing saved */ }
  },
  start() {
    if (this.running) return;
    this.running = true;
    this.iv = setInterval(() => {
      this.left = Math.max(0, this.left - 1);
      this.render();
      this.save();
      if (!this.left) { this.pause(); toast('⏰ Time!'); }
    }, 1000);
    this.render(); this.save();
  },
  pause() { this.running = false; clearInterval(this.iv); this.render(); this.save(); },
  reset() { this.pause(); this.left = this.total; this.render(); this.save(); },
  render() {
    const el = document.getElementById('timer');
    if (!el) return;
    const mm = String(Math.floor(this.left / 60)).padStart(2, '0');
    const ss = String(this.left % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
    el.classList.toggle('running', this.running);
    el.classList.toggle('warn', this.left <= 60);
  }
};

/** Common start-up once the scene is ready (both versions) */
export function onSceneReady(scene) {
  const ready = () => {
    Timer.restore();
    // On mobile (no mouse) enable the gaze cursor by default
    if (AFRAME.utils.device.isMobile()) toggleGaze(true, true);
  };
  scene.hasLoaded ? ready() : scene.addEventListener('loaded', ready);
}

/** Toggles the gaze (fuse) cursor attached to the camera */
export function toggleGaze(force, silent = false) {
  const g = document.getElementById('gaze');
  if (!g) return;
  const on = force !== undefined ? force : !g.getAttribute('raycaster').enabled;
  g.setAttribute('raycaster', 'enabled', on);
  g.object3D.visible = on;
  if (!silent) toast(on ? 'Gaze cursor (fuse) on' : 'Gaze cursor off');
}

/** Scene component: wires keyboard and HUD to the museum system */
AFRAME.registerComponent('station-nav', {
  init() {
    this.museum = this.el.sceneEl.systems.museum;
    this.onKey = this.onKey.bind(this);
    window.addEventListener('keydown', this.onKey);
    this.bindHud();
    this.el.addEventListener('station-changed', e => this.highlight(e.detail.index));
    Timer.render();
  },

  remove() { window.removeEventListener('keydown', this.onKey); },

  bindHud() {
    const click = (sel, fn) => document.querySelectorAll(sel).forEach(b =>
      b.addEventListener('click', () => { fn(b); b.blur(); }));
    click('#hud [data-station]', b => this.museum.goTo(+b.dataset.station));
    click('#timer', () => Timer.toggle());
    click('#inspectorBtn', () => openInspector());
  },

  highlight(index) {
    // The "⇄" link opens the same room in the other version
    const link = document.getElementById('modeLink');
    if (link && !this.museum.roomMode) link.href = `room.html?station=${index + 1}`;
    document.querySelectorAll('#hud [data-station]').forEach(b => {
      const active = +b.dataset.station === index;
      b.classList.toggle('active', active);
      if (active) b.style.setProperty('--accent', ACCENTS[index]);
    });
  },

  onKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;   // Ctrl+Alt+I is handled by the Inspector
    if (isInspectorOpen()) return;                                // don't interfere with the editor
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const m = this.museum;
    const actions = {
      PageDown: () => m.next(), n: () => m.next(),
      PageUp: () => m.prev(), p: () => m.prev(),
      i: () => m.togglePanelsOfCurrent(),
      e: () => openInspector(),
      g: () => toggleGaze(),
      t: () => Timer.toggle(),
      r: () => Timer.reset(),
      h: () => document.body.classList.toggle('hud-hidden')
    };
    if (k >= '1' && k <= '5') m.goTo(+k - 1);
    else if (actions[k]) actions[k]();
  }
});
