# A-Frame Museum · spatial presentation

An interactive virtual museum built with [A-Frame](https://aframe.io) that works as the slides for a 10-minute tech talk. Each room demonstrates a framework feature live: ECS, PBR, animation, lights and shadows, events and raycasting, spatial audio, video in a 3D dialog, a web page and a YouTube video in `<iframe>`s inside the scene, MSDF text, hierarchical models, an external animated glTF model (a fox) in a procedural forest, WebXR (VR/AR) and the **A-Frame Inspector**, including saving its edits back to `index.html`.

- Minute-by-minute talk script: [docs/SCRIPT.md](docs/SCRIPT.md)
- Two versions of the same museum:
  - `index.html`: **one scene** with the 5 rooms; the rig teleports between them.
  - `room.html?station=N`: **one scene per room**; changing room loads another page.
  - Each room is its own file in [`public/rooms/`](public/rooms/); both versions are assembled from those files. The **⇄** link in the HUD switches between them in the same room.

## Quick start

Requires Node ≥ 18 and has no npm dependencies.

```bash
npm start
```

Open `http://localhost:8080`.

To prepare the talk for offline use, before leaving home:

```bash
npm run vendor
```

| Script | What it does |
|---|---|
| `npm start` | Static server on `:8080` (set `PORT` to change it) + Inspector save service on `localhost:51234` (`SAVE=0` to disable) |
| `npm run dev` | Same, but restarts when `server/` changes |
| `npm run vendor` | Downloads A-Frame, the Inspector and MSDF fonts into `./vendor` (offline mode) |
| `npm run build` | Static version in `./dist` (public + vendor cache) for GitHub Pages or any static host |
| `npm run cert` | Generates a self-signed certificate in `./certs`; the server switches to HTTPS automatically |

## Architecture

```
server/
  server.js        Zero-dependency HTTP/HTTPS server (static files + /vendor)
  vendor.js        Versions and map of third-party libraries and assets; disk cache
  inspector-save.js  "Write changes" service for the Inspector (aframe-watcher compatible)
  prefetch.js      npm run vendor
  make-cert.js     npm run cert
  build.js         npm run build (static site in ./dist)
.github/workflows/pages.yml   Build + deploy to GitHub Pages on every push to main
public/
  index.html       Shell: HUD + <template> with the <a-scene>, player rig, global lights and an empty #museum
  room.html        Multi-scene version: same shell, one room per page
  rooms/           One file per room (declarative markup only)
    1-entrance.html      ECS, primitives, PBR, Inspector
    2-motion.html        animation, lights, procedural textures
    3-interaction.html   events, gaze, laser, event log
    4-multimedia.html    spatial audio, video dialog, iframes, robot arm, fonts
    5-forest.html        forest, animated fox (#arExhibit), AR, conclusion
  css/hud.css      Presenter HUD styles
  js/
    register.js    Registers every system and component (shared by both versions)
    main.js        Entry point of index.html: mounts the 5 rooms in one scene
    room.js        Entry point of room.html: mounts only room N
    config.js      Constants (colors, distances, talk duration)
    content/
      panels.js    All panel texts and code snippets
    core/
      museum-loader.js   Builds the <a-scene> from the shell + rooms/*.html
      museum-system.js   "museum" ECS system: stations and teleporting (or page loads)
      presenter.js       HUD, keyboard shortcuts and timer
      feedback.js        toast, togglePanel and live event log
    components/
      ui.js              canvas-panel, canvas-label, ui-button, popup, info-toggle
      ecs-demo.js        spin, bob, color-cycle, ecs-toggle, ecs-inspector, pbr-grid
      materials.js       canvas-texture, plasma-texture, svg-texture, PMREM environment, lights
      interaction.js     interactive-exhibit (mouseenter / mouseleave / click)
      media.js           procedural audio, audio-toggle, audio-visualizer
      dialog.js          dialog-frame, openDialog/closeDialog (one dialog at a time)
      video.js           video-dialog (progress + load status), video-control
      iframe.js          html-iframe (CSS3D iframe on a 3D plane), iframe-control
      models.js          gltf-animation (AnimationMixer), orbit, clip-cycler
      forest.js          forest-environment (instanced trees, sky, hills), station-light
      xr.js              controller locomotion, snap-turn, AR mode
      inspector.js       A-Frame Inspector integration
      architecture.js    Walls, floor, doors and lights generated in code (last room outdoors)
    lib/
      canvas.js          Panel drawing and code highlighting on <canvas>
      procedural.js      Noise, seeded random, patterns (grass, dirt…), SVG and WAV synthesis
```

**How the libraries are served:** `index.html` loads `vendor/aframe.min.js` and sets `window.AFRAME_CDN_ROOT = 'vendor/cdn/'` (relative paths, so the site also works under `/<repo>/`). The server resolves those paths by downloading once from the official CDNs (aframe.io, jsdelivr and cdn.aframe.io) and saving the file in `./vendor`. That way the `a-text` fonts, the VR controller models and the Inspector also work offline. Versions live in `server/vendor.js` (A-Frame 1.7.1, Inspector 1.7.0). The museum's own external assets (the fox and the trailer) are committed in [`public/assets/`](public/assets/CREDITS.md) with their licenses; the server supports HTTP `Range` requests so `<video>` can seek and loop.

**Saving Inspector edits:** the Inspector keeps changes in memory. To keep them you can:
1. Copy: "Copy entity HTML to clipboard" in the entity panel, then paste into `index.html`.
2. Export: "Export to GLTF" (scene toolbar or entity panel) and reuse the `.glb` with `gltf-model`.
3. Write to disk: the toolbar's "Write changes with aframe-watcher" button POSTs `AFRAME.INSPECTOR.history.updates` to `http://localhost:51234/save`. `npm start` includes a compatible service (`server/inspector-save.js`) that finds each `id` in `public/index.html` or `public/rooms/*.html`, updates that tag and keeps a `.bak` of every modified file. Entities without an `id` (or created by JavaScript) can't be saved this way. It only listens on localhost, so it works when the browser runs on the same machine. In other projects use the official `npx aframe-watcher`.

**Video:** the `<video>` has two `<source>`s: H.264 `.m4v` and a VP9 `.webm` fallback (some Linux browser builds have no H.264). The dialog shows the load state over the video (loading %, ready, buffering, error with the formats tried), so a missing file or codec is visible instead of a blank square.

**Iframes (web page and YouTube):** WebGL cannot draw an `<iframe>` (cross-origin DOM). `html-iframe` uses the Three.js CSS3DRenderer technique: a DOM layer over the canvas with the camera's `perspective` and `matrix3d`, so a real, clickable iframe sits on a 3D plane. Limits: 3D objects cannot cover it, headsets don't show DOM in VR/AR (the plane shows a notice), and sites can forbid framing (`X-Frame-Options` / CSP `frame-ancestors`; aframe.io allows it). YouTube uses the `youtube-nocookie.com/embed/ID` URL; the iframe only loads when the dialog opens and is unloaded on close (stops the audio). Both need internet.

**External models and animations:** A-Frame loads glTF/GLB natively (`gltf-model`) and `obj-model`; other formats (FBX, USDZ…) need a Three.js loader inside a component. The animation clips in a glTF are not played automatically: use `animation-mixer` from [aframe-extras](https://github.com/c-frame/aframe-extras) or a `THREE.AnimationMixer` (this project's `gltf-animation`). For characters, Mixamo (rig + mocap) → FBX → Blender → export `.glb`, and compress with `gltf-transform` (Draco / Meshopt). The **Blender** panel in room 2 walks through exporting an animation: named Actions, baking constraints/drivers, applying scale, then File › Export › glTF 2.0 with Animation on (mode "Actions" = one clip per action). Raycasting skinned meshes is unreliable and costly, so the fox has an invisible hit box for clicks.

**Rooms as separate files:** each room is an HTML fragment in `public/rooms/` (tour order in `ROOM_FILES`, `config.js`). `js/core/museum-loader.js` clones the `<a-scene>` from the `<template>` in `index.html` (a template is inert, so A-Frame does not start the scene before the rooms are in place), inserts the room fragments and then mounts the scene. Top-level elements of a room go inside `#museum`, unless they declare `data-mount="scene"` (the fox, which must survive `hide-on-enter-ar`) or `data-mount="body"` (the `<video>`). Relative URLs inside room files resolve against the page, i.e. the site root.

**One scene vs one scene per room:** `index.html` mounts all five room files; `room.html` downloads the same shell and mounts just one, setting what changes (`<a-scene museum="room: N">`, `museum-architecture="only: N"` builds a closed room, `forest-environment="standalone: true"`; `ar-hit-test` is dropped when the fox is not there). In that mode the `museum` system turns `goTo(i)` into a page load (`room.html?station=i+1`), so keys, HUD and VR buttons work the same. The timer survives the page loads (`sessionStorage`).

| | One scene (`index.html`) | Scene per room (`room.html`) |
|---|---|---|
| Changing room | Instant, animated rig | Page load (~1 s) |
| Memory / GPU | Everything loaded at once | Only the current room; the rest is freed |
| First load | Downloads all assets | Only what that room uses |
| State (open panels, audio, timer) | Shared | Lost on change (except the timer) |
| VR session | Continues across rooms | Ends on every page load |

**Adding a room:** create `public/rooms/6-name.html` with an `<a-entity museum-station="index: 5; name: …" position="0 0 -70">`, add its name to `ROOM_FILES` and a color to `ACCENTS` (`config.js`), increase `stations` in `museum-architecture`, add the texts to `panels.js` and a button to the HUD.

## Controls during the talk

| Key | Action |
|---|---|
| `1` – `5` | Jump to a station |
| `N` / `P`, `PageDown` / `PageUp` | Next / previous (works with presentation clickers) |
| `WASD` + mouse drag | Move and look around |
| `I` | Open / close all panels in the room |
| `E` or `Ctrl+Alt+I` | A-Frame Inspector (also the 🛠 HUD button and the 3D button in room 1) |
| `G` | Gaze cursor with fuse (on by default on mobile) |
| `T` / `R` | Start-pause / reset the 10:00 timer |
| `H` | Hide the HUD |
| VR: `A`/`X`, `B`/`Y` | Next / previous room; left stick to walk, right stick to turn 45° |

While the Inspector is open, the museum shortcuts are disabled so they don't clash with its own.

## Testing

### Desktop
Run `npm start` and open Chrome or Firefox at `http://localhost:8080`. Navigate with the keys in the table.

### Simulated VR / AR (Chrome DevTools)
1. Install the **Immersive Web Emulator** extension (Meta), the successor to the *WebXR API Emulator*.
2. Open DevTools → **WebXR** tab, pick a device (e.g. Meta Quest 3) and reload.
3. The **VR** and **AR** buttons appear at the bottom right (`xr-mode-ui="XRMode: xr"`).
4. In VR, move the virtual controllers to try `laser-controls` and the event log in room 3.
5. In AR the museum and the forest are hidden (`hide-on-enter-ar`) and only the fox remains. The emulator simulates planes for `ar-hit-test`.

### GitHub Pages
The workflow `.github/workflows/pages.yml` runs `npm run build` and deploys `dist/` on every push to `main` (Pages source: GitHub Actions). Paths are relative, so it works under `https://<user>.github.io/<repo>/`. Pages is HTTPS, so WebXR AR works directly from a phone. On a static host there is no Inspector save service, and A-Frame fonts/controllers load from `cdn.aframe.io`.

### Real device (Android phone or Quest on the same Wi-Fi)
WebXR requires HTTPS outside `localhost`. There are two options:
- Run `npm run cert` and then `npm start`. Open the `https://<IP>:8080` URL the server prints and accept the certificate warning.
- Or, with the phone connected over USB: `chrome://inspect` → *Port forwarding* `8080 → localhost:8080` and open `http://localhost:8080` on the phone.

## Credits and licenses

Everything is generated in code except two free-to-use external assets, included in `public/assets/` (see [CREDITS.md](public/assets/CREDITS.md)):

- **Fox** (`fox.glb`) from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox): model by PixelMannen ([CC0](https://creativecommons.org/publicdomain/zero/1.0/)), rigging and animation by tomkranis ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), glTF conversion by AsoboStudio and scurest ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
- **Big Buck Bunny trailer**: (c) 2008 Blender Foundation, [peach.blender.org](https://peach.blender.org) ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)). The `.webm` fallback is the VP9 transcode from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_Trailer_400p.ogv). The YouTube iframe shows Blender's official upload.

The attributions also appear in the museum (fox plaque, video dialog and the Resources panel).
