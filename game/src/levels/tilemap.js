// Turns a level's text map into a tile grid, and answers the questions every system asks of it:
// what is at this point, can feet pass, can eyes pass, and how far a sight line runs before a
// wall or crate stops it (a grid ray march, used by vision cones, lamps and hearing).
import { COLS, ROWS, TILE, LAMP_RADIUS } from '../config.js';

export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
export const TILE_WATER = 2;
export const TILE_CRATE = 3;
export const TILE_BARREL = 4;
export const TILE_REEDS = 5;
export const TILE_LAMP = 6;
export const TILE_BRIDGE = 7;
export const TILE_EXIT = 8;
export const TILE_COBBLE = 9;
export const TILE_POST = 10;

const CODES = {
  '#': TILE_WALL, '.': TILE_FLOOR, ':': TILE_COBBLE, '~': TILE_WATER, '=': TILE_BRIDGE, c: TILE_CRATE,
  b: TILE_BARREL, r: TILE_REEDS, o: TILE_LAMP, X: TILE_EXIT, P: TILE_REEDS, K: TILE_FLOOR,
};

const BLOCKS_FEET = new Set([TILE_WALL, TILE_WATER, TILE_CRATE, TILE_BARREL, TILE_LAMP, TILE_POST]);
const BLOCKS_EYES = new Set([TILE_WALL, TILE_CRATE, TILE_BARREL]);

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** Build the tile grid and the level's points of interest from its definition. */
export function parseLevel(def) {
  const tiles = new Uint8Array(COLS * ROWS);
  const map = { tiles, cols: COLS, rows: ROWS, start: null, ledger: null, exit: null, lamps: [], barrels: [] };
  for (let ty = 0; ty < ROWS; ty += 1) {
    const row = def.map[ty];
    for (let tx = 0; tx < COLS; tx += 1) {
      const ch = row[tx];
      const code = CODES[ch] ?? TILE_FLOOR;
      tiles[ty * COLS + tx] = code;
      if (ch === 'P') map.start = tileCenter(tx, ty);
      if (ch === 'K') map.ledger = tileCenter(tx, ty);
      if (ch === 'X') map.exit = { ...tileCenter(tx, ty), tx, ty };
      if (ch === 'o') map.lamps.push({ ...tileCenter(tx, ty), radius: LAMP_RADIUS, flicker: (tx * 7 + ty * 13) % 10 });
      if (ch === 'b') map.barrels.push({ ...tileCenter(tx, ty), tx, ty });
    }
  }
  for (const guard of def.guards) {
    if (guard.kind === 'camera') setTile(map, guard.at[0], guard.at[1], tileAt(map, guard.at[0], guard.at[1]) === TILE_WALL ? TILE_WALL : TILE_POST);
  }
  for (const lamp of map.lamps) lamp.reach = lightReach(map, lamp);
  return map;
}

export function tileAt(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) return TILE_WALL;
  return map.tiles[ty * map.cols + tx];
}

function setTile(map, tx, ty, code) {
  map.tiles[ty * map.cols + tx] = code;
}

export function tileAtPoint(map, x, y) {
  return tileAt(map, Math.floor(x / TILE), Math.floor(y / TILE));
}

export function blocksFeet(map, tx, ty) {
  return BLOCKS_FEET.has(tileAt(map, tx, ty));
}

export function blocksEyes(map, tx, ty) {
  return BLOCKS_EYES.has(tileAt(map, tx, ty));
}

/**
 * March a ray from (x, y) along the unit direction (dx, dy) through the grid; return how far it
 * runs before a tile that blocks sight, or maxDist. The starting tile itself never blocks, so a
 * wall-mounted beacon looks out from its wall.
 */
export function castRay(map, x, y, dx, dy, maxDist) {
  let tx = Math.floor(x / TILE);
  let ty = Math.floor(y / TILE);
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const deltaX = dx !== 0 ? Math.abs(TILE / dx) : Infinity;
  const deltaY = dy !== 0 ? Math.abs(TILE / dy) : Infinity;
  let maxX = dx > 0 ? ((tx + 1) * TILE - x) / dx : dx < 0 ? (tx * TILE - x) / dx : Infinity;
  let maxY = dy > 0 ? ((ty + 1) * TILE - y) / dy : dy < 0 ? (ty * TILE - y) / dy : Infinity;
  for (let guardSteps = 0; guardSteps < 200; guardSteps += 1) {
    let t;
    if (maxX < maxY) {
      t = maxX;
      maxX += deltaX;
      tx += stepX;
    } else {
      t = maxY;
      maxY += deltaY;
      ty += stepY;
    }
    if (t >= maxDist) return maxDist;
    if (blocksEyes(map, tx, ty)) return t;
  }
  return maxDist;
}

/** True when nothing that blocks sight stands between the two points. */
export function lineOfSight(map, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  return castRay(map, ax, ay, dx / dist, dy / dist, dist) >= dist - 0.01;
}

/** The outline of the floor a light source reaches (a ring of ray lengths), worked out once per level. */
function lightReach(map, lamp) {
  const rays = 72;
  const reach = new Float32Array(rays);
  for (let index = 0; index < rays; index += 1) {
    const angle = (index / rays) * Math.PI * 2;
    reach[index] = castRay(map, lamp.x, lamp.y, Math.cos(angle), Math.sin(angle), lamp.radius);
  }
  return reach;
}

/** True when the point stands in a lamp's pool of light. */
export function isLit(map, x, y) {
  for (const lamp of map.lamps) {
    const d = Math.hypot(x - lamp.x, y - lamp.y);
    if (d < lamp.radius * 0.92 && lineOfSight(map, lamp.x, lamp.y, x, y)) return true;
  }
  return false;
}
