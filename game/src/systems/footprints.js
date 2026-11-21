// Guards' footprints and footstep rings fade over a few seconds, so the floor shows where each
// guard has just walked and the rings pulse where it is walking now.
export function ageFootprints(world, dt) {
  for (const print of world.prints) print.age += dt;
  for (const ring of world.rings) ring.age += dt;
  world.prints = world.prints.filter((p) => p.age < 4.5);
  world.rings = world.rings.filter((r) => r.age < r.life);
  if (world.prints.length > 260) world.prints.splice(0, world.prints.length - 260);
}
