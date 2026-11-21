// Night lighting that shows what is safe: the docks sit in blue darkness; lamp pools and guards'
// lantern cones are cut out of it. Dark floor is safe ground, lit floor is where you are seen
// from far away. Cones are then tinted by the guard's mood: pale (patrol), amber (suspicious),
// red (alert).
import { ALERT, ALARM, INVESTIGATE, SEARCH, SUSPICIOUS, TRACKING } from '../ai/guard-states.js';

let shade = null;

function surface(width, height) {
  if (!shade || shade.width !== width || shade.height !== height) {
    shade = document.createElement('canvas');
    shade.width = width;
    shade.height = height;
  }
  return shade;
}

export function moodColor(guard) {
  switch (guard.state) {
    case ALERT:
    case ALARM:
      return [255, 64, 56];
    case SUSPICIOUS:
    case INVESTIGATE:
    case TRACKING:
    case SEARCH:
      return [255, 178, 48];
    default:
      return guard.kind === 'camera' ? [120, 255, 214] : [140, 215, 255];
  }
}

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
}

function lampPolygon(ctx, lamp) {
  const n = lamp.reach.length;
  ctx.beginPath();
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = lamp.reach[i];
    const x = lamp.x + Math.cos(a) * r;
    const y = lamp.y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function radial(ctx, x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  return g;
}

/** Darken the level, keeping lamp pools, lantern cones and glows clear; then tint the cones. */
export function drawLighting(ctx, world, width, height, time) {
  const s = surface(width, height);
  const d = s.getContext('2d');
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, width, height);
  d.fillStyle = 'rgba(4,7,22,0.8)';
  d.fillRect(0, 0, width, height);
  d.globalCompositeOperation = 'destination-out';
  for (const lamp of world.map.lamps) {
    const flicker = 1 + Math.sin(time * 7 + lamp.flicker) * 0.03;
    d.fillStyle = radial(d, lamp.x, lamp.y, lamp.radius * flicker, 'rgba(0,0,0,1)', 'rgba(0,0,0,0)');
    lampPolygon(d, lamp);
    d.fill();
  }
  for (const guard of world.guards) {
    if (guard.cone.length < 6) continue;
    d.fillStyle = radial(d, guard.x, guard.y, guard.sightRange, 'rgba(0,0,0,0.95)', 'rgba(0,0,0,0.45)');
    polygon(d, guard.cone);
    d.fill();
  }
  const glows = [[world.player.x, world.player.y, 34, 0.45]];
  if (world.player.hasLedger) glows.push([world.map.exit.x, world.map.exit.y, 80, 0.9]);
  else if (world.map.ledger) glows.push([world.map.ledger.x, world.map.ledger.y, 40, 0.8]);
  for (const [x, y, r, a] of glows) {
    d.fillStyle = radial(d, x, y, r, `rgba(0,0,0,${a})`, 'rgba(0,0,0,0)');
    d.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.drawImage(s, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of world.map.lamps) {
    ctx.fillStyle = radial(ctx, lamp.x, lamp.y, lamp.radius, 'rgba(255,170,70,0.28)', 'rgba(255,140,40,0)');
    lampPolygon(ctx, lamp);
    ctx.fill();
  }
  for (const guard of world.guards) {
    if (guard.cone.length < 6) continue;
    const [r, g, b] = moodColor(guard);
    const angry = guard.state === ALERT || guard.state === ALARM;
    const wary = !angry && [SUSPICIOUS, INVESTIGATE, SEARCH, TRACKING].includes(guard.state);
    const strength = angry ? 0.6 : wary ? 0.5 : 0.36;
    ctx.fillStyle = radial(ctx, guard.x, guard.y, guard.sightRange, `rgba(${r},${g},${b},${strength})`, `rgba(${r},${g},${b},0.04)`);
    polygon(ctx, guard.cone);
    ctx.fill();
  }
  ctx.restore();

  for (const guard of world.guards) {
    if (guard.cone.length < 6) continue;
    const [r, g, b] = moodColor(guard);
    const calm = moodColor(guard)[2] > 150;
    ctx.strokeStyle = `rgba(${r},${g},${b},${calm ? 0.75 : 0.95})`;
    ctx.lineWidth = calm ? 1.5 : 2.5;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -time * 20;
    polygon(ctx, guard.cone);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
