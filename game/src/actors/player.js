// The thief: moving with wall collision, the three stances (SNEAK silent and slow, WALK soft
// steps, RUN fast and loud), throwing pebbles at the cursor, and taking the ledger.
import { PLAYER, TILE } from '../config.js';
import { blocksFeet, castRay, isLit } from '../levels/tilemap.js';
import { emitNoise } from '../systems/noise.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: 0,
    radius: PLAYER.radius,
    stance: 'sneak',
    moving: false,
    stepClock: 0,
    pebbles: PLAYER.pebbles,
    hasLedger: false,
    hiddenIn: null,
    seenHiding: false,
    lit: false,
    anim: 0,
  };
}

function collides(map, x, y, r) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE);
  const y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (!blocksFeet(map, tx, ty)) continue;
      const cx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const cy = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      if ((cx - x) ** 2 + (cy - y) ** 2 < r * r) return true;
    }
  }
  return false;
}

/** Move by (dx, dy), sliding along walls one axis at a time. */
function moveWithCollision(player, map, dx, dy) {
  if (!collides(map, player.x + dx, player.y, player.radius)) player.x += dx;
  if (!collides(map, player.x, player.y + dy, player.radius)) player.y += dy;
}

/** One tick of the thief, from the input's wanted direction and stance. */
export function updatePlayer(world, intent, dt) {
  const player = world.player;
  player.anim += dt;
  if (player.hiddenIn) {
    player.moving = false;
    player.lit = false;
    return;
  }
  player.stance = intent.run ? 'run' : intent.sneak ? 'sneak' : 'walk';
  const speed = player.stance === 'run' ? PLAYER.runSpeed : player.stance === 'sneak' ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  let { dx, dy } = intent;
  const len = Math.hypot(dx, dy);
  player.moving = len > 0;
  if (player.moving) {
    dx /= len;
    dy /= len;
    player.facing = Math.atan2(dy, dx);
    moveWithCollision(player, world.map, dx * speed * dt, dy * speed * dt);
    player.stepClock += dt;
    const every = player.stance === 'run' ? PLAYER.runStepEvery : PLAYER.walkStepEvery;
    if (player.stance !== 'sneak' && player.stepClock >= every) {
      player.stepClock = 0;
      emitNoise(world, player.x, player.y, player.stance === 'run' ? PLAYER.runNoise : PLAYER.walkNoise, player.stance);
    }
  }
  player.lit = isLit(world.map, player.x, player.y);
  if (!player.hasLedger && world.map.ledger && Math.hypot(player.x - world.map.ledger.x, player.y - world.map.ledger.y) < 23) {
    player.hasLedger = true;
    world.events.push({ type: 'ledger' });
  }
  const exit = world.map.exit;
  if (player.hasLedger && Math.hypot(player.x - exit.x, player.y - exit.y) < 24) world.events.push({ type: 'escape' });
}

/** Throw a pebble toward (tx, ty): it flies until the throw range or a wall, then clatters. */
export function throwPebble(world, tx, ty) {
  const player = world.player;
  if (player.pebbles <= 0 || player.hiddenIn) return false;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) return false;
  const reach = castRay(world.map, player.x, player.y, dx / dist, dy / dist, Math.min(dist, PLAYER.throwRange));
  const land = Math.max(0, reach - 6);
  player.pebbles -= 1;
  world.pebbles.push({
    fromX: player.x, fromY: player.y, toX: player.x + (dx / dist) * land, toY: player.y + (dy / dist) * land, t: 0, flight: 0.25 + land / 900,
  });
  world.stats.pebbles += 1;
  world.events.push({ type: 'throw' });
  return true;
}
