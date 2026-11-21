// The heads-up display: the top bar (level, objective checklist, detection meter, stance,
// pebbles, time), the PATROL ROSTER panel (every guard's name and mood), the WIN/LOSE rules,
// the tip and controls ribbon, big event popups, and the field-guide callouts (H) that name each
// part of the level: vision cone, cover, reeds, barrel, lit floor, footsteps, exit.
import { VIEW, MAP_ORIGIN, PANEL, TILE } from '../config.js';
import { LEVELS } from '../levels/level-data.js';
import { tileAt, TILE_CRATE, TILE_REEDS, TILE_BARREL } from '../levels/tilemap.js';
import { detectionLevel, detectionWord } from '../systems/detection-meter.js';
import { moodColor } from './lighting.js';
import { label } from './draw-actors.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function text(ctx, value, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function panelBox(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(12,16,32,0.94)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#3a4466';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function stateWord(guard) {
  return guard.state;
}

export function drawTopBar(ctx, world) {
  ctx.fillStyle = '#0b0f1f';
  ctx.fillRect(0, 0, VIEW.width, 58);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(0, 56, VIEW.width, 2);
  text(ctx, 'HUSHWATER', 16, 20, 22, '#ffd86b');
  text(ctx, `LEVEL ${world.levelIndex + 1}/${LEVELS.length} · ${world.def.name}`, 16, 43, 13, '#9fb3d9');

  const got = world.player.hasLedger;
  text(ctx, 'OBJECTIVE', 262, 14, 11, '#8a93ad');
  text(ctx, `${got ? '☑' : '☐'} 1 TAKE THE LEDGER`, 262, 32, 15, got ? '#7dffad' : '#ffd86b');
  text(ctx, `☐ 2 REACH THE EXIT UNSEEN`, 262, 50, 13, got ? '#ffd86b' : '#c7cfe2');

  const { level } = detectionLevel(world);
  const word = detectionWord(world);
  const hot = word === 'SPOTTED' || word === 'HUNTED';
  const mx = 520;
  text(ctx, 'DETECTION', mx, 14, 11, '#8a93ad');
  ctx.fillStyle = '#1b2238';
  ctx.beginPath();
  ctx.roundRect(mx, 24, 230, 22, 6);
  ctx.fill();
  const fill = hot ? 1 : level;
  const grad = ctx.createLinearGradient(mx, 0, mx + 230, 0);
  grad.addColorStop(0, '#62e3a0');
  grad.addColorStop(0.5, '#ffb230');
  grad.addColorStop(1, '#ff4040');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(mx + 2, 26, Math.max(0, 226 * fill), 18, 5);
  ctx.fill();
  text(ctx, word, mx + 115, 35, 13, '#ffffff', 'center');

  const p = world.player;
  const stance = p.hiddenIn ? 'HIDING' : p.stance.toUpperCase();
  const stanceNote = p.hiddenIn ? 'unseen' : p.stance === 'sneak' ? 'silent' : p.stance === 'run' ? 'LOUD' : 'soft steps';
  const sc = p.stance === 'run' && !p.hiddenIn ? '#ff8a5a' : '#5ff2ff';
  text(ctx, 'STANCE', 780, 14, 11, '#8a93ad');
  text(ctx, stance, 780, 34, 17, sc);
  text(ctx, stanceNote, 780, 50, 11, sc, 'left', 'normal');
  text(ctx, 'PEBBLES', 900, 14, 11, '#8a93ad');
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < p.pebbles ? '#d9dde6' : '#2b3148';
    ctx.beginPath();
    ctx.arc(906 + i * 18, 36, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'TIME', 1000, 14, 11, '#8a93ad');
  text(ctx, formatTime(world.stats.time), 1000, 36, 18, '#e8ecf6');
  text(ctx, 'SPOTTED', 1080, 14, 11, '#8a93ad');
  text(ctx, String(world.stats.spotted), 1080, 36, 18, world.stats.spotted ? '#ff6a5a' : '#7dffad');
  text(ctx, 'NEAR MISSES', 1160, 14, 11, '#8a93ad');
  text(ctx, String(world.stats.nearMisses), 1160, 36, 18, '#ffc04d');
}

