// HUSHWATER's entry point: sets up the canvas and input, then runs the fixed-step game loop.
// With ?shot=<scene> in the address it instead stages one screenshot scene (see shots.js) and
// draws it once, for the screenshots the game ships with.
import { STEP, VIEW } from './config.js';
import { createInput } from './input.js';
import { createGame, drawGame, handleInput, stepGame } from './game-flow.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const game = createGame();
// Exposed for the play-test script (tools/play-test.mjs) and for curious players in the console.
window.hushwater = game;
const shot = new URLSearchParams(location.search).get('shot');

if (shot) {
  stageShot(shot, game);
  drawGame(ctx, game);
  window.__shotReady = true;
} else {
  const input = createInput(canvas);
  let last = performance.now();
  let carry = 0;
  let lastScreen = '';
  const frame = (now) => {
    carry = Math.min(carry + (now - last) / 1000, STEP * 6);
    last = now;
    handleInput(game, input.takePresses(), input.takeClicks());
    while (carry >= STEP) {
      stepGame(game, input.intent());
      carry -= STEP;
    }
    drawGame(ctx, game);
    if (game.screen !== lastScreen) {
      lastScreen = game.screen;
      status.textContent = `HUSHWATER: ${game.screen} screen`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
