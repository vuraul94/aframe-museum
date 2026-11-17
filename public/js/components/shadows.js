/**
 * Shadow budget: only the lights of the current room update their shadow maps.
 *
 * A light with castShadow re-renders the shadow casters every frame (a point
 * light 6 times, once per cube face), even when you are in another room and
 * cannot see its shadows. Here the maps of other rooms' lights are frozen
 * (shadow.autoUpdate = false) and resume when you walk or jump back in.
 * Changing autoUpdate does not recompile shaders (castShadow would).
 *
 * Goes on <a-scene>; works in both versions.
 */
AFRAME.registerComponent('shadow-budget', {
  init() {
    this.refresh = this.refresh.bind(this);
    ['station-changed', 'room-loaded', 'loaded'].forEach(ev => this.el.addEventListener(ev, this.refresh));
  },

  refresh() {
    const current = this.el.systems.museum?.current;
    this.el.querySelectorAll('[light]').forEach(el => {
      const light = el.components.light?.light;
      if (!light || !light.castShadow) return;
      const room = el.closest('[museum-station]');
      const raw = room?.getAttributeNode('museum-station')?.value || '';
      const index = room ? +(/index:\s*(\d+)/.exec(raw) || [])[1] : current;
      const active = index === current;
      if (light.shadow.autoUpdate !== active) {
        light.shadow.autoUpdate = active;
        light.shadow.needsUpdate = true;   // one last (or first) render of the map
      }
    });
  }
});
