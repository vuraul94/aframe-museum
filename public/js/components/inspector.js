/**
 * A-Frame Inspector integration (the official visual editor).
 *
 * The scene's `inspector` component already registers Ctrl+Alt+I and loads
 * the bundle on demand from the configured URL (served by our server
 * at /vendor/aframe-inspector.min.js, with offline caching).
 * Here we add: opening with a preselected entity, and a 3D button.
 */
import { toast, MuseumLog } from '../core/feedback.js';

export const isInspectorOpen = () =>
  document.body.classList.contains('aframe-inspector-opened') || !!(window.AFRAME.INSPECTOR && AFRAME.INSPECTOR.opened);

export function openInspector(entity) {
  if (document.pointerLockElement) document.exitPointerLock();
  // Already loaded: A-Frame exposes the editor as AFRAME.INSPECTOR (and removes the component)
  if (window.AFRAME.INSPECTOR) {
    AFRAME.INSPECTOR.open(entity || undefined);
    return;
  }
  const insp = document.querySelector('a-scene')?.components.inspector;
  if (!insp) { toast('The inspector component is not available'); return; }
  toast('Opening A-Frame Inspector… (Ctrl+Alt+I to return)');
  insp.openInspector(entity || undefined);
}

/** 3D button: opens the Inspector with the target entity selected */
AFRAME.registerComponent('open-inspector', {
  schema: { type: 'selector' },
  init() {
    this.el.addEventListener('click', e => {
      MuseumLog.add('click', 'openInspector()', e);
      openInspector(this.data);
    });
  }
});
