/**
 * Station 1 · Setup: scene-wide settings are just components on <a-scene>.
 * `scene-toggle` adds / removes one of them live (fog, stats, background).
 */
import { MuseumLog } from '../core/feedback.js';

/** What each toggle sets on the scene when switched on */
const PRESETS = {
  fog: 'type: linear; color: #0b0f1a; near: 3; far: 16',
  stats: '',
  background: 'color: #1d3557'
};

AFRAME.registerComponent('scene-toggle', {
  schema: { type: 'string', oneOf: Object.keys(PRESETS) },

  init() {
    this.el.classList.add('clickable');
    this.el.addEventListener('click', e => {
      const scene = this.el.sceneEl, name = this.data;
      const on = !scene.hasAttribute(name);
      on ? scene.setAttribute(name, PRESETS[name]) : scene.removeAttribute(name);
      this.render(on);
      MuseumLog.add('click', `<a-scene ${name}> ${on ? 'on' : 'off'}`, e);
    });
    this.render(this.el.sceneEl.hasAttribute(this.data));
  },

  render(on) {
    this.el.setAttribute('ui-button', { label: `${this.data}: ${on ? 'on' : 'off'}`, icon: on ? '●' : '○' });
  }
});
