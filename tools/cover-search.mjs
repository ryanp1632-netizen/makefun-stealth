// Try wait times for the cover scene (lure a guard with a pebble) and report which give a clean frame.
import { createWorld, stepWorld } from '../game/src/world.js';
import { findPath } from '../game/src/ai/pathfinding.js';
import { throwPebble } from '../game/src/actors/player.js';
import { STEP, TILE } from '../game/src/config.js';
const [level, hx, hy, px, py, after] = process.argv.slice(2).map(Number);
const IDLE = { dx: 0, dy: 0, sneak: true, run: false };
function walkTo(w, tx, ty) { const p = findPath(w.map, w.player.x, w.player.y, tx * TILE + 15, ty * TILE + 15); let t = 0;
  while (p.length && t < 40) { const n = p[0]; const dx = n.x - w.player.x, dy = n.y - w.player.y; if (Math.hypot(dx, dy) < 3) { p.shift(); continue; } stepWorld(w, { dx, dy, sneak: true, run: false }, STEP); t += STEP; } }
for (let wait = 0; wait <= 30; wait += 1) {
  const w = createWorld(level);
  for (let t = 0; t < wait; t += STEP) stepWorld(w, IDLE, STEP);
  walkTo(w, hx, hy);
  if (px >= 0) throwPebble(w, px * TILE + 15, py * TILE + 15);
  for (let t = 0; t < after; t += STEP) stepWorld(w, IDLE, STEP);
  const s = w.guards.map((g) => `${g.name}:${g.state}(${(g.x / 30).toFixed(0)},${(g.y / 30).toFixed(0)})${g.suspicion.toFixed(1)}`).join(' ');
  console.log(`wait ${wait}: spotted=${w.stats.spotted} at (${(w.player.x / 30).toFixed(1)},${(w.player.y / 30).toFixed(1)}) ${s}`);
}
