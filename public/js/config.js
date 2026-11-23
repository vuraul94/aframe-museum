/** Constants shared across the whole app */

/** Accent color for each station (index 0..6) */
export const ACCENTS = ['#a3e635', '#ef2d5e', '#ffb400', '#2ec4b6', '#ff8a3d', '#7b61ff', '#4cc9f0'];

/** One file per room, in public/rooms/ (tour order) */
export const ROOM_FILES = ['1-welcome', '2-components', '3-motion', '4-interaction', '5-hands', '6-multimedia', '7-forest'];

/** Number of rooms */
export const STATIONS = ROOM_FILES.length;

/** Meters between the centers of two consecutive stations (along -Z) */
export const STATION_SPACING = 14;

/** Distance at which the viewer is placed in front of the station center */
export const VIEW_OFFSET = 4;

/** Talk duration in seconds (HUD timer) */
export const TALK_DURATION = 10 * 60;

export const FONT_UI = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const FONT_MONO = '"JetBrains Mono", "Fira Code", Consolas, "DejaVu Sans Mono", monospace';
