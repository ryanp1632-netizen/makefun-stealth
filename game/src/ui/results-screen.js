// The end-of-level screen: the rank earned (GHOST, SHADOW, SEEN or CAUGHT) over the final frame,
// the run's stats against the level's par time, the rank ladder, every level's best rank, and
// the keys to run again, go on, or go back to the title.
import { VIEW, RANKS } from '../config.js';
import { LEVELS } from '../levels/level-data.js';
import { formatTime } from '../render/hud.js';
import { RANK_COLORS } from './title-screen.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function text(ctx, value, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

const RANK_NOTES = {
  GHOST: 'never spotted',
  SHADOW: 'spotted once',
  SEEN: 'spotted 2+ times',
  CAUGHT: 'an alert guard got you',
};

export function drawResults(ctx, world, rank, ranks, time, catcher) {
  ctx.fillStyle = 'rgba(4,6,16,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const x = 250;
  const y = 70;
  const w = 780;
  const h = 580;
  ctx.fillStyle = 'rgba(10,14,30,0.96)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  const color = RANK_COLORS[rank];
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  const escaped = world.outcome === 'escaped';
  text(ctx, escaped ? `ESCAPED ${world.def.name}` : `CAUGHT IN ${world.def.name}`, VIEW.width / 2, y + 38, 20, escaped ? '#7dffad' : '#ff6a5a', 'center');
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 30 + 8 * Math.sin(time * 3);
  text(ctx, rank, VIEW.width / 2, y + 112, 92, color, 'center');
  ctx.restore();
  text(ctx, escaped ? `with the ledger · ${RANK_NOTES[rank]}` : `${catcher ?? 'A guard'} caught you · try a quieter route`, VIEW.width / 2, y + 172, 17, '#e2e8f5', 'center', 'normal');

  const stats = [
    ['TIME', `${formatTime(world.stats.time)}  (par ${formatTime(world.def.par)})`, world.stats.time <= world.def.par ? '#7dffad' : '#ffc04d'],
    ['TIMES SPOTTED', String(world.stats.spotted), world.stats.spotted ? '#ff6a5a' : '#7dffad'],
    ['NEAR MISSES', String(world.stats.nearMisses), '#ffc04d'],
    ['PEBBLES THROWN', String(world.stats.pebbles), '#d9dde6'],
  ];
  stats.forEach(([name, value, c], i) => {
    const sy = y + 222 + i * 40;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)';
    ctx.fillRect(x + 60, sy - 17, 380, 34);
    text(ctx, name, x + 76, sy, 15, '#9fb3d9');
    text(ctx, value, x + 424, sy, 17, c, 'right');
  });

  text(ctx, 'RANKS', x + 500, y + 214, 15, '#ffd86b');
  RANKS.forEach((r, i) => {
    const ry = y + 246 + i * 34;
    const mine = r === rank;
    if (mine) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x + 488, ry - 15, 240, 30);
    }
    text(ctx, r, x + 500, ry, 16, RANK_COLORS[r]);
    text(ctx, RANK_NOTES[r], x + 600, ry, 13, mine ? '#ffffff' : '#8a93ad', 'left', 'normal');
  });

  text(ctx, 'BEST PER LEVEL', x + 60, y + 400, 14, '#ffd86b');
  LEVELS.forEach((level, i) => {
    const bx = x + 60 + i * 168;
    ctx.fillStyle = i === world.levelIndex ? 'rgba(255,216,107,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(bx, y + 416, 156, 52, 8);
    ctx.fill();
    text(ctx, `${i + 1} ${level.name}`, bx + 10, y + 432, 11, '#cfd7ea');
    const best = ranks[i];
    text(ctx, best ?? '—', bx + 10, y + 452, 15, best ? RANK_COLORS[best] : '#5a6380');
  });

  const keys = [['R', 'run again'], ['N', escaped && world.levelIndex < LEVELS.length - 1 ? 'next level' : 'level select'], ['ESC', 'title']];
  keys.forEach(([key, what], i) => {
    const kx = x + 110 + i * 200;
    const ky = y + 524;
    ctx.fillStyle = '#1d2540';
    ctx.beginPath();
    ctx.roundRect(kx, ky - 18, 52, 36, 8);
    ctx.fill();
    ctx.strokeStyle = '#5ff2ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, key, kx + 26, ky, 16, '#5ff2ff', 'center');
    text(ctx, what, kx + 64, ky, 17, '#ffffff', 'left', 'normal');
  });
}
