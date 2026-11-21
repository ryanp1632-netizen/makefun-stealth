// Grid paths for guards: a breadth-first search over walkable tiles (8 directions, no cutting
// past a blocked corner), returned as a list of points to walk through.
import { TILE } from '../config.js';
import { blocksFeet, tileCenter } from '../levels/tilemap.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Nearest walkable tile to (tx, ty), searching outward; the tile itself when it is walkable. */
export function nearestOpenTile(map, tx, ty) {
  if (!blocksFeet(map, tx, ty)) return [tx, ty];
  for (let r = 1; r < 6; r += 1) {
    for (let oy = -r; oy <= r; oy += 1) {
      for (let ox = -r; ox <= r; ox += 1) {
        if (!blocksFeet(map, tx + ox, ty + oy)) return [tx + ox, ty + oy];
      }
    }
  }
  return [tx, ty];
}

/** Points from (fromX, fromY) to (toX, toY) in pixels; empty when no way exists. */
export function findPath(map, fromX, fromY, toX, toY) {
  const [sx, sy] = nearestOpenTile(map, Math.floor(fromX / TILE), Math.floor(fromY / TILE));
  const [gx, gy] = nearestOpenTile(map, Math.floor(toX / TILE), Math.floor(toY / TILE));
  const cols = map.cols;
  const came = new Int32Array(cols * map.rows).fill(-1);
  const start = sy * cols + sx;
  const goal = gy * cols + gx;
  came[start] = start;
  const queue = [start];
  for (let head = 0; head < queue.length && came[goal] === -1; head += 1) {
    const cell = queue[head];
    const cx = cell % cols;
    const cy = (cell - cx) / cols;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (blocksFeet(map, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (blocksFeet(map, cx + dx, cy) || blocksFeet(map, cx, cy + dy))) continue;
      const next = ny * cols + nx;
      if (came[next] !== -1) continue;
      came[next] = cell;
      queue.push(next);
    }
  }
  if (came[goal] === -1) return [];
  const cells = [];
  for (let cell = goal; cell !== start; cell = came[cell]) cells.push(cell);
  cells.reverse();
  const points = cells.map((cell) => tileCenter(cell % cols, Math.floor(cell / cols)));
  if (points.length > 0 && !blocksFeet(map, Math.floor(toX / TILE), Math.floor(toY / TILE))) {
    points[points.length - 1] = { x: toX, y: toY };
  }
  return points;
}
