// What a guard (or the wall beacon) can see: its vision cone, ray-cast against walls, crates and
// barrels so cover really cuts it, and the test of whether the thief is inside it. Shadow
// shortens the sight line, tall reeds hide a thief who is not running, a barrel hides fully.
import { GUARD } from '../config.js';
import { castRay, lineOfSight, isLit, tileAtPoint, TILE_REEDS } from '../levels/tilemap.js';
import { angleDiff } from './patrol-route.js';

const CONE_RAYS = 44;

/** Recompute guard.cone: the polygon of floor the guard's lantern reaches, origin first. */
export function buildCone(guard, map) {
  const points = [guard.x, guard.y];
  const half = guard.fov / 2;
  for (let index = 0; index <= CONE_RAYS; index += 1) {
    const angle = guard.facing - half + (index / CONE_RAYS) * guard.fov;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const dist = castRay(map, guard.x, guard.y, dx, dy, guard.sightRange);
    points.push(guard.x + dx * dist, guard.y + dy * dist);
  }
  guard.cone = points;
}

export function inReeds(map, player) {
  return tileAtPoint(map, player.x, player.y) === TILE_REEDS;
}

/**
 * How well `guard` sees the player right now: 0 when it cannot, otherwise a closeness weight
 * from just above 0 at the edge of its range up to 1 when the player is close.
 */
export function sightOfPlayer(guard, world) {
  const player = world.player;
  if (player.hiddenIn) return 0;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < GUARD.radius + player.radius + 2) return 1;
  const lit = isLit(world.map, player.x, player.y);
  player.lit = lit;
  let range = guard.sightRange * (lit ? 1 : GUARD.shadowSight);
  if (inReeds(world.map, player) && player.stance !== 'run') range = Math.min(range, 34);
  if (dist > range) return 0;
  if (Math.abs(angleDiff(guard.facing, Math.atan2(dy, dx))) > guard.fov / 2) return 0;
  if (!lineOfSight(world.map, guard.x, guard.y, player.x, player.y)) return 0;
  return Math.max(0.05, 1 - dist / range);
}
