// One level in play: builds it from its definition and runs one fixed step of every system in
// order (thief, pebbles, guards, noise, footprints), then turns the step's events into stats,
// popups and the level's outcome (escaped or caught).
import { CAMERA, PLAYER } from './config.js';
import { LEVELS } from './levels/level-data.js';
import { parseLevel } from './levels/tilemap.js';
import { createPlayer, updatePlayer } from './actors/player.js';
import { createGuard, updateGuard } from './actors/guard.js';
import { ageNoises, updatePebbles } from './systems/noise.js';
import { ageFootprints } from './systems/footprints.js';
import { answerAlarm } from './ai/guard-states.js';

export function createWorld(levelIndex) {
  const def = LEVELS[levelIndex];
  const map = parseLevel(def);
  return {
    levelIndex,
    def,
    map,
    player: createPlayer(map.start),
    guards: def.guards.map((g, i) => createGuard(g, i)),
    noises: [],
    rings: [],
    prints: [],
    pebbles: [],
    popups: [],
    events: [],
    heard: [],
    stats: { time: 0, spotted: 0, nearMisses: 0, pebbles: 0 },
    outcome: null,
    clock: 0,
  };
}

function popup(world, text, sub, color) {
  world.popups = world.popups.filter((p) => p.text !== text);
  world.popups.push({ text, sub, color, age: 0, life: 2.6 });
  if (world.popups.length > 2) world.popups.shift();
}

function handleEvents(world) {
  for (const event of world.events) {
    switch (event.type) {
      case 'alert':
        world.stats.spotted += 1;
        popup(world, 'SPOTTED!', `${event.guard.name} raised the alarm: break line of sight`, '#ff4d4d');
        break;
      case 'alarm':
        world.stats.spotted += 1;
        popup(world, 'BEACON ALARM', `${event.guard.name} calls the guards to you`, '#ff4d4d');
        for (const guard of world.guards) {
          if (Math.hypot(guard.x - event.x, guard.y - event.y) < CAMERA.alarmRadius) answerAlarm(guard, event.x, event.y, world.map);
        }
        break;
      case 'nearMiss':
        world.stats.nearMisses += 1;
        popup(world, 'NEAR MISS', `${event.guard.name} lost interest`, '#ffc04d');
        break;
      case 'ledger':
        popup(world, 'LEDGER TAKEN', 'the EXIT gate is open: get out unseen', '#ffd86b');
        break;
      case 'caught':
        if (!world.outcome) world.outcome = 'caught';
        break;
      case 'escape':
        if (!world.outcome) world.outcome = 'escaped';
        break;
      default:
        break;
    }
  }
}

/** Advance the level by dt seconds; intent = { dx, dy, sneak, run }. Returns this step's events. */
export function stepWorld(world, intent, dt) {
  world.events = [];
  if (world.outcome) return world.events;
  world.clock += dt;
  world.stats.time += dt;
  updatePlayer(world, intent, dt);
  updatePebbles(world, dt, PLAYER.pebbleNoise);
  for (const guard of world.guards) updateGuard(guard, world, dt);
  ageNoises(world, dt);
  ageFootprints(world, dt);
  for (const p of world.popups) p.age += dt;
  world.popups = world.popups.filter((p) => p.age < p.life);
  handleEvents(world);
  return world.events;
}

/** The level's rank from how it ended and how often the thief was spotted. */
export function rankOf(world) {
  if (world.outcome === 'caught') return 'CAUGHT';
  if (world.stats.spotted === 0) return 'GHOST';
  if (world.stats.spotted === 1) return 'SHADOW';
  return 'SEEN';
}
