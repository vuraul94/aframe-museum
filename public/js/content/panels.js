/**
 * Content for all 3D panels (presentation text).
 * Each panel supports: kicker, title, body[] (lines starting with "• " = bullet),
 * code[] (auto-highlighted), footer and accent.
 * Ids are referenced from index.html via canvas-panel="id: ...".
 */
import { ACCENTS } from '../config.js';

const [A0, A1, A2, A3, A4, A5, A6] = ACCENTS;

export const PANELS = {
  /* ───────────── Station 1 · Welcome and setup ───────────── */
  'setup-title': { kicker: 'Station 1 · Welcome and setup', title: 'Welcome to A-Frame', accent: A0 },
  'setup-include': {
    kicker: 'Step 1', accent: A0, title: 'Add A-Frame to a page',
    body: [
      '• CDN: one <script> in the <head>, before the scene. Nothing else to install.',
      '• npm: npm install aframe and import it in your bundle (Vite, webpack…).',
      '• It ships its own Three.js (1.7 → r173), exposed as AFRAME.THREE and window.THREE.',
      'Serve the page over HTTP, not file:// (press "Serving").'
    ],
    code: [
      '<head>',
      '  <script src="https://aframe.io/',
      '    releases/1.7.1/aframe.min.js"></script>',
      '</head>',
      '',
      '# or with npm',
      'npm install aframe',
      "import 'aframe';"
    ]
  },
  'setup-serve': {
    kicker: 'Serving', accent: A0, title: 'Local server, HTTPS and devices',
    body: [
      '• file:// breaks models, textures and fonts (CORS): always use a local server.',
      '• WebXR needs HTTPS outside localhost: a certificate (npm run cert here) or a host such as GitHub Pages.',
      '• No headset? Immersive Web Emulator in Chrome DevTools simulates VR and AR.'
    ],
    code: [
      'npx serve .                 # any folder',
      'python3 -m http.server 8080',
      'npm start                   # this museum'
    ]
  },
  'setup-hello': {
    kicker: 'Step 2', accent: A0, title: 'Hello WebXR: the minimal scene',
    body: [
      'The model in front of you is exactly this code, scaled down. <a-scene> creates the renderer, the camera with look and WASD controls, the render loop and the VR/AR buttons by itself.'
    ],
    code: [
      '<a-scene>',
      '  <a-box position="-1 0.5 -3" rotation="0 45 0"',
      '         color="#4CC3D9"></a-box>',
      '  <a-sphere position="0 1.25 -5" radius="1.25"',
      '            color="#EF2D5E"></a-sphere>',
      '  <a-cylinder position="1 0.75 -3" radius="0.5"',
      '              height="1.5" color="#FFC65D"></a-cylinder>',
      '  <a-plane position="0 0 -4" rotation="-90 0 0"',
      '           width="4" height="4" color="#7BC8A4"></a-plane>',
      '  <a-sky color="#ECECEC"></a-sky>',
      '</a-scene>'
    ]
  },
  'setup-scene': {
    kicker: '<a-scene>', accent: A0, title: 'Configuring the scene',
    body: [
      'Scene-wide settings are components on <a-scene>:',
      '• renderer: antialias, colorManagement, toneMapping',
      '• background, fog, shadow, stats',
      '• webxr + xr-mode-ui: XR features and the VR/AR buttons',
      '• inspector, loading-screen, embedded (inside a page layout)',
      'Try fog and stats: they switch on live. With fog on, rooms hidden by it are not even loaded (watch Textures in stats).'
    ],
    code: [
      '<a-scene',
      '  renderer="antialias: true; colorManagement: true"',
      '  shadow="type: pcfsoft"',
      '  fog="type: linear; color: #0B0F1A; far: 16"',
      '  stats',
      '  webxr="optionalFeatures: hit-test"',
      '  xr-mode-ui="XRMode: xr">'
    ]
  },
  'setup-defaults': {
    kicker: 'Defaults and assets', accent: A0, title: 'Camera, assets and your own code',
    body: [
      '• No camera in the markup? A-Frame adds one at 1.6 m with look-controls and wasd-controls.',
      '• <a-assets> preloads images, models and media before the first frame (with a timeout).',
      '• Register your components before <a-scene> is parsed: a <script> above it, or ES modules (they run before DOMContentLoaded).'
    ],
    code: [
      '<a-assets timeout="3000">',
      '  <img id="wood" src="wood.jpg">',
      '  <a-asset-item id="fox" src="fox.glb">',
      '  </a-asset-item>',
      '</a-assets>',
      '<a-entity camera look-controls wasd-controls',
      '  position="0 1.6 0"></a-entity>',
      '<a-entity gltf-model="#fox"></a-entity>'
    ]
  },

  /* ───────────── Station 2 · Components ───────────── */
  's1-title': { kicker: 'Station 2 · Components', title: 'Primitives, materials and live components', accent: A1 },
  welcome: {
    kicker: 'Welcome', accent: A0,
    title: 'A-Frame: 3D, VR and AR with HTML',
    body: [
      'Open source (MIT) web framework built on Three.js. Born in the Mozilla VR team, now maintained by the community.',
      '• Declarative: scenes built with tags like <a-scene> or <a-box>.',
      '• Extensible: Entity-Component-System pattern.',
      '• Cross-platform: desktop, mobile, VR and AR headsets via WebXR.'
    ],
    footer: 'This museum IS the presentation: every room is a slide.'
  },
  prim: {
    kicker: 'Primitives', accent: A1, title: 'Primitive = entity + components',
    body: [
      '<a-box>, <a-sphere> and <a-cylinder> are shortcuts: the DOM maps to the geometry + material components.',
      'PBR material by default (standard shader): color, metalness and roughness.'
    ],
    code: [
      '<a-box color="#EF2D5E"',
      '       metalness="0.2" roughness="0.4">',
      '</a-box>',
      '<!-- equivalent to: -->',
      '<a-entity geometry="primitive: box"',
      '  material="color: #EF2D5E;',
      '            metalness: 0.2; roughness: 0.4">',
      '</a-entity>'
    ]
  },
  ecs: {
    kicker: 'Architecture', accent: A1, title: 'Entity · Component · System',
    body: [
      '• Entity: empty container (<a-entity>) with a Three.js Object3D.',
      '• Component: data + behavior (schema, init, update, tick, remove).',
      '• System: shared global logic (registerSystem). This museum uses one to navigate between stations.',
      'Use the side buttons to add/remove components live.'
    ],
    code: [
      "AFRAME.registerComponent('spin', {",
      "  schema: { speed: { default: 45 } },",
      "  tick(time, dt) {",
      "    const rad = THREE.MathUtils.degToRad(",
      "      this.data.speed) * dt / 1000;",
      "    this.el.object3D.rotation.y += rad;",
      "  }",
      "});",
      "el.setAttribute('spin', 'speed: 90');",
      "el.removeAttribute('spin');"
    ]
  },
  inspector: { kicker: 'Live components', accent: A1, title: 'Entity #ecsDemo', code: ['loading…'] },
  'inspector-tool': {
    kicker: 'Official tool', accent: '#ffd166', title: 'A-Frame Inspector',
    body: [
      'Visual editor built into any scene: entity tree, editable components and gizmos to move, rotate and scale.',
      '• Shortcut: Ctrl + Alt + I (or the E key / "Inspector" button).',
      '• Select #ecsDemo and edit its material live.',
      '• Edits live in memory: see "Save edits" to keep them.',
      'Loaded on demand: zero cost until you open it.'
    ],
    code: [
      '<a-scene inspector="url:',
      '  /vendor/aframe-inspector.min.js">',
      '',
      '// open it from code with an entity',
      '// already selected:',
      "sceneEl.components.inspector",
      "  .openInspector(entity);"
    ]
  },
  'inspector-save': {
    kicker: 'Inspector', accent: '#ffd166', title: 'Saving your edits',
    body: [
      'Inspector changes are in memory only: reloading the page loses them. Three ways to keep them:',
      '• Copy: "Copy entity HTML to clipboard" (entity panel) → paste it into index.html.',
      '• Export: "Export to GLTF" (scene or entity) → a .glb you can load with gltf-model.',
      '• Write to disk: the "Write changes with aframe-watcher" toolbar button POSTs the edit history to localhost:51234. This project\'s server includes that service: it updates the room file (public/rooms/*.html) that defines each entity id, keeping a .bak.'
    ],
    code: [
      '// what the button sends (history.updates)',
      'POST http://localhost:51234/save',
      '{ "ecsDemo": { "position": "0 1.2 0",',
      '  "material": { "color": "#00ff00" } } }',
      '',
      '# official alternative (any project):',
      'npx aframe-watcher'
    ]
  },
  pbr: {
    kicker: 'PBR materials', accent: A1, title: 'Metalness × Roughness',
    body: [
      'Standard shader = Three.js MeshStandardMaterial.',
      '• Columns: metalness 0 → 0.5 → 1',
      '• Rows: roughness 0 (top) → 1 (bottom)',
      'Reflections come from a PMREM environment map generated in code (no external HDR).'
    ],
    code: [
      '<a-sphere material="color: #F2C46D;',
      '  metalness: 1; roughness: 0.1">',
      '</a-sphere>',
      '// procedural-environment component',
      'const pmrem = new THREE.PMREMGenerator(r);',
      'scene.environment =',
      '  pmrem.fromScene(envScene).texture;'
    ]
  },

  /* ───────────── Station 3 · Motion ───────────── */
  's2-title': { kicker: 'Station 3 · Motion', title: 'Animation, light and textures', accent: A2 },
  anim: {
    kicker: 'animation component', accent: A2, title: 'Declarative animations',
    body: [
      'Engine based on anime.js built into A-Frame: animates any property of any component.',
      '• Multiple animations per entity: animation__name',
      '• easing, loop, dir: alternate, startEvents…',
      'Skeletal animations made in other tools? Press "External" and "Blender".'
    ],
    code: [
      '<a-sphere animation="property: position;',
      '  to: 0 1.5 0; dir: alternate;',
      '  loop: true; dur: 900;',
      '  easing: easeOutQuad"></a-sphere>',
      '<a-torus',
      '  animation__color="property: material.color;',
      '    type: color; to: #4CC9F0;',
      '    dir: alternate; loop: true"',
      '  animation__scale="property: scale;',
      '    to: 1.4 1.4 1.4; dir: alternate;',
      '    loop: true"></a-torus>'
    ]
  },
  'anim-external': {
    kicker: 'Non-native assets', accent: A2, title: 'External models and animations',
    body: [
      '• glTF / GLB is the web 3D format: mesh, materials, skeleton and animation clips in one file. Loaded natively by gltf-model.',
      '• Where to get them: Sketchfab, Poly Pizza, Khronos samples (the fox in station 5), or Mixamo: rig a character + mocap clips → FBX → Blender → export .glb.',
      '• A-Frame does not play the clips: use animation-mixer (aframe-extras) or a THREE.AnimationMixer in your own component (gltf-animation here).',
      '• Other formats: obj-model is built in; FBX, USDZ… via Three.js loaders. Optimize with gltf-transform (Draco / Meshopt).'
    ],
    code: [
      '<script src="…/aframe-extras.min.js"></script>',
      '<a-entity gltf-model="url(fox.glb)"',
      '  animation-mixer="clip: Walk;',
      '    crossFadeDuration: 0.4"></a-entity>',
      '// or by hand, in a component:',
      'const mixer = new THREE.AnimationMixer(model);',
      'mixer.clipAction(model.animations[0]).play();',
      'tick(t, dt) { mixer.update(dt / 1000); }'
    ]
  },
  'blender-export': {
    kicker: 'Blender → glTF → A-Frame', accent: '#e87d0d', title: 'Exporting an animation from Blender',
    body: [
      '1. Animate with keyframes: objects, an armature (bones + skinning) or shape keys. Each animation is an Action: give it a clear name (Walk, Run) and push it to the NLA (or mark it Fake User) so it is not lost.',
      '2. Bake what glTF cannot store (constraints, drivers, physics, IK): Object › Animation › Bake Action, with Visual Keying.',
      '3. Apply scale (Ctrl+A). 1 Blender unit = 1 m = 1 A-Frame unit; keep +Y Up.',
      '4. File › Export › glTF 2.0: format glTF Binary (.glb), Animation on, mode "Actions" (one clip per action) or "NLA Tracks". Optional: Draco compression.',
      '5. Check it in a glTF viewer (gltf.report), then load it in A-Frame and play the clips by name.'
    ],
    code: [
      '<a-entity gltf-model="url(walk.glb)"',
      '  animation-mixer="clip: Walk"></a-entity>',
      '<!-- or this museum: gltf-animation="clip: Walk" -->',
      '',
      '<!-- only if exported with Draco: -->',
      '<a-scene gltf-model="dracoDecoderPath:',
      '  https://www.gstatic.com/draco/versioned/decoders/1.5.7/">'
    ]
  },
  light: {
    kicker: 'Lighting', accent: A2, title: 'Dynamic lights and shadows',
    body: [
      '• ambient / hemisphere: global fill',
      '• directional: "sun" with shadows (orthographic camera)',
      '• point: animated orbit with omnidirectional shadow',
      'Shadows are enabled on the scene and per entity (cast / receive).'
    ],
    code: [
      '<a-scene shadow="type: pcfsoft">',
      '<a-entity light="type: point;',
      '  intensity: 3; castShadow: true">',
      '<a-entity light="type: directional;',
      '  castShadow: true; target: #exhibit">',
      '<a-torus-knot shadow="cast: true">',
      '<a-plane shadow="receive: true">'
    ]
  },
  tex: {
    kicker: 'Serverless textures', accent: A2, title: 'Canvas, SVG and Data URIs',
    body: [
      'No external images: no CORS, no broken links.',
      '• Checker and marble: <canvas> + procedural noise',
      '• Plasma: canvas redrawn every frame',
      '• Poster: SVG converted to a Data URI'
    ],
    code: [
      'const tex = new THREE.CanvasTexture(canvas);',
      'tex.colorSpace = THREE.SRGBColorSpace;',
      'mesh.material.map = tex;',
      '// in tick(): redraw and…',
      'tex.needsUpdate = true;',
      '',
      "const uri = 'data:image/svg+xml,' +",
      '  encodeURIComponent(svgString);'
    ]
  },

  /* ───────────── Station 4 · Interaction ───────────── */
  's3-title': { kicker: 'Station 4 · Interaction', title: 'Events and raycasting', accent: A3 },
  hover: {
    kicker: 'mouseenter / mouseleave', accent: A3, title: 'Hover with raycaster',
    body: [
      'The cursor component casts rays (raycaster) and emits DOM events on the intersected entity.',
      'Works the same with mouse, gaze or VR laser: the code does not change.'
    ],
    code: [
      "el.addEventListener('mouseenter', e => {",
      "  el.setAttribute('animation__hover', {",
      "    property: 'scale', to: '1.2 1.2 1.2',",
      "    dur: 200 });",
      "});",
      "el.addEventListener('mouseleave', …);",
      '<a-scene cursor="rayOrigin: mouse"',
      '  raycaster="objects: .clickable">'
    ]
  },
  click: {
    kicker: 'click', accent: A3, title: 'Click, tap or trigger',
    body: [
      'The click event comes from the mouse, a tap on mobile, a sustained gaze (fuse) or the VR controller trigger.',
      'Each click changes the color and opens this panel.'
    ],
    code: [
      "el.addEventListener('click', e => {",
      "  const who = e.detail.cursorEl;",
      "  el.setAttribute('material',",
      "    'color', nextColor());",
      "});",
      "// filter which objects are interactive:",
      'raycaster="objects: .clickable"'
    ]
  },
  laser: {
    kicker: 'VR / mobile', accent: A3, title: 'Gaze (fuse) and laser',
    body: [
      '• laser-controls: detects the controller (Quest, Vive, Index…) and adds ray + cursor.',
      '• Gaze cursor with fuse: clicks after holding your gaze 1.3 s (G key).',
      'The live log shows which cursor fired each event.'
    ],
    code: [
      '<a-entity laser-controls="hand: right"',
      '  raycaster="objects: .clickable">',
      '</a-entity>',
      '<a-camera>',
      '  <a-cursor fuse="true"',
      '    fuse-timeout="1300"></a-cursor>',
      '</a-camera>'
    ]
  },
  log: { kicker: 'Live', accent: A3, title: 'Event log', code: ['Hover over the exhibits…'] },

  /* ───────────── Station 5 · Hands and XR features ───────────── */
  'hands-title': { kicker: 'Station 5 · Hands and XR', title: 'Hand tracking and other WebXR features', accent: A4 },
  'xr-status': {
    kicker: 'This device, live', accent: A4, title: 'What can it do here?',
    body: ['Checking…']   // filled in by the xr-capabilities component
  },
  hands: {
    kicker: 'hand-tracking-controls', accent: A4, title: 'Hand tracking in A-Frame',
    body: [
      '• Ask for it: webxr="optionalFeatures: hand-tracking". Optional, so the session still starts on devices without it.',
      '• hand-tracking-controls draws the hand and exposes its 25 joints (wrist, 4 thumb joints, 5 per finger).',
      '• Events: pinchstarted, pinchmoved, pinchended, with the pinch position.',
      '• hand-tracking-grab-controls + grabbable: pinch an object to pick it up (the orange cube).',
      '• Controllers keep working: laser-controls and hand tracking live side by side.'
    ],
    code: [
      '<a-scene webxr="optionalFeatures: hand-tracking">',
      '  <a-entity hand-tracking-grab-controls="hand: right">',
      '  </a-entity>',
      '  <a-box grabbable></a-box>',
      '',
      "hand.addEventListener('pinchstarted', e =>",
      '  console.log(e.detail.position));'
    ]
  },
  'xr-features': {
    kicker: 'Beyond hands', accent: A4, title: 'More WebXR features',
    body: [
      '• hit-test: place things on real surfaces (the fox, room 7)',
      '• plane-detection / mesh-detection: the real room as geometry (real-world-meshing)',
      '• anchors: keep content fixed to a real spot (anchored)',
      '• dom-overlay: HTML on top of AR on phones',
      '• layers, depth-sensing, light estimation: depend on browser and device',
      'Request them as optional and check what the session really enabled.'
    ],
    code: [
      '<a-scene webxr="optionalFeatures: hand-tracking,',
      '  hit-test, anchors, plane-detection,',
      '  mesh-detection, dom-overlay;',
      '  overlayElement: #overlay">',
      '',
      'sceneEl.xrSession.enabledFeatures',
      "// → ['local-floor', 'hand-tracking', …]"
    ]
  },
  'xr-test': {
    kicker: 'Testing', accent: A4, title: 'Without the right device',
    body: [
      '• Desktop or phone: the room stays illustrative (animated hand, panels) and the panel on the left says what is missing.',
      '• Immersive Web Emulator (Chrome DevTools): a simulated headset, which can also simulate hand input.',
      '• Meta Quest browser: turn hand tracking on in the headset settings and put the controllers down.',
      '• Apple Vision Pro (Safari): hands, plus gaze-and-pinch input (transient-pointer).'
    ]
  },

  /* ───────────── Station 6 · Multimedia ───────────── */
  's4-title': { kicker: 'Station 6 · Multimedia', title: 'Spatial audio, video, text and models', accent: A5 },
  audio: {
    kicker: '<a-sound>', accent: A5, title: 'Positional spatial audio',
    body: [
      'Three.js PositionalAudio on top of Web Audio (PannerNode): volume and panning depend on your position.',
      'The WAV is synthesized in JavaScript → Blob URL. Walk around the speaker with WASD.'
    ],
    code: [
      '<a-sound src="#melody" loop="true"',
      '  sound="refDistance: 2; rolloffFactor: 1"',
      '  position="0 0.9 0.3"></a-sound>',
      '',
      'const url = URL.createObjectURL(',
      '  new Blob([wav], {type: "audio/wav"}));',
      "speaker.setAttribute('sound', 'src', url);",
      'speaker.components.sound.playSound();'
    ]
  },
  video: {
    kicker: '<a-video>', accent: A5, title: 'Video in a 3D dialog',
    body: [
      'An HTML <video> becomes a THREE.VideoTexture on a plane. The dialog is a popup entity: frame, video, progress bar and buttons.',
      '• Autoplay policy: sound only after a user gesture → play() on click.',
      '• playsinline for iOS; same origin (or CORS) so WebGL can read it.',
      '• Big Buck Bunny trailer · (c) Blender Foundation · CC BY 3.0'
    ],
    code: [
      '<video id="trailer" src="trailer.m4v"',
      '  preload="auto" playsinline loop></video>',
      '<a-video src="#trailer" width="2.6"',
      '  height="1.4625"></a-video>',
      '',
      "button.addEventListener('click', () =>",
      "  document.querySelector('#trailer').play());"
    ]
  },
  iframe: {
    kicker: '<iframe>', accent: A5, title: 'Web pages and YouTube in 3D',
    body: [
      'WebGL cannot draw an iframe (cross-origin DOM). Trick from Three.js CSS3DRenderer: a DOM layer over the canvas with the camera\'s perspective + matrix3d, so the iframe sits on a 3D plane and stays interactive.',
      '• Desktop and mobile only: headsets do not render DOM in VR/AR.',
      '• Sites can block framing (X-Frame-Options, CSP frame-ancestors).',
      '• YouTube: /embed/ID URL (youtube-nocookie = privacy mode).'
    ],
    code: [
      '<a-entity html-iframe="src: https://aframe.io/docs;',
      '  width: 2.6; height: 1.4625"></a-entity>',
      '// every frame (tock):',
      "div.style.transform = 'translate(-50%,-50%)' +",
      "  matrix3d(object.matrixWorld);",
      "camera.style.transform = 'translateZ(fov)' +",
      "  matrix3d(camera.matrixWorldInverse);"
    ]
  },
  fonts: {
    kicker: '<a-text>', accent: A5, title: 'SDF text and fonts',
    body: [
      'a-text uses (M)SDF fonts: sharp at any distance and cheap to render.',
      'Built in: roboto, exo2bold, mozillavr, monoid, kelsonsans, aileronsemibold, sourcecodepro, dejavu… or your own with font: url(my-font.json).'
    ],
    code: [
      '<a-text value="Hello WebXR"',
      '  font="exo2bold" color="#FFB400"',
      '  align="center" width="3"></a-text>',
      '<a-text value="my font"',
      '  font="url(fonts/my-font-msdf.json)"',
      '  negate="false"></a-text>'
    ]
  },
  model: {
    kicker: 'Scene graph', accent: A5, title: 'Hierarchical model',
    body: [
      'Robotic arm made only of nested primitives: each joint inherits its parent\'s transform.',
      'One animation per joint = complex motion with no code.',
      'With real models: gltf-model with .glb (Draco/Meshopt compression).'
    ],
    code: [
      '<a-entity id="base" animation="…">',
      '  <a-entity id="shoulder" animation="…">',
      '    <a-box id="arm"></a-box>',
      '    <a-entity id="elbow" position="0 1 0">',
      '      <a-entity id="wrist">',
      '        <a-box class="gripper"></a-box>',
      '<!-- with a real asset: -->',
      '<a-entity gltf-model="#robot"></a-entity>'
    ]
  },

  /* ───────────── Station 7 · AR · Conclusion ───────────── */
  's5-title': { kicker: 'Station 7 · Forest · AR · Conclusion', title: 'An animated model in its habitat', accent: A6 },
  fox: {
    kicker: 'gltf-model + AnimationMixer', accent: A6, title: 'Animated glTF: the fox',
    body: [
      'External GLB (160 KB): skinned mesh with a skeleton and 3 clips (Survey, Walk, Run). Click the fox to cross-fade to the next clip.',
      '• gltf-animation: THREE.AnimationMixer + crossFadeTo',
      '• orbit: rotates the parent, so the fox walks in a circle',
      '• The forest is procedural: InstancedMesh trees, canvas textures.',
      'Fox: PixelMannen (CC0) · rig & animation: tomkranis (CC BY 4.0) · glTF: AsoboStudio & scurest (CC BY 4.0)'
    ],
    code: [
      '<a-entity orbit="speed: 14">',
      '  <a-entity gltf-model="url(fox.glb)"',
      '    position="2 0 0" scale="0.009 0.009 0.009"',
      '    gltf-animation="clip: Walk"',
      '    clip-cycler="clips: Survey, Walk, Run">',
      '  </a-entity>',
      '</a-entity>'
    ]
  },
  'ar-intro': {
    kicker: 'WebXR', accent: A6, title: 'AR zone',
    body: [
      'Press "Enter AR" on an Android phone with Chrome or on a compatible headset (Quest).',
      'The museum and the forest disappear and the fox walks on your real floor.'
    ]
  },
  ar: {
    kicker: 'immersive-ar', accent: A6, title: 'AR with WebXR',
    body: [
      '• webxr: requests hit-test and local-floor',
      '• hide-on-enter-ar: hides the museum when entering AR',
      '• ar-hit-test: reticle + tap to place the fox',
      '• xr-mode-ui: shows the VR and AR buttons'
    ],
    code: [
      '<a-scene',
      '  webxr="optionalFeatures: hit-test,',
      '         local-floor"',
      '  xr-mode-ui="XRMode: xr"',
      '  ar-hit-test="target: #arExhibit">',
      '  <a-entity id="museum" hide-on-enter-ar>',
      '    <!-- walls, floor, ceiling -->',
      '  </a-entity>',
      '  <a-entity id="arExhibit"><!-- fox --></a-entity>',
      '</a-scene>'
    ]
  },
  outro: {
    kicker: 'Conclusion', accent: A6, title: 'Why A-Frame?',
    body: [
      '• Declarative HTML: XR prototypes in minutes',
      '• ECS: reusable components',
      '• Visual Inspector for debugging and layout',
      '• glTF models and animations from any 3D tool',
      '• Three.js underneath: full control when you need it',
      '• One codebase: desktop, mobile, VR and AR'
    ],
    footer: 'Thank you! Questions?'
  },
  res: {
    kicker: 'Resources', accent: A6, title: 'Keep learning',
    body: [
      'Click a link to open it in a new tab.',
      'Credits: Fox (Khronos glTF Sample Assets, CC0 / CC BY 4.0) · Big Buck Bunny (Blender Foundation, CC BY 3.0)'
    ],
    // Rendered as clickable rows by the link-list component
    links: [
      { label: 'A-Frame documentation', url: 'https://aframe.io/docs/' },
      { label: 'A-Frame examples', url: 'https://aframe.io/examples/' },
      { label: 'A-Frame Inspector', url: 'https://github.com/aframevr/aframe-inspector' },
      { label: 'A-Frame source code', url: 'https://github.com/aframevr/aframe' },
      { label: 'WebXR specification', url: 'https://immersive-web.github.io/webxr/' },
      { label: 'aframe-extras (animation-mixer)', url: 'https://github.com/c-frame/aframe-extras' },
      { label: 'glTF exporter in Blender', url: 'https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html' },
      { label: 'Mixamo: characters and animations', url: 'https://www.mixamo.com/' },
      { label: 'Sketchfab: 3D models', url: 'https://sketchfab.com/' },
      { label: 'Poly Pizza: low-poly models', url: 'https://poly.pizza/' },
      { label: 'This museum on GitHub', url: 'https://github.com/vuraul94/aframe-museum' }
    ]
  }
};