export function drawRoster(ctx, world) {
  const x = PANEL.x;
  let y = PANEL.y;
  const walkers = world.guards;
  const rowH = 46;
  const rosterH = 34 + walkers.length * rowH;
  panelBox(ctx, x, y, PANEL.w, rosterH);
  text(ctx, 'PATROL ROSTER', x + 12, y + 17, 14, '#ffd86b');
  text(ctx, `${walkers.length} on watch`, x + PANEL.w - 12, y + 17, 11, '#8a93ad', 'right', 'normal');
  y += 34;
  for (const guard of walkers) {
    const [r, g, b] = moodColor(guard);
    const mood = `rgb(${r},${g},${b})`;
    ctx.fillStyle = guard.coat;
    ctx.beginPath();
    if (guard.kind === 'camera') ctx.rect(x + 12, y + 8, 14, 14);
    else if (guard.kind === 'hound') ctx.ellipse(x + 19, y + 15, 9, 6, 0, 0, Math.PI * 2);
    else ctx.arc(x + 19, y + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, guard.name, x + 34, y + 10, 13, '#e8ecf6');
    text(ctx, guard.kind === 'camera' ? 'wall beacon' : guard.kind === 'hound' ? 'hound: keen ears' : 'lantern guard', x + 34, y + 25, 10, '#8a93ad', 'left', 'normal');
    const word = stateWord(guard);
    ctx.font = `bold 10px ${FONT}`;
    const w = ctx.measureText(word).width + 12;
    ctx.fillStyle = mood;
    ctx.beginPath();
    ctx.roundRect(x + PANEL.w - 12 - w, y + 3, w, 16, 8);
    ctx.fill();
    text(ctx, word, x + PANEL.w - 12 - w / 2, y + 11.5, 10, '#10131f', 'center');
    ctx.fillStyle = '#1b2238';
    ctx.fillRect(x + PANEL.w - 84, y + 25, 72, 5);
    ctx.fillStyle = mood;
    ctx.fillRect(x + PANEL.w - 84, y + 25, 72 * guard.suspicion, 5);
    ctx.strokeStyle = '#242c45';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + rowH - 6);
    ctx.lineTo(x + PANEL.w - 10, y + rowH - 6);
    ctx.stroke();
    y += rowH;
  }
  y += 10;
  const legendH = 92;
  panelBox(ctx, x, y, PANEL.w, legendH);
  text(ctx, 'VISION CONES', x + 12, y + 16, 12, '#ffd86b');
  const rows = [['#fff1c4', 'pale: patrolling'], ['#ffb230', 'amber "?": suspicious'], ['#ff4040', 'red "!": alert, chasing']];
  rows.forEach(([c, t], i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 36 + i * 19);
    ctx.lineTo(x + 34, y + 29 + i * 19);
    ctx.lineTo(x + 34, y + 43 + i * 19);
    ctx.closePath();
    ctx.fill();
    text(ctx, t, x + 42, y + 36 + i * 19, 11, '#d5dbea', 'left', 'normal');
  });
  y += legendH + 10;
  const rulesH = Math.max(60, PANEL.y + PANEL.h - y);
  panelBox(ctx, x, y, PANEL.w, rulesH);
  text(ctx, 'WIN', x + 12, y + 17, 12, '#7dffad');
  text(ctx, 'take the ledger, reach EXIT', x + 46, y + 17, 11, '#d5dbea', 'left', 'normal');
  text(ctx, 'LOSE', x + 12, y + 37, 12, '#ff6a5a');
  text(ctx, 'an alert guard catches you', x + 46, y + 37, 11, '#d5dbea', 'left', 'normal');
  if (rulesH > 80) {
    text(ctx, 'RANK', x + 12, y + 57, 12, '#ffd86b');
    text(ctx, 'never spotted = GHOST', x + 46, y + 57, 11, '#d5dbea', 'left', 'normal');
  }
}

/** The tip for this moment of play: what to do about the guard that matters most right now. */
export function contextTip(world) {
  const p = world.player;
  const hunter = world.guards.find((g) => g.state === 'ALERT' || g.state === 'SEARCH');
  const watcher = world.guards.find((g) => g.seesPlayer && g.state !== 'ALERT');
  if (p.hiddenIn && hunter) return `Stay put: ${hunter.name} will search, give up, and walk back to the patrol route.`;
  if (hunter && hunter.seesPlayer) return `${hunter.name} sees you! Break line of sight: round a wall, into reeds, or a barrel (E).`;
  if (watcher) return `${watcher.name} is noticing you: back into the dark before the meter fills!`;
  if (p.hasLedger) return 'Ledger taken: the EXIT gate is open. Stay in the shadows on the way out.';
  return world.def.tip;
}

