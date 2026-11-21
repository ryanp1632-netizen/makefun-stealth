// A guard, hound or wall beacon: its body and stats by kind, and its per-tick update (look,
// think, move, then leave footprints and footstep sounds that tell the thief where it walks).
import { GUARD, HOUND, CAMERA, TILE } from '../config.js';
import { tileCenter } from '../levels/tilemap.js';
import { buildCone, sightOfPlayer } from '../ai/vision-cone.js';
import { PATROL, SWEEP, ALERT, thinkCamera, thinkGuard } from '../ai/guard-states.js';

const COATS = ['#3fd0e0', '#f07ad0', '#9be35a', '#ffb347', '#a98bff'];

export function createGuard(def, index) {
  const base = {
    name: def.name,
    kind: def.kind,
    coat: COATS[index % COATS.length],
    suspicion: 0,
    peak: 0,
    stateTime: 0,
    seesPlayer: false,
    lastSeen: null,
    heardAt: null,
    path: [],
    goal: null,
    clock: index * 1.3,
    moved: 0,
    stepSide: 1,
    turnRate: GUARD.turnRate,
    cone: [],
    eyes: 1,
  };
  if (def.kind === 'camera') {
    const c = tileCenter(def.at[0], def.at[1]);
    const facing = (def.facing * Math.PI) / 180;
    return {
      ...base, x: c.x, y: c.y, facing, baseFacing: facing, sweep: ((def.sweep ?? 60) * Math.PI) / 180,
      sweepClock: index, state: SWEEP, sightRange: CAMERA.sightRange, fov: CAMERA.fov, hearing: 0, turnRate: 1.6, eyes: 0.8,
    };
  }
  const first = def.route[0];
  const c = tileCenter(first[0], first[1]);
  const hound = def.kind === 'hound';
  return {
    ...base,
    x: c.x,
    y: c.y,
    facing: ((first[3] ?? 0) * Math.PI) / 180,
    route: def.route,
    routeIndex: 0,
    pauseLeft: first[2],
    state: PATROL,
    sightRange: hound ? HOUND.sightRange : GUARD.sightRange,
    fov: hound ? HOUND.fov : GUARD.fov,
    hearing: hound ? HOUND.hearing : GUARD.hearing,
    patrolSpeed: hound ? HOUND.patrolSpeed : GUARD.patrolSpeed,
    investigateSpeed: GUARD.investigateSpeed * (hound ? 1.2 : 1),
    chaseSpeed: hound ? HOUND.chaseSpeed : GUARD.chaseSpeed,
  };
}

/** Leave a footprint and a footstep ring every stride; faster strides when chasing. */
function leaveFootsteps(guard, world) {
  const stride = guard.kind === 'hound' ? 16 : 24;
  if (guard.moved < stride) return;
  guard.moved = 0;
  guard.stepSide = -guard.stepSide;
  const side = guard.stepSide * (guard.kind === 'hound' ? 3 : 5);
  const px = guard.x + Math.cos(guard.facing + Math.PI / 2) * side;
  const py = guard.y + Math.sin(guard.facing + Math.PI / 2) * side;
  world.prints.push({ x: px, y: py, angle: guard.facing, age: 0, hound: guard.kind === 'hound', coat: guard.coat });
  world.rings.push({ x: guard.x, y: guard.y, age: 0, life: 0.7, radius: guard.state === ALERT ? 46 : 30, color: guard.coat });
  world.events.push({ type: 'step', guard });
}

export function updateGuard(guard, world, dt) {
  guard.clock += dt;
  if (guard.heardAt) {
    guard.heardAt.age += dt;
    if (guard.heardAt.age > 1.6) guard.heardAt = null;
  }
  const sight = sightOfPlayer(guard, world);
  if (guard.kind === 'camera') thinkCamera(guard, world, sight, dt);
  else {
    thinkGuard(guard, world, sight, dt);
    leaveFootsteps(guard, world);
  }
  buildCone(guard, world.map);
}

/** The tile the guard stands on, for debugging and tests. */
export function guardTile(guard) {
  return [Math.floor(guard.x / TILE), Math.floor(guard.y / TILE)];
}
