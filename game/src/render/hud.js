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

const DETECTION_HINTS = {
  SPOTTED: ['#ff4d4d', 'They see you! Break line of sight.'],
  HUNTED: ['#ff6a3d', 'Out of sight. Stay hidden while they search.'],
  HIDDEN: ['#5ff2ff', 'In a barrel: no lantern can see you.'],
  SUSPECTED: ['#ffb230', 'A guard is staring. Leave the cone!'],
  NOTICED: ['#ffd24d', 'Something caught an eye. Into the dark.'],
  'IN LIGHT': ['#ffe9a8', 'Lit floor: guards see you from far.'],
  UNSEEN: ['#7dffad', 'In shadow. Keep to the dark.'],
};

function bar(ctx, x, y, w, share, color) {
  ctx.fillStyle = '#1b2238';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 7, 3);
  ctx.fill();
  if (share > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(6, w * Math.min(1, share)), 7, 3);
    ctx.fill();
  }
}

/** The big detection status: one word for how seen the thief is, what it means, and the meter. */
function drawDetectionBox(ctx, world, x, y, w) {
  const word = detectionWord(world);
  const [color, hint] = DETECTION_HINTS[word];
  const mark = word === 'SPOTTED' || word === 'HUNTED' ? ' !' : word === 'SUSPECTED' || word === 'NOTICED' ? ' ?' : '';
  panelBox(ctx, x, y, w, 104);
  text(ctx, 'DETECTION', x + 12, y + 15, 11, '#8a93ad');
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 26, w - 20, 38, 7);
  ctx.fill();
  text(ctx, word + mark, x + w / 2, y + 46, 22, '#10131f', 'center');
  text(ctx, hint, x + w / 2, y + 77, 11, '#e2e8f5', 'center', 'normal');
  const { level } = detectionLevel(world);
  bar(ctx, x + 12, y + 90, w - 24, word === 'SPOTTED' || word === 'HUNTED' ? 1 : level, color);
  return y + 104;
}

/** How visible and how loud the thief is right now. */
function drawSenses(ctx, world, x, y, w) {
  const p = world.player;
  panelBox(ctx, x, y, w, 56);
  const seen = p.hiddenIn ? ['HIDDEN', 0, '#5ff2ff'] : p.lit ? ['IN LIGHT', 1, '#ffd86b'] : ['IN SHADOW', 0.3, '#7dffad'];
  const loud = p.hiddenIn || p.stance === 'sneak' || !p.moving ? ['SILENT', 0, '#7dffad'] : p.stance === 'run' ? ['LOUD', 1, '#ff6a5a'] : ['SOFT', 0.35, '#ffd24d'];
  text(ctx, 'VISIBILITY', x + 12, y + 14, 10, '#8a93ad');
  text(ctx, seen[0], x + w - 12, y + 14, 11, seen[2], 'right');
  bar(ctx, x + 12, y + 22, w - 24, seen[1], seen[2]);
  text(ctx, 'NOISE', x + 12, y + 38, 10, '#8a93ad');
  text(ctx, loud[0], x + w - 12, y + 38, 11, loud[2], 'right');
  bar(ctx, x + 12, y + 46, w - 24, loud[1], loud[2]);
  return y + 56;
}

