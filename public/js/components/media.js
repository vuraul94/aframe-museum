/**
 * Station 5 · Spatial audio.
 * The sound is synthesized in JS (WAV → Blob URL) and played with the
 * `sound` component (THREE.PositionalAudio). An analyser animates bars.
 */
import { createMelodyWavUrl } from '../lib/procedural.js';
import { MuseumLog } from '../core/feedback.js';

/** Assigns a code-generated melody to the <a-sound> */
AFRAME.registerComponent('procedural-audio', {
  init() {
    this.el.setAttribute('sound', {
      src: createMelodyWavUrl(),
      loop: true, positional: true, autoplay: false,
      refDistance: 2, rolloffFactor: 1, distanceModel: 'inverse', volume: 1.2
    });
  }
});

function setPlaying(soundEl, playing, e) {
  const snd = soundEl.components.sound;
  if (!snd) return;
  // Browsers suspend the AudioContext until a user gesture
  try { const ctx = THREE.AudioContext.getContext(); if (ctx.state === 'suspended') ctx.resume(); } catch { /* no Web Audio */ }
  playing ? snd.playSound() : snd.stopSound();
  soundEl._playing = playing;
  document.querySelectorAll('[audio-toggle][ui-button]').forEach(b =>
    b.setAttribute('ui-button', { label: playing ? 'Stop' : 'Play', icon: playing ? '■' : '▶' }));
  MuseumLog.add('click', playing ? 'playSound()' : 'stopSound()', e);
}

/** Plays / stops the target sound on click */
AFRAME.registerComponent('audio-toggle', {
  schema: { type: 'selector' },
  init() {
    this.el.classList.add('clickable');
    this.el.addEventListener('click', e => setPlaying(this.data, !this.data._playing, e));
  }
});

/** Bars that react to frequencies (THREE.AudioAnalyser) */
AFRAME.registerComponent('audio-visualizer', {
  schema: { sound: { type: 'selector' }, bars: { default: 12 }, cone: { type: 'selector' } },
  init() {
    this.bars = [];
    for (let i = 0; i < this.data.bars; i++) {
      const b = document.createElement('a-box');
      b.setAttribute('width', 0.05); b.setAttribute('depth', 0.05); b.setAttribute('height', 1);
      b.setAttribute('position', `${(i - (this.data.bars - 1) / 2) * 0.07} 0 0`);
      b.setAttribute('material', { color: '#7b61ff', emissive: '#7b61ff', emissiveIntensity: 0.6 });
      this.el.appendChild(b);
      this.bars.push(b);
    }
  },
  tick(time) {
    const soundEl = this.data.sound;
    const snd = soundEl?.components.sound;
    if (!this.analyser && soundEl?._playing && snd?.pool?.children.length) {
      try { this.analyser = new THREE.AudioAnalyser(snd.pool.children[0], 64); } catch { /* no buffer yet */ }
    }
    const freq = this.analyser && soundEl._playing ? this.analyser.getFrequencyData() : null;
    let sum = 0;
    this.bars.forEach((b, i) => {
      const v = freq ? freq[i + 1] / 255 : 0.08 + 0.04 * Math.sin(time / 400 + i);
      sum += v;
      b.object3D.scale.y = 0.02 + v * 0.6;
      b.object3D.position.y = b.object3D.scale.y / 2;
    });
    this.data.cone?.object3D.scale.setScalar(1 + (sum / this.bars.length) * 0.25);
  }
});
