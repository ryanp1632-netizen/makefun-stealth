// The guard's mind: a state machine that gives the thief a chance to recover.
//   PATROL -> SUSPICIOUS "?" (stops, turns to look; the meter fills while it sees you)
//          -> INVESTIGATE (walks to where it saw or heard something, looks around)
//          -> ALERT "!" (meter full: chases; touching you is CAUGHT)
//          -> SEARCH (lost you: sweeps the spot) -> RETURN (walks back to its route) -> PATROL
// Wall beacons have their own small mind: SWEEP -> TRACKING -> ALARM (calls the guards over).
import { DETECT, GUARD, CAMERA } from '../config.js';
import { advancePatrol, followPath, headTo, rejoinRoute, turnToward } from './patrol-route.js';

export const PATROL = 'PATROL';
export const SUSPICIOUS = 'SUSPICIOUS';
export const INVESTIGATE = 'INVESTIGATE';
export const ALERT = 'ALERT';
export const SEARCH = 'SEARCH';
export const RETURN = 'RETURN';
export const SWEEP = 'SWEEP';
export const TRACKING = 'TRACKING';
export const ALARM = 'ALARM';

function enter(guard, state) {
  guard.state = state;
  guard.stateTime = 0;
}

/** Fill or drain the guard's suspicion from what it sees this tick. */
function updateSuspicion(guard, world, sight, dt) {
  const player = world.player;
  if (sight > 0) {
    guard.seesPlayer = true;
    guard.lastSeen = { x: player.x, y: player.y };
    const stance = player.stance === 'run' ? 1.5 : player.stance === 'sneak' ? 0.75 : 1;
    const light = player.lit ? 1.5 : 1;
    const rise = DETECT.baseRise * (0.55 + 2.3 * sight) * stance * light * guard.eyes;
    guard.suspicion = Math.min(1, guard.suspicion + rise * dt);
  } else {
    guard.seesPlayer = false;
    if (guard.state !== ALERT) guard.suspicion = Math.max(0, guard.suspicion - DETECT.decay * dt);
  }
  guard.peak = Math.max(guard.peak, guard.suspicion);
}

function raiseAlert(guard, world) {
  if (guard.state !== ALERT) {
    world.events.push({ type: 'alert', guard });
  }
  enter(guard, ALERT);
  guard.suspicion = 1;
  guard.path = [];
}

function settle(guard, world) {
  if (guard.peak >= DETECT.nearMiss && !guard.wasAlerted) world.events.push({ type: 'nearMiss', guard });
  guard.peak = 0;
  guard.wasAlerted = false;
  enter(guard, RETURN);
  rejoinRoute(guard, world.map);
}

