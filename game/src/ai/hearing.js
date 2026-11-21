// Guards' ears: whether a noise reaches a guard. Walls and crates muffle sound to 60% of its
// range; the hound hears almost twice as far as a guard; beacons are deaf.
import { lineOfSight } from '../levels/tilemap.js';

export function hears(guard, noise, map) {
  if (guard.kind === 'camera') return false;
  const dist = Math.hypot(noise.x - guard.x, noise.y - guard.y);
  const clear = lineOfSight(map, noise.x, noise.y, guard.x, guard.y);
  return dist <= noise.radius * guard.hearing * (clear ? 1 : 0.6);
}
