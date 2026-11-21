// Composes one frame of a level in play, back to front: scenery, night lighting and cones,
// footprints and noise, objectives, thief and guards, field-guide callouts, then the HUD.
import { MAP_ORIGIN, VIEW } from '../config.js';
import { paintLevel, drawLivingScenery } from './draw-level.js';
import { drawLighting } from './lighting.js';
import { drawFootprints, drawNoises, drawObjectives, drawPebbles, drawPlayer, drawGuards } from './draw-actors.js';
import { drawTopBar, drawRoster, drawRibbon, drawPopups, drawFieldGuide } from './hud.js';

const painted = new WeakMap();

export function drawLevelView(ctx, world, time, { guide = false } = {}) {
  const map = world.map;
  if (!painted.has(map)) painted.set(map, paintLevel(map));
  const width = map.cols * 30;
  const height = map.rows * 30;
  ctx.save();
  ctx.translate(MAP_ORIGIN.x, MAP_ORIGIN.y);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.drawImage(painted.get(map), 0, 0);
  drawLivingScenery(ctx, map, time);
  drawLighting(ctx, world, width, height, time);
  drawFootprints(ctx, world);
  drawNoises(ctx, world);
  drawObjectives(ctx, world, time);
  drawPebbles(ctx, world);
  drawPlayer(ctx, world, time);
  drawGuards(ctx, world, time);
  if (guide) drawFieldGuide(ctx, world);
  ctx.restore();
  ctx.strokeStyle = '#3a4466';
  ctx.lineWidth = 2;
  ctx.strokeRect(MAP_ORIGIN.x - 1, MAP_ORIGIN.y - 1, width + 2, height + 2);
}

export function drawPlayFrame(ctx, world, time, options = {}) {
  ctx.fillStyle = '#070a16';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawLevelView(ctx, world, time, options);
  drawPopups(ctx, world);
  drawTopBar(ctx, world);
  drawRoster(ctx, world);
  drawRibbon(ctx, world, options.tip);
}
