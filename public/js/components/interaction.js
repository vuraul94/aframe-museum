/**
 * Station 4 · Exhibits that react to mouseenter / mouseleave / click.
 * Events are emitted by the `cursor` component (mouse, gaze or VR laser).
 */
import { togglePanel, MuseumLog } from '../core/feedback.js';

AFRAME.registerComponent('interactive-exhibit', {
  schema: {
    panel: { type: 'selector' },
    label: { default: 'exhibit' },
    colors: { type: 'array', default: ['#2ec4b6', '#ff9f1c', '#ef2d5e', '#7b61ff', '#4cc9f0'] }
  },

  init() {
    this.ci = 0;
    this.base = this.el.object3D.scale.clone();
    this.el.classList.add('clickable');
    this.onEnter = this.onEnter.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.onClick = this.onClick.bind(this);
    this.el.addEventListener('mouseenter', this.onEnter);
    this.el.addEventListener('mouseleave', this.onLeave);
    this.el.addEventListener('click', this.onClick);
  },

  remove() {
    this.el.removeEventListener('mouseenter', this.onEnter);
    this.el.removeEventListener('mouseleave', this.onLeave);
    this.el.removeEventListener('click', this.onClick);
  },

  scaleTo(factor) {
    const s = this.base.clone().multiplyScalar(factor);
    this.el.setAttribute('animation__hover',
      { property: 'scale', to: `${s.x} ${s.y} ${s.z}`, dur: 220, easing: 'easeOutQuad' }, true);
  },

  onEnter(e) {
    this.scaleTo(1.2);
    this.el.setAttribute('material', { emissive: '#ffffff', emissiveIntensity: 0.18 });
    MuseumLog.add('mouseenter', this.data.label, e);
  },

  onLeave(e) {
    this.scaleTo(1);
    this.el.setAttribute('material', { emissive: '#000000', emissiveIntensity: 0 });
    MuseumLog.add('mouseleave', this.data.label, e);
  },

  onClick(e) {
    this.ci = (this.ci + 1) % this.data.colors.length;
    this.el.setAttribute('material', 'color', this.data.colors[this.ci]);
    togglePanel(this.data.panel);
    MuseumLog.add('click', this.data.label, e);
  }
});
