// The screenshot scenes behind ?shot=title|cover|nearmiss|results. Each plays the real game
// forward from a fresh level: guards walk their patrols, and a scripted thief walks a route
// (planned with the guards' own pathfinding), sneaks, throws pebbles and hides exactly as a
// player would, so every frame is a real moment of play and the same scene always gives the
// same frame.
import { STEP, TILE } from './config.js';
import { createWorld, stepWorld, rankOf } from './world.js';
import { findPath } from './ai/pathfinding.js';
import { throwPebble } from './actors/player.js';
import { recordRank } from './systems/progress.js';
import { toggleHide } from './systems/hiding.js';
import { ALERT } from './ai/guard-states.js';
import { SCREEN_PLAY, SCREEN_RESULTS, SCREEN_TITLE } from './game-flow.js';

const IDLE = { dx: 0, dy: 0, sneak: true, run: false };

/** The results scene's run through level 1: [tileX, tileY, stance, wait seconds after]. */
const RESULTS_ROUTE = [[6, 9, 'sneak', 0], [6, 12, 'walk', 0], [8, 13, 'walk', 0], [16, 13, 'sneak', 0], [16, 9, 'sneak', 0], [27, 9, 'walk', 0], [30, 4, 'sneak', 0], [27, 8, 'walk', 0], [32, 12, 'walk', 0], [33, 15, 'walk', 0]];

function wait(world, seconds) {
  for (let t = 0; t < seconds; t += STEP) stepWorld(world, IDLE, STEP);
}

/** Walk the thief to tile (tx, ty) along a planned path, in the given stance. */
function walkTo(world, tx, ty, stance = 'sneak', limit = 30) {
  const goal = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  const path = findPath(world.map, world.player.x, world.player.y, goal.x, goal.y);
  let time = 0;
  while (path.length > 0 && time < limit && !world.outcome) {
    const next = path[0];
    const dx = next.x - world.player.x;
    const dy = next.y - world.player.y;
    if (Math.hypot(dx, dy) < 3) {
      path.shift();
      continue;
    }
    stepWorld(world, { dx, dy, sneak: stance === 'sneak', run: stance === 'run' }, STEP);
    time += STEP;
  }
}

function throwAt(world, tx, ty, flight = 0.5) {
  throwPebble(world, tx * TILE + TILE / 2, ty * TILE + TILE / 2);
  wait(world, flight);
}

export function stageShot(name, game) {
  if (name === 'title') {
    game.screen = SCREEN_TITLE;
    game.menu.ranks = ['GHOST', 'SHADOW'];
    game.menu.selected = 2;
    wait(game.backdrop, 21);
    game.time = 21;
    return;
  }
  if (name === 'cover') {
    // LANTERN ROW: MAUD spots the thief on the cobbles and raises the alarm. The thief throws a
    // pebble over the canal, runs and climbs into a barrel: MAUD (red, alert) chases the clatter,
    // WREN (amber, suspicious) goes to look at it, OTTO (pale) keeps his patrol.
    const world = createWorld(1);
    wait(world, 12);
    walkTo(world, 12, 12, 'walk');
    for (let t = 0; t < 22 && !world.guards.some((g) => g.state === ALERT); t += STEP) stepWorld(world, IDLE, STEP);
    throwPebble(world, 13 * TILE + TILE / 2, 6 * TILE + TILE / 2);
    walkTo(world, 14, 14, 'run');
    toggleHide(world);
    wait(world, 0.2);
    game.world = world;
    game.screen = SCREEN_PLAY;
    game.guide = true;
    game.time = world.clock;
    return;
  }
  if (name === 'nearmiss') {
    // HARBOURMASTER'S YARD: OTTO's lantern sweeps over the thief at the edge of the reeds; his
    // meter is filling and the "?" is up, but he has not raised the alarm yet.
    const world = createWorld(3);
    wait(world, 1);
    walkTo(world, 6, 16);
    wait(world, 0.25);
    game.world = world;
    game.screen = SCREEN_PLAY;
    game.guide = false;
    game.time = world.clock;
    return;
  }
  // THE SALT QUAY, played through: over the footbridge, along the bottom quay behind OTTO, up to
  // the ledger and out of the gate without being spotted.
  const world = createWorld(0);
  for (const [tx, ty, stance, pause] of RESULTS_ROUTE) {
    walkTo(world, tx, ty, stance);
    if (pause) wait(world, pause);
  }
  game.world = world;
  game.rank = rankOf(world);
  game.menu.ranks = recordRank(['GHOST', 'SHADOW'], 0, game.rank);
  game.screen = SCREEN_RESULTS;
  game.time = 2;
}
