// The detection meter on the HUD: how close the thief is to being caught, from the most
// suspicious guard, with the word the HUD shows for it.
import { ALERT, ALARM, SEARCH } from '../ai/guard-states.js';

export function detectionLevel(world) {
  let level = 0;
  let watcher = null;
  for (const guard of world.guards) {
    if (guard.suspicion > level) {
      level = guard.suspicion;
      watcher = guard;
    }
  }
  return { level, watcher };
}

export function detectionWord(world) {
  const { level } = detectionLevel(world);
  if (world.guards.some((g) => (g.state === ALERT || g.state === ALARM) && g.seesPlayer)) return 'SPOTTED';
  if (world.guards.some((g) => g.state === ALERT || g.state === SEARCH || g.state === ALARM)) return 'HUNTED';
  if (world.player.hiddenIn) return 'HIDDEN';
  if (level > 0.5) return 'SUSPECTED';
  if (level > 0.02) return 'NOTICED';
  return world.player.lit ? 'IN LIGHT' : 'UNSEEN';
}
