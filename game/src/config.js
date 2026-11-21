// Every tuning number of HUSHWATER in one place: screen layout, movement speeds, how far and how
// fast guards see and hear, and how the detection meter fills and drains.

/** The canvas is always drawn at this size and scaled to fit the window. */
export const VIEW = { width: 1280, height: 720 };

/** One map tile in pixels, and the map's size in tiles. */
export const TILE = 30;
export const COLS = 34;
export const ROWS = 20;

/** Where the map sits on screen (top-left corner), and the side panel beside it. */
export const MAP_ORIGIN = { x: 10, y: 62 };
export const PANEL = { x: 1042, y: 62, w: 228, h: 600 };

/** Fixed simulation step, in seconds. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 9,
  walkSpeed: 100,
  sneakSpeed: 56,
  runSpeed: 172,
  /** Seconds between footfalls that make noise, and how far each is heard. */
  walkStepEvery: 0.42,
  walkNoise: 58,
  runStepEvery: 0.26,
  runNoise: 175,
  pebbles: 3,
  throwRange: 250,
  pebbleNoise: 215,
};

export const GUARD = {
  radius: 10,
  patrolSpeed: 50,
  investigateSpeed: 78,
  chaseSpeed: 128,
  sightRange: 235,
  fov: (72 * Math.PI) / 180,
  /** A player standing in shadow is seen only within this share of the sight range. */
  shadowSight: 0.58,
  turnRate: 4.2,
  catchDistance: 21,
  hearing: 1,
  /** Seconds a guard looks around at the spot it is checking. */
  investigateLook: 2.8,
  searchLook: 5.5,
  stepEvery: 0.5,
};

export const HOUND = {
  sightRange: 150,
  fov: (100 * Math.PI) / 180,
  hearing: 1.8,
  patrolSpeed: 62,
  chaseSpeed: 150,
};

export const CAMERA = {
  sightRange: 260,
  fov: (46 * Math.PI) / 180,
  sweepSpeed: 0.55,
  alarmRadius: 420,
};

export const DETECT = {
  /** Suspicion gained per second at the edge of sight, before closeness, light and stance. */
  baseRise: 0.85,
  decay: 0.32,
  /** Above this a patrolling guard stops and turns: the "?" state. */
  notice: 0.08,
  /** A guard whose suspicion peaked above this and fell back without an alarm counts a near miss. */
  nearMiss: 0.55,
};

export const LAMP_RADIUS = 100;

export const RANKS = ['GHOST', 'SHADOW', 'SEEN', 'CAUGHT'];
