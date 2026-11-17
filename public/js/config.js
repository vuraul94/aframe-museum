/** Constants shared across the whole app */

/** Accent color for each station (index 0..4) */
export const ACCENTS = ['#ef2d5e', '#ffb400', '#2ec4b6', '#7b61ff', '#4cc9f0'];

/** One file per room, in public/rooms/ (tour order) */
export const ROOM_FILES = ['1-entrance', '2-motion', '3-interaction', '4-multimedia', '5-forest'];

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
