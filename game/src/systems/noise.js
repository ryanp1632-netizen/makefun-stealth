// Noise: running feet, walking feet and landing pebbles make a ring of sound. Every guard whose
// ears it reaches turns to look and goes to check the spot. Rings are drawn so the player sees
// exactly how far their noise carried.
import { hears } from '../ai/hearing.js';
import { hearNoise } from '../ai/guard-states.js';

export function emitNoise(world, x, y, radius, kind) {
  const noise = { x, y, radius, kind, age: 0, life: kind === 'pebble' ? 1.5 : 0.6, heardBy: 0 };
  for (const guard of world.guards) {
    if (hears(guard, noise, world.map)) {
      hearNoise(guard, noise);
      noise.heardBy += 1;
    }
  }
  world.noises.push(noise);
  if (kind !== 'sneak') world.events.push({ type: 'noise', noise });
  return noise;
}

/** Fly pebbles; a landing pebble makes the loudest noise in the game. */
export function updatePebbles(world, dt, pebbleNoise) {
  for (const pebble of world.pebbles) {
    pebble.t += dt;
    if (!pebble.landed && pebble.t >= pebble.flight) {
      pebble.landed = true;
      pebble.restAge = 0;
      emitNoise(world, pebble.toX, pebble.toY, pebbleNoise, 'pebble');
    }
    if (pebble.landed) pebble.restAge += dt;
  }
  world.pebbles = world.pebbles.filter((p) => !p.landed || p.restAge < 6);
}

export function ageNoises(world, dt) {
  for (const noise of world.noises) noise.age += dt;
  world.noises = world.noises.filter((n) => n.age < n.life);
}