/** Every guard on the level with its mood word. */
function drawGuardList(ctx, world, x, y, w) {
  const rowH = 22;
  const h = 28 + world.guards.length * rowH;
  panelBox(ctx, x, y, w, h);
  text(ctx, 'GUARDS', x + 12, y + 15, 11, '#8a93ad');
  text(ctx, `${world.guards.length} on watch`, x + w - 12, y + 15, 10, '#8a93ad', 'right', 'normal');
  world.guards.forEach((guard, i) => {
    const ry = y + 36 + i * rowH;
    const [r, g, b] = moodColor(guard);
    ctx.fillStyle = guard.coat;
    ctx.beginPath();
    if (guard.kind === 'camera') ctx.rect(x + 13, ry - 6, 12, 12);
    else if (guard.kind === 'hound') ctx.ellipse(x + 19, ry, 8, 5, 0, 0, Math.PI * 2);
    else ctx.arc(x + 19, ry, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    text(ctx, guard.name, x + 32, ry, 12, '#e8ecf6');
    const word = stateWord(guard);
    ctx.font = `bold 10px ${FONT}`;
    const cw = ctx.measureText(word).width + 12;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.roundRect(x + w - 12 - cw, ry - 8, cw, 16, 8);
    ctx.fill();
    text(ctx, word, x + w - 12 - cw / 2, ry + 0.5, 10, '#10131f', 'center');
  });
  return y + h;
}

/** Small drawn icons for the legend, one per thing on the map. */
function legendIcon(ctx, kind, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  switch (kind) {
    case 'guard':
      ctx.fillStyle = 'rgba(140,215,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(9, -7);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3fd0e0';
      ctx.beginPath();
      ctx.arc(-4, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      break;
    case 'crate':
      ctx.fillStyle = '#c98a3e';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = '#7a4a1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, 6);
      ctx.moveTo(6, -6);
      ctx.lineTo(-6, 6);
      ctx.stroke();
      break;
    case 'reeds':
      ctx.fillStyle = '#2f4a26';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = '#7fb04f';
      ctx.lineWidth = 1.5;
      for (let i = -4; i <= 4; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 6);
        ctx.lineTo(i + 1, -6);
        ctx.stroke();
      }
      break;
    case 'barrel':
      ctx.fillStyle = '#8c4f2a';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a3f47';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'lamp': {
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
      glow.addColorStop(0, '#ffe9a8');
      glow.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'beacon':
      ctx.fillStyle = '#596384';
      ctx.fillRect(-7, -5, 12, 10);
      ctx.fillStyle = '#8fe8ff';
      ctx.beginPath();
      ctx.arc(5, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'prints':
      ctx.fillStyle = '#d6ecff';
      for (const [px, py] of [[-5, -3], [0, 3], [5, -3]]) {
        ctx.beginPath();
        ctx.ellipse(px, py, 2.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'noise':
      ctx.strokeStyle = '#ffd65a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    default:
      ctx.fillStyle = '#1f6b45';
      ctx.fillRect(-6, -7, 12, 14);
      ctx.strokeStyle = '#7dffad';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -7, 12, 14);
  }
  ctx.restore();
}

const LEGEND = [
  ['guard', 'Guard + lantern cone'],
  ['crate', 'Crate / wall: blocks sight'],
  ['reeds', 'Reeds: sneak = unseen'],
  ['barrel', 'Barrel: E to hide inside'],
  ['lamp', 'Lamp light: you are seen'],
  ['beacon', 'Beacon: sweeping eye'],
  ['prints', 'Footprints: guard path'],
  ['noise', 'Ring: noise guards hear'],
  ['exit', 'Exit: opens with ledger'],
];

function drawLegend(ctx, x, y, w) {
  const rowH = 17;
  const h = 26 + LEGEND.length * rowH;
  panelBox(ctx, x, y, w, h);
  text(ctx, 'LEGEND', x + 12, y + 14, 11, '#8a93ad');
  LEGEND.forEach(([kind, words], i) => {
    const ry = y + 32 + i * rowH;
    legendIcon(ctx, kind, x + 20, ry);
    text(ctx, words, x + 36, ry + 0.5, 11, '#d5dbea', 'left', 'normal');
  });
  return y + h;
}

/** The side panel: detection status, visibility and noise, the guards, the legend and the rules. */
export function drawRoster(ctx, world) {
  const x = PANEL.x;
  const w = PANEL.w;
  let y = drawDetectionBox(ctx, world, x, PANEL.y, w) + 6;
  y = drawSenses(ctx, world, x, y, w) + 6;
  y = drawGuardList(ctx, world, x, y, w) + 6;
  y = drawLegend(ctx, x, y, w) + 6;
  const rulesH = PANEL.y + PANEL.h - y;
  if (rulesH < 30) return;
  panelBox(ctx, x, y, w, rulesH);
  const rows = [
    ['WIN', '#7dffad', 'ledger + exit, unseen'],
    ['LOSE', '#ff6a5a', 'an alert guard catches you'],
    ['MOVE', '#5ff2ff', 'WASD · SHIFT sneak · SPACE run'],
    ['ACT', '#5ff2ff', 'CLICK pebble · E hide · P pause'],
  ];
  const step = Math.min(22, (rulesH - 8) / rows.length);
  rows.forEach(([tag, color, words], i) => {
    const ry = y + 4 + step * (i + 0.5);
    if (ry > y + rulesH - 6) return;
    text(ctx, tag, x + 12, ry, 11, color);
    text(ctx, words, x + 50, ry, 11, '#d5dbea', 'left', 'normal');
  });
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