export function drawRibbon(ctx, world, tip) {
  const y = MAP_ORIGIN.y + 600 + 6;
  ctx.fillStyle = '#0b0f1f';
  ctx.fillRect(0, y - 2, VIEW.width, VIEW.height - y + 2);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(0, y - 2, VIEW.width, 2);
  ctx.fillStyle = '#ffd86b';
  ctx.beginPath();
  ctx.roundRect(12, y + 8, 40, 20, 6);
  ctx.fill();
  text(ctx, 'TIP', 32, y + 18.5, 12, '#10131f', 'center');
  text(ctx, tip ?? contextTip(world), 62, y + 18.5, 13, '#e8ecf6', 'left', 'normal');
  text(ctx, 'WASD move · SHIFT sneak · SPACE run · CLICK throw pebble · E hide in barrel · H field guide · P pause', 12, y + 42, 12, '#9fb3d9', 'left', 'normal');
}

export function drawPopups(ctx, world) {
  world.popups.forEach((p, i) => {
    const t = p.age / p.life;
    const alpha = t < 0.85 ? 1 : (1 - t) / 0.15;
    const scale = t < 0.08 ? 0.7 + (t / 0.08) * 0.3 : 1;
    const cx = MAP_ORIGIN.x + 770;
    const cy = MAP_ORIGIN.y + 70 + i * 82;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.font = `bold 34px ${FONT}`;
    const w = Math.max(ctx.measureText(p.text).width, 280) + 50;
    ctx.fillStyle = 'rgba(8,10,20,0.88)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -30, w, 68, 14);
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    text(ctx, p.text, 0, -6, 34, p.color, 'center');
    text(ctx, p.sub, 0, 24, 13, '#e8ecf6', 'center', 'normal');
    ctx.restore();
  });
}

function nearestTile(map, code, px, py) {
  let best = null;
  let bestD = Infinity;
  for (let ty = 0; ty < map.rows; ty += 1) {
    for (let tx = 0; tx < map.cols; tx += 1) {
      if (tileAt(map, tx, ty) !== code) continue;
      const x = tx * TILE + TILE / 2;
      const y = ty * TILE + TILE / 2;
      const d = Math.hypot(x - px, y - py);
      if (d < bestD && d > 20) {
        bestD = d;
        best = { x, y };
      }
    }
  }
  return best;
}

function callout(ctx, tx, ty, lx, ly, words, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, lx, ly, words, color, 12);
}

/** Field-guide callouts, in map coordinates: name the parts of the level near the thief. */
export function drawFieldGuide(ctx, world) {
  const p = world.player;
  const map = world.map;
  const clampX = (x) => Math.max(70, Math.min(map.cols * TILE - 70, x));
  const clampY = (y) => Math.max(14, Math.min(map.rows * TILE - 14, y));
  const walker = world.guards.find((g) => g.kind !== 'camera');
  if (walker && walker.cone.length > 10) {
    const mid = Math.floor(walker.cone.length / 4) * 2;
    const tx = (walker.x + walker.cone[mid]) / 2;
    const ty = (walker.y + walker.cone[mid + 1]) / 2;
    callout(ctx, tx, ty, clampX(tx), clampY(ty + 40), 'VISION CONE · stay out of it', '#fff1c4');
    const print = world.prints[world.prints.length - 3];
    if (print) callout(ctx, print.x, print.y, clampX(print.x - 20), clampY(print.y - 38), 'FOOTSTEPS · where guards walk', '#bfe4ff');
  }
  const crate = nearestTile(map, TILE_CRATE, p.x, p.y);
  if (crate) callout(ctx, crate.x, crate.y, clampX(crate.x - 20), clampY(crate.y + 44), 'COVER · crates block sight', '#ffcf8a');
  const reeds = nearestTile(map, TILE_REEDS, p.x + 400, p.y);
  if (reeds) callout(ctx, reeds.x, reeds.y, clampX(reeds.x + 30), clampY(reeds.y + 32), 'REEDS · sneak = invisible', '#9be35a');
  const barrel = nearestTile(map, TILE_BARREL, p.x, p.y);
  if (barrel) callout(ctx, barrel.x, barrel.y, clampX(barrel.x), clampY(barrel.y + 34), 'BARREL · E to hide', '#ffb27a');
  const lamp = map.lamps[0];
  if (lamp) callout(ctx, lamp.x, lamp.y, clampX(lamp.x + 20), clampY(lamp.y - 40), 'LIT FLOOR · seen from far', '#ffd86b');
}
