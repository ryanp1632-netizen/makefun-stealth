// The title screen: the game's name over a live patrol of the docks, how to play (goal, WIN and
// LOSE), the guards' moods, the controls, and the level list with the best rank earned on each.
import { VIEW } from '../config.js';
import { LEVELS } from '../levels/level-data.js';
import { drawLevelView } from '../render/scene.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
export const RANK_COLORS = { GHOST: '#bff6ff', SHADOW: '#c9a6ff', SEEN: '#ffc04d', CAUGHT: '#ff6a5a' };

function text(ctx, value, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function card(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(10,14,30,0.92)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, title, x + 18, y + 24, 17, '#ffd86b');
}

export function drawTitle(ctx, backdrop, time, menu) {
  ctx.fillStyle = '#070a16';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawLevelView(ctx, backdrop, time);
  ctx.fillStyle = 'rgba(4,6,16,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.save();
  ctx.shadowColor = 'rgba(255,200,90,0.8)';
  ctx.shadowBlur = 24;
  text(ctx, 'HUSHWATER', VIEW.width / 2, 62, 68, '#ffd86b', 'center');
  ctx.restore();
  text(ctx, 'a night-thief stealth game on the canal docks', VIEW.width / 2, 110, 19, '#cfe0ff', 'center', 'normal');

  card(ctx, 40, 140, 470, 430, 'HOW TO PLAY');
  const lines = [
    ['GOAL', '#ffd86b', 'Take the LEDGER, then slip out the EXIT gate.'],
    ['CONES', '#fff1c4', 'Each lantern cone is what a guard sees. Crates,'],
    ['', '', 'walls and barrels cut it; dark floor hides you.'],
    ['MOODS', '#ffb230', 'Seen? Its meter fills: "?" suspicious, it comes'],
    ['', '', 'to look. Break sight and it gives up (NEAR MISS).'],
    ['ALERT', '#ff4040', 'Full meter = "!" chase. Hide and it searches,'],
    ['', '', 'then walks back to its patrol.'],
    ['SOUND', '#bfe4ff', 'Footprints and rings show where guards walk;'],
    ['', '', 'your own steps make rings guards can hear.'],
    ['WIN', '#7dffad', 'Escape with the ledger. Never spotted = GHOST.'],
    ['LOSE', '#ff6a5a', 'An alerted guard catches you: CAUGHT.'],
  ];
  lines.forEach(([tag, color, line], i) => {
    const y = 186 + i * 33;
    if (tag) text(ctx, tag, 60, y, 14, color);
    text(ctx, line, 132, y, 14, '#e2e8f5', 'left', 'normal');
  });

  card(ctx, 530, 140, 330, 430, 'CONTROLS');
  const keys = [
    ['WASD', 'move (arrows work too)'],
    ['SHIFT', 'sneak: silent, slow'],
    ['SPACE', 'run: fast, LOUD'],
    ['CLICK', 'throw a pebble: lure guards'],
    ['E', 'hide in / leave a barrel'],
    ['H', 'field guide labels'],
    ['P', 'pause'],
    ['R', 'restart the level'],
  ];
  keys.forEach(([key, what], i) => {
    const y = 192 + i * 46;
    ctx.fillStyle = '#1d2540';
    ctx.beginPath();
    ctx.roundRect(550, y - 15, 74, 30, 6);
    ctx.fill();
    ctx.strokeStyle = '#5ff2ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, key, 587, y, 14, '#5ff2ff', 'center');
    text(ctx, what, 638, y, 14, '#e2e8f5', 'left', 'normal');
  });

  card(ctx, 880, 140, 360, 430, 'LEVELS');
  LEVELS.forEach((level, i) => {
    const y = 190 + i * 88;
    const chosen = i === menu.selected;
    ctx.fillStyle = chosen ? 'rgba(255,216,107,0.16)' : 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(896, y - 26, 328, 76, 10);
    ctx.fill();
    if (chosen) {
      ctx.strokeStyle = '#ffd86b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    text(ctx, `${i + 1}  ${level.name}`, 912, y - 6, 16, chosen ? '#ffd86b' : '#e2e8f5');
    const walkers = level.guards.filter((g) => g.kind !== 'camera').length;
    const extras = level.guards.filter((g) => g.kind !== 'guard').map((g) => (g.kind === 'camera' ? 'beacon' : 'hound'));
    text(ctx, `${walkers} on patrol${extras.length ? ` · ${extras.join(' · ')}` : ''}`, 912, y + 18, 12, '#9fb3d9', 'left', 'normal');
    const rank = menu.ranks[i];
    text(ctx, rank ?? '—', 1210, y + 6, 15, rank ? RANK_COLORS[rank] : '#5a6380', 'right');
  });

  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, `ENTER or CLICK to start level ${menu.selected + 1} · 1-4 / ↑↓ to choose`, VIEW.width / 2, 612, 22, '#ffffff', 'center');
  ctx.globalAlpha = 1;
  text(ctx, 'Original game: every sprite drawn in code, every sound synthesized live.', VIEW.width / 2, 660, 13, '#8a93ad', 'center', 'normal');
}
