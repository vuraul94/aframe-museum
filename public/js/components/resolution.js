/**
 * Dynamic resolution: trades sharpness for frame rate when the GPU struggles.
 *
 * On integrated GPUs a full-HD canvas with antialiasing and PBR materials is
 * fill-rate bound: halving the resolution doubles the FPS. Every second this
 * component looks at the average frame rate and lowers the pixel ratio a step
 * below `low` FPS, or raises it back above `high`, between `min` and the
 * device's own ratio. Not used in VR/AR (the headset sets its own resolution).
 *
 * Goes on <a-scene>. Modes:
 *  - dynamic-resolution="min: 0.75"           adaptive (GitHub Pages build)
 *  - dynamic-resolution="min: 0.75; fixed: 1" always ratio 1 (local, npm start)
 * The URL wins over the attribute: ?quality=auto or ?quality=1 / 0.75 / …
 */
AFRAME.registerComponent('dynamic-resolution', {
  schema: {
    enabled: { default: true },
    low: { default: 40 },     // FPS below this → lower the resolution
    high: { default: 55 },    // FPS above this → raise it
    min: { default: 0.5 },    // lowest pixel ratio
    step: { default: 0.1 },
    fixed: { default: 0 }     // > 0: constant pixel ratio, no adapting
  },

  init() {
    this.frames = 0;
    this.since = performance.now();
    this.max = Math.min(window.devicePixelRatio || 1, 2);
    const q = new URLSearchParams(location.search).get('quality');
    this.fixed = q === 'auto' ? 0 : parseFloat(q) > 0 ? parseFloat(q) : this.data.fixed;
    const apply = () => { if (this.fixed) this.el.renderer.setPixelRatio(this.fixed); };
    this.el.renderer ? apply() : this.el.addEventListener('render-target-loaded', apply);
  },

  tick() {
    const scene = this.el;
    if (!this.data.enabled || this.fixed || !scene.renderer || scene.is('vr-mode') || scene.is('ar-mode')) return;
    this.frames++;
    const now = performance.now(), elapsed = now - this.since;
    if (elapsed < 1000) return;
    const fps = this.frames * 1000 / elapsed;
    this.frames = 0; this.since = now;

    const { low, high, min, step } = this.data;
    const ratio = scene.renderer.getPixelRatio();
    let next = ratio;
    if (fps < low && ratio > min) next = Math.max(min, ratio - step);
    else if (fps > high && ratio < this.max) next = Math.min(this.max, ratio + step);
    if (next !== ratio) {
      scene.renderer.setPixelRatio(next);
      scene.emit('resolution-changed', { ratio: next, fps: Math.round(fps) });
    }
  }
});
