// The screens and what moves between them: TITLE (choose a level) -> PLAY (pause with P, restart
// with R) -> RESULTS (rank; R run again, N next level, Esc title). Also turns each step's events
// into sounds, panning guards' footsteps to where they walk.
import { STEP, MAP_ORIGIN, VIEW } from './config.js';
import { LEVELS } from './levels/level-data.js';
import { createWorld, stepWorld, rankOf } from './world.js';
import { throwPebble } from './actors/player.js';
import { toggleHide } from './systems/hiding.js';
import { loadRanks, recordRank } from './systems/progress.js';
import { drawPlayFrame } from './render/scene.js';
import { drawTitle } from './ui/title-screen.js';
import { drawResults } from './ui/results-screen.js';
import { SUSPICIOUS } from './ai/guard-states.js';
import { playCue, playFootstep, unlockAudio } from './audio/synth.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_RESULTS = 'results';

export function createGame() {
  return {
    screen: SCREEN_TITLE,
    world: createWorld(0),
    backdrop: createWorld(1),
    menu: { selected: 0, ranks: loadRanks() },
    paused: false,
    guide: true,
    guideTimer: 0,
    rank: null,
    catcher: null,
    time: 0,
    moods: new Map(),
  };
}

function startLevel(game, index) {
  game.world = createWorld(index);
  game.menu.selected = index;
  game.screen = SCREEN_PLAY;
  game.paused = false;
  game.guide = index === 0;
  game.guideTimer = index === 0 ? 25 : 0;
  game.moods.clear();
}

function soundEvents(game, events) {
  const player = game.world.player;
  for (const event of events) {
    if (event.type === 'step') {
      const dx = event.guard.x - player.x;
      const dist = Math.hypot(dx, event.guard.y - player.y);
      playFootstep(dx / 320, Math.max(0, 1 - dist / 380), event.guard.kind === 'hound');
    } else if (event.type === 'noise') {
      playCue(event.noise.kind === 'pebble' ? 'pebble' : event.noise.kind === 'run' ? 'run' : 'step');
    } else if (event.type === 'alarm') playCue('alert');
    else if (event.type === 'unhide') playCue('hide');
    else playCue(event.type);
  }
  for (const guard of game.world.guards) {
    const before = game.moods.get(guard);
    if (guard.state === SUSPICIOUS && before !== SUSPICIOUS) playCue('suspect');
    game.moods.set(guard, guard.state);
  }
}

function finishLevel(game, events) {
  const world = game.world;
  game.rank = rankOf(world);
  const caught = events.find((e) => e.type === 'caught');
  game.catcher = caught ? caught.guard.name : null;
  game.menu.ranks = recordRank(game.menu.ranks, world.levelIndex, game.rank);
  game.screen = SCREEN_RESULTS;
}

function onClickPlay(game, click) {
  const mx = click.x - MAP_ORIGIN.x;
  const my = click.y - MAP_ORIGIN.y;
  if (mx < 0 || my < 0 || mx > 1020 || my > 600) return;
  throwPebble(game.world, mx, my);
}

/** Handle this frame's key presses and clicks. */
export function handleInput(game, presses, clicks) {
  if (presses.length || clicks.length) unlockAudio();
  for (const code of presses) {
    if (game.screen === SCREEN_TITLE) {
      if (code === 'Enter' || code === 'Space') startLevel(game, game.menu.selected);
      else if (code === 'ArrowUp' || code === 'KeyW') game.menu.selected = (game.menu.selected + LEVELS.length - 1) % LEVELS.length;
      else if (code === 'ArrowDown' || code === 'KeyS') game.menu.selected = (game.menu.selected + 1) % LEVELS.length;
      else if (/^Digit[1-9]$/.test(code) && Number(code.slice(5)) <= LEVELS.length) game.menu.selected = Number(code.slice(5)) - 1;
    } else if (game.screen === SCREEN_PLAY) {
      if (code === 'KeyP' || (code === 'Blur' && !game.paused)) game.paused = code === 'Blur' ? true : !game.paused;
      else if (code === 'Escape') game.paused = !game.paused;
      else if (code === 'KeyR') startLevel(game, game.world.levelIndex);
      else if (code === 'KeyH') {
        game.guide = !game.guide;
        game.guideTimer = 0;
      } else if (code === 'KeyE' && !game.paused) toggleHide(game.world);
      else if (code === 'KeyQ' && game.paused) game.screen = SCREEN_TITLE;
    } else if (game.screen === SCREEN_RESULTS) {
      if (code === 'KeyR') startLevel(game, game.world.levelIndex);
      else if (code === 'KeyN' || code === 'Enter') {
        const next = game.world.outcome === 'escaped' ? game.world.levelIndex + 1 : game.world.levelIndex;
        if (next < LEVELS.length) startLevel(game, next);
        else game.screen = SCREEN_TITLE;
      } else if (code === 'Escape') game.screen = SCREEN_TITLE;
    }
  }
  for (const click of clicks) {
    if (game.screen === SCREEN_TITLE) {
      const row = Math.floor((click.y - 164) / 88);
      if (click.x > 896 && click.x < 1224 && row >= 0 && row < LEVELS.length) game.menu.selected = row;
      startLevel(game, game.menu.selected);
    } else if (game.screen === SCREEN_PLAY && !game.paused) onClickPlay(game, click);
  }
}

/** Advance the game by one fixed step. */
export function stepGame(game, intent) {
  game.time += STEP;
  if (game.screen === SCREEN_TITLE) {
    stepWorld(game.backdrop, { dx: 0, dy: 0, sneak: true, run: false }, STEP);
    return;
  }
  if (game.screen !== SCREEN_PLAY || game.paused) return;
  if (game.guideTimer > 0) {
    game.guideTimer -= STEP;
    if (game.guideTimer <= 0) game.guide = false;
  }
  const events = stepWorld(game.world, intent, STEP);
  soundEvents(game, events);
  if (game.world.outcome) finishLevel(game, events);
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(4,6,16,0.65)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd86b';
  ctx.font = 'bold 56px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2 - 30);
  ctx.fillStyle = '#e2e8f5';
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('P or ESC: resume · R: restart · Q: quit to title', VIEW.width / 2, VIEW.height / 2 + 24);
}

export function drawGame(ctx, game) {
  if (game.screen === SCREEN_TITLE) {
    drawTitle(ctx, game.backdrop, game.time, game.menu);
    return;
  }
  drawPlayFrame(ctx, game.world, game.time, { guide: game.guide });
  if (game.screen === SCREEN_RESULTS) drawResults(ctx, game.world, game.rank, game.menu.ranks, game.time, game.catcher);
  else if (game.paused) drawPause(ctx);
}
