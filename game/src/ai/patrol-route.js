// Walking a guard along its patrol: head for the next route point, stop there, sweep the lantern
// left and right toward the point's look angle, then move on. Also the shared "walk this path"
// and "turn to face" steps every guard state uses.
import { findPath } from './pathfinding.js';
import { tileCenter } from '../levels/tilemap.js';

export function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Turn the guard's facing toward `target` angle at its turn rate. */
export function turnToward(guard, target, dt) {
  const d = angleDiff(guard.facing, target);
  const max = guard.turnRate * dt;
  guard.facing += Math.abs(d) <= max ? d : Math.sign(d) * max;
}

/** Step along guard.path at `speed`; true once the last point is reached. */
export function followPath(guard, speed, dt) {
  let budget = speed * dt;
  while (budget > 0 && guard.path.length > 0) {
    const next = guard.path[0];
    const dx = next.x - guard.x;
    const dy = next.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) {
      guard.path.shift();
      continue;
    }
    turnToward(guard, Math.atan2(dy, dx), dt);
    const move = Math.min(dist, budget);
    guard.x += (dx / dist) * move;
    guard.y += (dy / dist) * move;
    guard.moved += move;
    budget -= move;
    if (move === dist) guard.path.shift();
  }
  return guard.path.length === 0;
}

/** Plan a path to a pixel point. */
export function headTo(guard, map, x, y) {
  guard.path = findPath(map, guard.x, guard.y, x, y);
  guard.goal = { x, y };
}

/** One patrol tick: walk to the current route point, pause and look, then pick the next point. */
export function advancePatrol(guard, map, dt) {
  const point = guard.route[guard.routeIndex];
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    const look = point[3] === undefined ? guard.facing : (point[3] * Math.PI) / 180;
    const sweep = Math.sin(guard.clock * 1.7) * 0.75;
    turnToward(guard, look + sweep, dt);
    if (guard.pauseLeft <= 0) {
      guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
      const target = tileCenter(guard.route[guard.routeIndex][0], guard.route[guard.routeIndex][1]);
      headTo(guard, map, target.x, target.y);
    }
    return;
  }
  if (guard.path.length === 0) {
    const target = tileCenter(point[0], point[1]);
    if (Math.hypot(target.x - guard.x, target.y - guard.y) > 2) headTo(guard, map, target.x, target.y);
  }
  if (followPath(guard, guard.patrolSpeed, dt)) guard.pauseLeft = point[2];
}

/** Plan the walk back to the nearest route point after an alarm or a search. */
export function rejoinRoute(guard, map) {
  let best = 0;
  let bestDist = Infinity;
  guard.route.forEach((point, index) => {
    const c = tileCenter(point[0], point[1]);
    const d = Math.hypot(c.x - guard.x, c.y - guard.y);
    if (d < bestDist) {
      bestDist = d;
      best = index;
    }
  });
  guard.routeIndex = best;
  guard.pauseLeft = 0;
  const c = tileCenter(guard.route[best][0], guard.route[best][1]);
  headTo(guard, map, c.x, c.y);
}
