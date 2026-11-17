# Talk script · A-Frame in 10 minutes

> Before you start: run `npm start`, open `http://localhost:8080`, press **T** to start the timer and **1** to go to the entrance.
> Key **I** = open/close all "View info" panels in the current room (handy if you don't want to aim with the mouse).

| Time | Station (key) | What to do | What to say (key ideas) |
|---|---|---|---|
| **0:00 – 0:40** | **1 · Entrance** | Point at the welcome panel. | "This presentation IS an A-Frame app: a museum with 5 rooms, and each room is a slide." A-Frame = declarative HTML on top of Three.js, open source, native WebXR. |
| **0:40 – 1:30** | 1 · Primitives | Click **View info** on the primitives. Point at the golden grid (right). | `<a-box>` is just sugar over `geometry` + `material`. PBR materials: metalness across columns, roughness across rows. Reflections come from a PMREM environment generated in code. |
| **1:30 – 3:00** | 1 · Live ECS + Inspector | Press **+spin**, **+bob**, **+color-cycle** and watch the "Entity #ecsDemo" panel. Then **Inspector** (3D button or **E**). Back with **Ctrl+Alt+I** and open **Save edits**. | Entity = container; component = data + behaviour (`init/update/tick/remove`); system = global logic. In the **A-Frame Inspector**: #ecsDemo is already selected → change the material color, drag the gizmo. Edits live in memory: keep them with "Copy entity HTML", "Export to GLTF", or the **Write changes** button, which this project's server saves straight into `index.html` (an aframe-watcher-compatible service on `localhost:51234`). |
| **3:00 – 4:20** | **2 · Motion** | Show the 3 zones; press **Light color**; open **View info** on animation, then **External**. | `animation__name`: several animations per entity, on any property. Lights: hemisphere/ambient, directional and orbiting point light with shadows. Textures from `<canvas>` and SVG data URIs. **External assets**: skeletal animation comes in glTF files (Sketchfab, Mixamo → Blender → .glb); A-Frame loads them with `gltf-model`, and the clips play with `animation-mixer` (aframe-extras) or a `THREE.AnimationMixer`. "You'll see one in the last room." |
| **4:20 – 5:30** | **3 · Interaction** | Hover over the three exhibits and click. Point at the **Event log**. Press **G** for the gaze cursor and look at an exhibit for 1.3 s. | `cursor` + `raycaster` emit `mouseenter`, `mouseleave`, `click` as DOM events. The same code works for mouse, gaze (fuse) and VR laser: the log shows which cursor fired each event. Press **G** again to turn it off. |
| **5:30 – 7:10** | **4 · Multimedia** | **Play** on the speaker and walk around it with **WASD** (then **Stop**). **Watch video** on the left kiosk → **Play** → **Close**. **Web · YouTube** on the right kiosk: scroll the docs, then **YouTube**. Point at the robot and the fonts. | Positional `<a-sound>`: the WAV is synthesized in JS. `<a-video>` turns a `<video>` into a texture; the dialog is a 3D popup with its own controls (autoplay policy: play on click). Iframes can't be drawn by WebGL: a CSS3D layer aligns a real `<iframe>` with the 3D camera (not visible inside a headset). `a-text` with MSDF fonts. The robot arm is a scene graph of primitives. Notice the doorway: the next room is outside. |
| **7:10 – 9:10** | **5 · Forest · AR** | Walk out into the forest. Click the **fox** twice (Walk → Run → Survey). Open **View info** on the plaque. Then **View info** on AR; with a device ready: **Enter AR** and place the fox. | The fox is an external GLB (CC0 / CC BY) with a skeleton and 3 clips: `gltf-animation` cross-fades between them, `orbit` moves it in a circle. The forest is procedural: instanced trees, canvas textures, a sun that only turns on here. AR: `webxr="optionalFeatures: hit-test"`, `hide-on-enter-ar` hides museum and forest, `ar-hit-test` places the fox on your floor. No device: show the WebXR emulator (see README). |
| **9:10 – 10:00** | 5 · Conclusion | "Why A-Frame?" panel and the **Resources** button (credits included). | Declarative HTML + ECS + Inspector + glTF ecosystem + Three.js underneath + a single codebase for desktop/mobile/VR/AR. "Thank you! Any questions?" |

## Bonus (if there is time or a question about performance): one scene vs one scene per room

Click **⇄ Scene per room** in the HUD: the same room reopens as its own page and `<a-scene>`. Press **N**: the next room is a new page load. Key idea: one big scene = instant teleports but everything in memory; one scene per room = lighter on GPU/memory and faster first load, but each change reloads (and ends a VR session). Each room is its own file (`public/rooms/*.html`): `index.html` mounts all of them in one scene, `room.html` mounts one. **⇄ One scene** goes back.

## Plan B

- **Online backup:** the GitHub Pages copy of the museum (same content, no Inspector save service).
- **No internet:** run `npm run vendor` before the talk; A-Frame, the Inspector, the fonts, the fox model and the video end up in `./vendor`.
- **No internet at the venue:** the iframe kiosk (web and YouTube) is the only part that needs it; skip it.
- **Short on time:** skip the video (only mention it) and the External panel; skip ahead with **N** / **PageDown** (presentation clickers send PageDown/PageUp).
- **The fox ran off-screen:** click it until it shows **Survey** (it stands still).
- **From a VR headset:** **A/X** buttons = next room, **B/Y** = previous; left stick to walk, right stick to turn.
