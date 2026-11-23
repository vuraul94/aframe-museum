# Talk script · A-Frame in 10 minutes

> Before you start: run `npm start`, open `http://localhost:8080`, press **T** to start the timer and **1** to go to the first room (Welcome).
> Key **I** = open/close all "View info" panels in the current room (handy if you don't want to aim with the mouse).

| Time | Station (key) | What to do | What to say (key ideas) |
|---|---|---|---|
| **0:00 – 1:10** | **1 · Welcome** | Welcome panel, then **Step 1** (left), the little scene in the center (**View info**) and the right panel. Turn **fog** and **stats** on and off. | "This presentation IS an A-Frame app: a museum with 7 rooms, each room is a slide." A-Frame = declarative HTML on top of Three.js, open source, native WebXR. Setup: one `<script>` (or `npm install aframe`) and a local server. The model in the center is the classic Hello WebXR scene. Scene settings are components on `<a-scene>`. |
| **1:10 – 2:40** | **2 · Components** | **View info** on the primitives, the golden grid (right), then **+spin**, **+bob**, **+color-cycle** and **Inspector** (3D button or **E**). Back with **Ctrl+Alt+I**, open **Save edits**. | `<a-box>` = `geometry` + `material`; PBR: metalness × roughness. Entity / component / system. In the Inspector: change the material, drag the gizmo; keep edits with "Copy entity HTML", "Export to GLTF" or **Write changes** (this server saves them into the room file). |
| **2:40 – 3:50** | **3 · Motion** | **Light color**; **View info** on animation, then **External** and **Blender**. | `animation__name` on any property; lights and shadows; canvas/SVG textures. External glTF animations: `gltf-model` + `animation-mixer`; from Blender: named Actions → bake → apply scale → export glTF 2.0 (.glb, Animation on). |
| **3:50 – 4:50** | **4 · Interaction** | Hover the three exhibits and click; **Event log**; **G** for the gaze cursor. | `cursor` + `raycaster` → `mouseenter` / `mouseleave` / `click`; same code for mouse, gaze and VR laser. |
| **4:50 – 6:00** | **5 · Hands · XR** | Point at the animated hand, the **This device, live** panel and **More WebXR features**. With a headset with hand tracking: enter VR, put the controllers down and pinch the orange cube. | `webxr="optionalFeatures: hand-tracking"` + `hand-tracking-grab-controls`: 25 joints per hand, `pinchstarted` events, `grabbable` objects. Optional features keep the experience working everywhere: the panel shows what this device actually supports. Also hit-test, anchors, plane/mesh detection, DOM overlay. |
| **6:00 – 7:30** | **6 · Multimedia** | **Play** the speaker and walk around it (then **Stop**). **Watch video** → **Play** → **Close**. **Web · YouTube** on the right kiosk. | Positional `<a-sound>`; `<a-video>`; iframes through a CSS3D layer (not in a headset); MSDF text; scene graph. Notice the doorway: the next room is outside. |
| **7:30 – 9:10** | **7 · Forest · AR** | Walk into the forest; click the **fox**; **View info** on the plaque and on AR; **Enter AR** with a device. | External GLB with 3 clips, `gltf-animation` cross-fades, `orbit` walks it; procedural forest; AR with `hit-test` and `hide-on-enter-ar`. |
| **9:10 – 10:00** | 7 · Conclusion | "Why A-Frame?" and **Resources** (clickable links). | Declarative HTML + ECS + Inspector + glTF + WebXR features, one codebase for desktop/mobile/VR/AR. "Thank you! Any questions?" |

## Bonus (if there is time or a question about performance): one scene vs one scene per room

Click **⇄ Scene per room** in the HUD: the same room reopens as its own page and `<a-scene>`. Press **N**: the next room is a new page load. Key idea: one big scene = instant teleports but everything in memory; one scene per room = lighter on GPU/memory and faster first load, but each change reloads (and ends a VR session). Each room is its own file (`public/rooms/*.html`): `index.html` mounts all of them in one scene, `room.html` mounts one. **⇄ One scene** goes back. Also worth a sentence: the one-scene version streams rooms anyway (only the nearby ones are mounted; with fog on, nothing the fog hides is loaded). Turn **stats** on in room 1 and watch Textures/Geometries change as you move.

## Plan B

- **Online backup:** the GitHub Pages copy of the museum (same content, no Inspector save service).
- **No internet:** run `npm run vendor` before the talk; A-Frame, the Inspector and the fonts end up in `./vendor` (the fox and the video are already in the repo).
- **No internet at the venue:** the iframe kiosk (web and YouTube) is the only part that needs it; skip it.
- **Short on time:** in room 1 show only the welcome panel and the center scene; in room 5 only the animated hand; skip the video (only mention it) and the External panel; skip ahead with **N** / **PageDown** (presentation clickers send PageDown/PageUp).
- **The fox ran off-screen:** click it until it shows **Survey** (it stands still).
- **From a VR headset:** **A/X** buttons = next room, **B/Y** = previous; left stick to walk, right stick to turn.
- **Walls:** you cannot walk through walls (WASD, thumbstick or walking with a headset). In the one-scene version you can walk through the doorways; in the scene-per-room version change rooms with the keys, the HUD or A/X · B/Y.
