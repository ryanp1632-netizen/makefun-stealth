// Headless check of the level logic: steps each level with an idle thief and reports guard movement and states.
import { createWorld, stepWorld } from '../game/src/world.js';
import { STEP } from '../game/src/config.js';
for (let level = 0; level < 4; level += 1) {
  const world = createWorld(level);
  const seen = new Set();
  const travelled = world.guards.map(() => 0);
  const last = world.guards.map((g) => [g.x, g.y]);
  for (let i = 0; i < 60 / STEP; i += 1) {
    stepWorld(world, { dx: 0, dy: 0, sneak: true, run: false }, STEP);
    world.guards.forEach((g, k) => { travelled[k] += Math.hypot(g.x - last[k][0], g.y - last[k][1]); last[k] = [g.x, g.y]; seen.add(g.state); });
  }
  console.log(`L${level + 1} ${world.def.name}: outcome=${world.outcome} spotted=${world.stats.spotted} states=${[...seen]} travelled=${travelled.map((t) => t.toFixed(0))}`);
}
