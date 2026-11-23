/**
 * Registers every system and component. Shared by both versions:
 *  - main.js  → one scene with the 5 rooms (index.html)
 *  - room.js  → one scene per room (room.html?station=N)
 * Must run before A-Frame initializes the <a-scene>.
 *
 *  core/        → museum system, presenter (HUD/keyboard), feedback
 *  components/  → components grouped by station / domain
 *  content/     → panel texts
 *  lib/         → pure utilities (canvas, procedural generators)
 */
import './core/museum-system.js';
import './core/presenter.js';
import './components/ui.js';
import './components/setup.js';
import './components/hands.js';
import './components/ecs-demo.js';
import './components/materials.js';
import './components/interaction.js';
import './components/media.js';
import './components/dialog.js';
import './components/video.js';
import './components/iframe.js';
import './components/models.js';
import './components/forest.js';
import './components/xr.js';
import './components/bounds.js';
import './components/streaming.js';
import './components/shadows.js';
import './components/resolution.js';
import './components/inspector.js';
import './components/architecture.js';
