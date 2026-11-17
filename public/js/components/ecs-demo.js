/**
 * Station 2 · Live ECS demo.
 * Simple components (spin, bob, color-cycle) added to and removed from
 * an entity at runtime, plus a panel that mirrors its state.
 */
import { PANELS } from '../content/panels.js';
import { MuseumLog } from '../core/feedback.js';

/** Continuous rotation around an axis */
AFRAME.registerComponent('spin', {
  schema: { speed: { default: 45 }, axis: { default: 'y', oneOf: ['x', 'y', 'z'] } },
  tick(time, dt) {
    this.el.object3D.rotation[this.data.axis] += THREE.MathUtils.degToRad(this.data.speed) * dt / 1000;
  }
});

/** Sinusoidal vertical bobbing */
AFRAME.registerComponent('bob', {
  schema: { height: { default: 0.25 }, speed: { default: 1.2 } },
  init() { this.baseY = this.el.object3D.position.y; },
  tick(time) {
    this.el.object3D.position.y = this.baseY + Math.sin(time / 1000 * this.data.speed * Math.PI * 2) * this.data.height;
  },
  remove() { this.el.object3D.position.y = this.baseY; }
});

/** HSL color cycle applied directly to the Three.js material */
AFRAME.registerComponent('color-cycle', {
  schema: { speed: { default: 0.15 } },
  tick(time) {
    const mesh = this.el.getObject3D('mesh');
    if (mesh?.material?.color) mesh.material.color.setHSL((time / 1000 * this.data.speed) % 1, 0.75, 0.55);
  },
  remove() {
    const mesh = this.el.getObject3D('mesh');
    const mat = this.el.getAttribute('material');
    if (mesh && mat) mesh.material.color.set(mat.color);
  }
});

/** Data the button uses when adding each component */
const PRESETS = {
  spin: { speed: 90 },
  bob: { height: 0.22, speed: 0.8 },
  'color-cycle': { speed: 0.2 }
};

/** Button that adds/removes a component on the target entity */
AFRAME.registerComponent('ecs-toggle', {
  schema: { target: { type: 'selector' }, component: { type: 'string' } },
  init() {
    this.el.addEventListener('click', e => {
      const { target, component } = this.data;
      if (target.hasAttribute(component)) target.removeAttribute(component);
      else target.setAttribute(component, PRESETS[component] || '');
      this.refreshLabel();
      const verb = target.hasAttribute(component) ? 'setAttribute' : 'removeAttribute';
      MuseumLog.add('click', `${verb}('${component}')`, e);
    });
    this.refreshLabel();
  },
  refreshLabel() {
    const on = this.data.target?.hasAttribute(this.data.component);
    this.el.setAttribute('ui-button', { label: this.data.component, icon: on ? '−' : '+' });
  }
});

/** Panel that lists an entity's components live (use with canvas-panel="id: inspector") */
AFRAME.registerComponent('ecs-inspector', {
  schema: { type: 'selector' },
  init() {
    this.refresh = AFRAME.utils.throttle(this.refresh, 100, this);
    const t = this.data;
    ['componentinitialized', 'componentremoved', 'componentchanged', 'loaded'].forEach(ev =>
      t.addEventListener(ev, e => {
        if (ev === 'componentchanged' && /position|rotation|scale/.test(e.detail.name)) return;
        this.refresh();
      }));
    setTimeout(() => this.refresh(), 300);
  },
  refresh() {
    const t = this.data;
    const lines = [`<a-box id="${t.id}"`];
    for (const name of Object.keys(t.components)) {
      if (/^(visible|position|rotation|scale)$/.test(name)) continue;
      const attr = t.getDOMAttribute(name);
      let s = attr && typeof attr === 'object' ? AFRAME.utils.styleParser.stringify(attr) : String(attr ?? '');
      s = s.replace(/;\s*$/, '');
      if (s.length > 34) s = s.slice(0, 33) + '…';
      lines.push(`  ${name}="${s}"`);
    }
    lines.push('></a-box>');
    PANELS.inspector.code = lines;
    this.el.components['canvas-panel']?.refresh();
  }
});

/** 3×3 grid of PBR spheres created in code (document.createElement) */
AFRAME.registerComponent('pbr-grid', {
  schema: { color: { default: '#f2c46d' }, spacing: { default: 0.55 }, radius: { default: 0.21 } },
  init() {
    const values = [0, 0.5, 1];
    values.forEach((roughness, row) => values.forEach((metalness, col) => {
      const s = document.createElement('a-sphere');
      s.setAttribute('radius', this.data.radius);
      s.setAttribute('position', `${(col - 1) * this.data.spacing} ${(2 - row) * this.data.spacing} 0`);
      s.setAttribute('material', { color: this.data.color, metalness, roughness: Math.max(0.04, roughness) });
      s.setAttribute('shadow', 'cast: true');
      this.el.appendChild(s);
    }));
  }
});
