// Hiding in barrels: press E beside a barrel to climb in (no guard can see you there), press E
// again to climb out where you came from. A guard that watched you climb in will come and look.
import { blocksFeet } from '../levels/tilemap.js';
import { TILE } from '../config.js';

/** The barrel within reach of the thief, or null. */
export function barrelInReach(world) {
  const player = world.player;
  let best = null;
  let bestDist = 40;
  for (const barrel of world.map.barrels) {
    const d = Math.hypot(barrel.x - player.x, barrel.y - player.y);
    if (d < bestDist) {
      bestDist = d;
      best = barrel;
    }
  }
  return best;
}

export function toggleHide(world) {
  const player = world.player;
  if (player.hiddenIn) {
    player.x = player.outX;
    player.y = player.outY;
    player.hiddenIn = null;
    player.seenHiding = false;
    world.events.push({ type: 'unhide' });
    return;
  }
  const barrel = barrelInReach(world);
  if (!barrel) return;
  player.outX = player.x;
  player.outY = player.y;
  if (blocksFeet(world.map, Math.floor(player.x / TILE), Math.floor(player.y / TILE))) return;
  player.seenHiding = world.guards.some((g) => g.seesPlayer);
  player.hiddenIn = barrel;
  player.x = barrel.x;
  player.y = barrel.y;
  world.events.push({ type: 'hide' });
}
