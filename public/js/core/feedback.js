/**
 * Shared feedback: HUD toasts, 3D panel pop-ups
 * and the live event log (station 3).
 */
import { PANELS } from '../content/panels.js';

/** Temporary message at the bottom of the screen */
export function toast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

/** Opens / closes a panel with a scale animation (animation component) */
export function togglePanel(panel, force) {
  if (!panel) return false;
  const open = force !== undefined ? force : !panel._open;
  if (open === !!panel._open) return open;
  panel._open = open;
  clearTimeout(panel._hideT);
  if (open) {
    panel.object3D.visible = true;
    panel.setAttribute('animation__pop',
      { property: 'scale', from: '0.001 0.001 0.001', to: '1 1 1', dur: 380, easing: 'easeOutBack' }, true);
  } else {
    panel.setAttribute('animation__pop',
      { property: 'scale', from: '1 1 1', to: '0.001 0.001 0.001', dur: 200, easing: 'easeInQuad' }, true);
    panel._hideT = setTimeout(() => { if (!panel._open) panel.object3D.visible = false; }, 220);
  }
  return open;
}

const CURSOR_NAMES = { gaze: 'gaze', leftHand: 'left laser', rightHand: 'right laser' };

/** Event log rendered on the #event-log panel */
export const MuseumLog = {
  entries: [],
  source(e) {
    const c = e && e.detail && e.detail.cursorEl;
    if (!c) return '';
    if (c.tagName === 'A-SCENE') return 'mouse';
    return CURSOR_NAMES[c.id] || c.id || 'cursor';
  },
  add(type, label, e) {
    const d = new Date();
    const ts = `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const src = this.source(e);
    this.entries.unshift(`${ts}  ${type} → ${label}${src ? ` (${src})` : ''}`);
    this.entries.length = Math.min(this.entries.length, 9);
    PANELS.log.code = this.entries;
    clearTimeout(this._t);
    this._t = setTimeout(() => {
      const el = document.getElementById('event-log');
      el?.components['canvas-panel']?.refresh();
    }, 60);
  }
};
