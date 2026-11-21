// Search for a cover moment: the thief is spotted, slips away and hides, while the guard searches.
// Tries wait times and exposure spots on a level; prints frames where one guard hunts (ALERT not seeing,
// or SEARCH), the thief is hidden and free, and another guard is calm.
import { createWorld, stepWorld } from '../game/src/world.js';
import { findPath } from '../game/src/ai/pathfinding.js';
import { toggleHide } from '../game/src/systems/hiding.js';
import { STEP, TILE } from '../game/src/config.js';
const level = Number(process.argv[2]);
const [ex, ey] = process.argv[3].split(',').map(Number);
const [hx, hy] = process.argv[4].split(',').map(Number);
const barrel = process.argv[5] === 'barrel';
const IDLE = { dx: 0, dy: 0, sneak: true, run: false };
function walkTo(w, tx, ty, stance, limit = 25) { const p = findPath(w.map, w.player.x, w.player.y, tx * TILE + 15, ty * TILE + 15); let t = 0;
  while (p.length && t < limit && !w.outcome) { const n = p[0]; const dx = n.x - w.player.x, dy = n.y - w.player.y; if (Math.hypot(dx, dy) < 3) { p.shift(); continue; } stepWorld(w, { dx, dy, sneak: stance === 'sneak', run: stance === 'run' }, STEP); t += STEP; } }
for (let wait = 0; wait <= 24; wait += 2) {
  const w = createWorld(level);
  for (let t = 0; t < wait; t += STEP) stepWorld(w, IDLE, STEP);
  walkTo(w, ex, ey, 'walk');
  let t = 0;
  while (!w.guards.some((g) => g.state === 'ALERT') && t < 22 && !w.outcome) { stepWorld(w, IDLE, STEP); t += STEP; }
  if (!w.guards.some((g) => g.state === 'ALERT')) { console.log(`wait ${wait}: never spotted`); continue; }
  walkTo(w, hx, hy, 'run');
  if (barrel) toggleHide(w);
  for (let k = 0; k < 8; k += 1) {
    for (let s = 0; s < 0.5; s += STEP) stepWorld(w, IDLE, STEP);
    const hunt = w.guards.filter((g) => (g.state === 'ALERT' && !g.seesPlayer) || g.state === 'SEARCH');
    const st = w.guards.map((g) => `${g.name}:${g.state}${g.seesPlayer ? '*' : ''}`).join(' ');
    console.log(`wait ${wait} +${(k + 1) * 0.5}s: outcome=${w.outcome} hidden=${!!w.player.hiddenIn} hunt=${hunt.length} ${st} p=(${(w.player.x / 30).toFixed(1)},${(w.player.y / 30).toFixed(1)})`);
    if (w.outcome) break;
  }
}
