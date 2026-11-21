// Drawing everything that moves or matters on the map: guards' footprints and footstep rings,
// noise rings, the ledger, the exit gate, pebbles, the thief, guards, the hound and wall beacons,
// with each guard's name tag and "?" / "!" mood badge.
import { TILE } from '../config.js';
import { ALERT, ALARM, INVESTIGATE, SEARCH, SUSPICIOUS, TRACKING } from '../ai/guard-states.js';
import { moodColor } from './lighting.js';

export function drawFootprints(ctx, world) {
  for (const p of world.prints) {
    const alpha = Math.max(0, 0.75 * (1 - p.age / 4.5));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = `rgba(214,236,255,${alpha})`;
    if (p.hound) {
      for (const [ox, oy] of [[2, 0], [-1, -2], [-1, 2], [-3, 0]]) {
        ctx.beginPath();
        ctx.arc(ox, oy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const ring of world.rings) {
    const t = ring.age / ring.life;
    ctx.strokeStyle = hexAlpha(ring.color, 0.7 * (1 - t));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 8 + ring.radius * t, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function hexAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha.toFixed(3)})`;
}

export function drawNoises(ctx, world) {
  for (const noise of world.noises) {
    const t = noise.age / noise.life;
    const r = noise.radius * Math.min(1, t * 1.6);
    const loud = noise.kind === 'pebble' || noise.kind === 'run';
    ctx.strokeStyle = loud ? `rgba(255,214,90,${0.85 * (1 - t)})` : `rgba(180,220,255,${0.5 * (1 - t)})`;
    ctx.lineWidth = loud ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(noise.x, noise.y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (loud) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(noise.x, noise.y, r * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (noise.kind === 'pebble' && t < 0.85) {
      label(ctx, noise.x, noise.y + 22, noise.heardBy > 0 ? `CLINK! heard by ${noise.heardBy}` : 'CLINK!', '#ffd65a');
    }
  }
}

export function label(ctx, x, y, text, color, size = 11) {
  ctx.font = `bold ${size}px "Trebuchet MS", Verdana, sans-serif`;
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(8,10,20,0.82)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - size / 2 - 4, w, size + 8, 6);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
}

export function drawObjectives(ctx, world, time) {
  const { ledger, exit } = world.map;
  const open = world.player.hasLedger;
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  const gx = exit.tx * TILE;
  const gy = exit.ty * TILE;
  const glow = ctx.createRadialGradient(exit.x, exit.y, 4, exit.x, exit.y, 70);
  glow.addColorStop(0, open ? `rgba(110,255,170,${0.55 + 0.25 * pulse})` : 'rgba(110,255,170,0.28)');
  glow.addColorStop(1, 'rgba(110,255,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(exit.x - 70, exit.y - 70, 140, 140);
  ctx.fillStyle = open ? '#1f6b45' : '#22372e';
  ctx.fillRect(gx - 2, gy - 14, TILE + 2, TILE + 28);
  ctx.strokeStyle = open ? '#7dffad' : '#4fae7c';
  ctx.lineWidth = 3;
  ctx.strokeRect(gx - 2, gy - 14, TILE + 2, TILE + 28);
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i += 1) {
    const bx = gx - 2 + (i * (TILE + 2)) / 4;
    ctx.beginPath();
    ctx.moveTo(bx, gy - 14);
    ctx.lineTo(bx, open ? gy - 6 : gy + TILE + 14);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(125,255,173,${open ? 0.9 - pulse * 0.6 : 0.35})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, 22 + pulse * (open ? 24 : 8), 0, Math.PI * 2);
  ctx.stroke();
  label(ctx, exit.x - 72, exit.y - 34, open ? 'EXIT OPEN ▶' : 'EXIT ▶ needs ledger', '#7dffad', 12);
  if (!open && ledger) {
    const bob = Math.sin(time * 3) * 2;
    ctx.fillStyle = 'rgba(255,216,107,0.35)';
    ctx.beginPath();
    ctx.arc(ledger.x, ledger.y, 16 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2e1d';
    ctx.fillRect(ledger.x - 8, ledger.y - 10 + bob, 16, 20);
    ctx.fillStyle = '#ffd86b';
    ctx.fillRect(ledger.x - 6, ledger.y - 8 + bob, 2, 16);
    ctx.fillRect(ledger.x - 2, ledger.y - 3 + bob, 8, 2);
    label(ctx, ledger.x, ledger.y - 24, 'LEDGER', '#ffd86b');
  }
}

export function drawPebbles(ctx, world) {
  for (const p of world.pebbles) {
    const t = Math.min(1, p.t / p.flight);
    const x = p.fromX + (p.toX - p.fromX) * t;
    const y = p.fromY + (p.toY - p.fromY) * t - Math.sin(t * Math.PI) * 26;
    ctx.fillStyle = '#d9dde6';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlayer(ctx, world, time) {
  const p = world.player;
  if (p.hiddenIn) {
    ctx.strokeStyle = 'rgba(95,242,255,0.9)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, p.x, p.y - 26, 'HIDDEN IN BARREL', '#5ff2ff');
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1.3, 1.3);
  ctx.globalAlpha = p.lit ? 1 : 0.88;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (p.stance === 'sneak') {
    ctx.strokeStyle = 'rgba(95,242,255,0.55)';
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.rotate(p.facing);
  const stride = p.moving ? Math.sin(time * (p.stance === 'run' ? 18 : 10)) * 3 : 0;
  ctx.fillStyle = '#1b1630';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 10, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5ff2ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#4a2f7a';
  ctx.beginPath();
  ctx.arc(3, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e9c7a0';
  ctx.beginPath();
  ctx.arc(6, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c2244';
  ctx.fillRect(-6 + stride, -9, 5, 3);
  ctx.fillRect(-6 - stride, 6, 5, 3);
  if (p.hasLedger) {
    ctx.fillStyle = '#ffd86b';
    ctx.fillRect(-11, -4, 5, 8);
  }
  ctx.restore();
  label(ctx, p.x, p.y - 26, p.lit ? 'YOU · in light' : 'YOU · in shadow', p.lit ? '#ffd86b' : '#5ff2ff', 10);
}

function moodBadge(guard) {
  switch (guard.state) {
    case ALERT:
    case ALARM:
      return { mark: '!', color: '#ff4040' };
    case SUSPICIOUS:
    case INVESTIGATE:
    case TRACKING:
      return { mark: '?', color: '#ffb230' };
    case SEARCH:
      return { mark: '?!', color: '#ff7a30' };
    default:
      return null;
  }
}

function drawGuardBody(ctx, guard, time) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.scale(1.3, 1.3);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(guard.facing);
  if (guard.kind === 'camera') {
    ctx.fillStyle = '#3b4157';
    ctx.fillRect(-9, -8, 18, 16);
    ctx.fillStyle = '#596384';
    ctx.fillRect(0, -6, 14, 12);
    ctx.fillStyle = guard.state === ALARM ? (Math.sin(time * 14) > 0 ? '#ff3b3b' : '#5a1010') : '#8fe8ff';
    ctx.beginPath();
    ctx.arc(14, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-9, -8, 18, 16);
  } else if (guard.kind === 'hound') {
    const wag = Math.sin(time * 9) * 0.5;
    ctx.strokeStyle = '#6b4424';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-18, wag * 8);
    ctx.stroke();
    ctx.fillStyle = '#a0683a';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#c4894f';
    ctx.beginPath();
    ctx.arc(10, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(7, -7, 4, 4);
    ctx.fillRect(7, 3, 4, 4);
  } else {
    const step = guard.path.length > 0 ? Math.sin(time * 10) * 3 : 0;
    ctx.fillStyle = '#20232e';
    ctx.fillRect(-5 + step, -9, 6, 4);
    ctx.fillRect(-5 - step, 5, 6, 4);
    ctx.fillStyle = guard.coat;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2b2a3a';
    ctx.beginPath();
    ctx.arc(1, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe48a';
    ctx.beginPath();
    ctx.arc(9, 8, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,228,138,0.35)';
    ctx.beginPath();
    ctx.arc(9, 8, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGuards(ctx, world, time) {
  for (const guard of world.guards) {
    if (guard.state === SEARCH || (guard.state === ALERT && !guard.seesPlayer)) {
      if (guard.lastSeen) {
        ctx.strokeStyle = 'rgba(255,90,70,0.8)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(guard.lastSeen.x, guard.lastSeen.y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, guard.lastSeen.x, guard.lastSeen.y + 22, 'LAST SEEN', '#ff8a70', 10);
      }
    }
    drawGuardBody(ctx, guard, time);
  }
  for (const guard of world.guards) {
    const badge = moodBadge(guard);
    const [r, g, b] = moodColor(guard);
    const tagY = guard.y - 24;
    label(ctx, guard.x, tagY, guard.name, `rgb(${r},${g},${b})`, 10);
    if (guard.suspicion > 0.01 && guard.state !== ALERT && guard.state !== ALARM) {
      ctx.fillStyle = 'rgba(8,10,20,0.85)';
      ctx.fillRect(guard.x - 16, tagY + 9, 32, 5);
      ctx.fillStyle = '#ffb230';
      ctx.fillRect(guard.x - 15, tagY + 10, 30 * guard.suspicion, 3);
    }
    if (badge) {
      const bob = Math.sin(time * 8) * 2;
      ctx.fillStyle = badge.color;
      ctx.beginPath();
      ctx.arc(guard.x + 20, tagY - 6 + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge.mark, guard.x + 20, tagY - 5 + bob);
    }
    if (guard.heardAt && guard.state !== ALERT) {
      ctx.strokeStyle = `rgba(255,214,90,${1 - guard.heardAt.age / 1.6})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.lineTo(guard.heardAt.x, guard.heardAt.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