/** One tick of a walking guard's (or hound's) mind and legs. */
export function thinkGuard(guard, world, sight, dt) {
  const map = world.map;
  updateSuspicion(guard, world, sight, dt);
  guard.stateTime += dt;
  if (guard.suspicion >= 1 && guard.state !== ALERT) raiseAlert(guard, world);

  switch (guard.state) {
    case PATROL:
    case RETURN:
      if (guard.suspicion > DETECT.notice) {
        enter(guard, SUSPICIOUS);
        guard.path = [];
        break;
      }
      if (guard.state === PATROL) advancePatrol(guard, map, dt);
      else if (followPath(guard, guard.patrolSpeed, dt)) enter(guard, PATROL);
      break;
    case SUSPICIOUS: {
      const spot = guard.lastSeen;
      if (spot) turnToward(guard, Math.atan2(spot.y - guard.y, spot.x - guard.x), dt);
      if (guard.stateTime > (guard.seesPlayer ? 2.2 : 0.9)) {
        enter(guard, INVESTIGATE);
        if (spot) headTo(guard, map, spot.x, spot.y);
      }
      break;
    }
    case INVESTIGATE: {
      if (guard.seesPlayer && guard.stateTime % 0.5 < dt) headTo(guard, map, guard.lastSeen.x, guard.lastSeen.y);
      const arrived = guard.path.length === 0 || followPath(guard, guard.investigateSpeed, dt);
      if (arrived) {
        guard.lookTime = (guard.lookTime ?? 0) + dt;
        turnToward(guard, guard.facing + 2.4, dt);
        if (guard.lookTime > GUARD.investigateLook && guard.suspicion < 0.5) {
          guard.lookTime = 0;
          settle(guard, world);
        }
      } else guard.lookTime = 0;
      break;
    }
    case ALERT: {
      const player = world.player;
      guard.wasAlerted = true;
      if (guard.seesPlayer) {
        if (guard.stateTime % 0.25 < dt || guard.path.length === 0) headTo(guard, map, player.x, player.y);
        followPath(guard, guard.chaseSpeed, dt);
        if (Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.catchDistance) world.events.push({ type: 'caught', guard });
      } else if (guard.path.length === 0 && guard.lastSeen) {
        if (Math.hypot(guard.lastSeen.x - guard.x, guard.lastSeen.y - guard.y) > 6) headTo(guard, map, guard.lastSeen.x, guard.lastSeen.y);
        if (guard.path.length === 0) {
          enter(guard, SEARCH);
          guard.suspicion = 0.7;
        }
      } else if (followPath(guard, guard.chaseSpeed * 0.85, dt)) {
        enter(guard, SEARCH);
        guard.suspicion = 0.7;
      }
      // A guard that watched the thief climb into a barrel checks that barrel.
      if (player.hiddenIn && player.seenHiding && Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.catchDistance + 12) {
        world.events.push({ type: 'caught', guard });
      }
      break;
    }
    case SEARCH:
      turnToward(guard, guard.facing + 3, dt);
      if (guard.stateTime > GUARD.searchLook) settle(guard, world);
      break;
    default:
      enter(guard, PATROL);
  }
}

/** A noise reached the guard: look toward it, then go and check it (unless already chasing someone in sight). */
export function hearNoise(guard, noise) {
  if (guard.state === ALERT && guard.seesPlayer) return;
  guard.lastSeen = { x: noise.x, y: noise.y };
  guard.heardAt = { x: noise.x, y: noise.y, age: 0 };
  if (guard.state === ALERT) {
    guard.path = [];
    return;
  }
  guard.suspicion = Math.max(guard.suspicion, noise.kind === 'pebble' ? 0.2 : 0.3);
  guard.state = SUSPICIOUS;
  guard.stateTime = 0;
  guard.path = [];
}

/** A beacon's mind: sweep, lock on and track, and at a full meter call every guard nearby. */
export function thinkCamera(camera, world, sight, dt) {
  camera.stateTime += dt;
  const player = world.player;
  if (camera.state === ALARM) {
    camera.seesPlayer = sight > 0;
    if (camera.stateTime > 5) {
      camera.state = SWEEP;
      camera.stateTime = 0;
      camera.suspicion = 0;
    }
    turnToward(camera, Math.atan2(player.y - camera.y, player.x - camera.x), dt * (camera.seesPlayer ? 1 : 0));
    return;
  }
  updateSuspicion(camera, world, sight, dt);
  if (camera.seesPlayer) {
    camera.state = TRACKING;
    turnToward(camera, Math.atan2(player.y - camera.y, player.x - camera.x), dt * 0.6);
  } else {
    if (camera.state === TRACKING && camera.suspicion <= 0) {
      camera.state = SWEEP;
      if (camera.peak >= DETECT.nearMiss) world.events.push({ type: 'nearMiss', guard: camera });
      camera.peak = 0;
    }
    if (camera.state === SWEEP || camera.suspicion > 0) {
      camera.sweepClock += dt * CAMERA.sweepSpeed;
      turnToward(camera, camera.baseFacing + Math.sin(camera.sweepClock) * camera.sweep, dt);
    }
  }
  if (camera.suspicion >= 1) {
    camera.state = ALARM;
    camera.stateTime = 0;
    camera.peak = 0;
    world.events.push({ type: 'alarm', guard: camera, x: player.x, y: player.y });
  }
}

/** The beacon's alarm: every walking guard within reach runs to where the thief was seen. */
export function answerAlarm(guard, x, y, map) {
  if (guard.kind === 'camera') return;
  guard.lastSeen = { x, y };
  guard.suspicion = 1;
  guard.wasAlerted = true;
  guard.state = ALERT;
  guard.stateTime = 0;
  headTo(guard, map, x, y);
}
