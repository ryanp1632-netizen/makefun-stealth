// Painting the docks: the still parts of a level (planks, cobbles, canal, brick walls, crates,
// barrels, reeds, lamp posts, the exit gate) drawn once per level into an offscreen canvas, plus
// the moving water shimmer and swaying reeds drawn each frame.
import { TILE } from '../config.js';
import {
  tileAt, TILE_WALL, TILE_WATER, TILE_CRATE, TILE_BARREL, TILE_REEDS, TILE_LAMP, TILE_BRIDGE, TILE_EXIT, TILE_COBBLE, TILE_POST,
} from '../levels/tilemap.js';

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) / 4294967296;
}

function drawPlanks(ctx, x, y, tx, ty, bridge) {
  const base = bridge ? ['#a2784a', '#93693f', '#ab8150'] : ['#5f5a5e', '#565156', '#676166'];
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = base[(i + tx + ty) % 3];
    if (bridge) ctx.fillRect(x + i * 10, y, 10, TILE);
    else ctx.fillRect(x, y + i * 10, TILE, 10);
  }
  ctx.strokeStyle = 'rgba(30,20,12,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 3; i += 1) {
    if (bridge) {
      ctx.moveTo(x + i * 10 + 0.5, y);
      ctx.lineTo(x + i * 10 + 0.5, y + TILE);
    } else {
      ctx.moveTo(x, y + i * 10 + 0.5);
      ctx.lineTo(x + TILE, y + i * 10 + 0.5);
    }
  }
  const seam = Math.floor(hash(tx, ty) * 24) + 3;
  if (!bridge) {
    ctx.moveTo(x + seam + 0.5, y + (seam % 3) * 10);
    ctx.lineTo(x + seam + 0.5, y + (seam % 3) * 10 + 10);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,20,12,0.6)';
  ctx.fillRect(x + 4 + seam % 7, y + 4, 2, 2);
}

function drawCobbles(ctx, x, y, tx, ty) {
  ctx.fillStyle = '#5d5a5c';
  ctx.fillRect(x, y, TILE, TILE);
  for (let j = 0; j < 3; j += 1) {
    for (let i = 0; i < 3; i += 1) {
      const shade = 0.75 + hash(tx * 3 + i, ty * 3 + j) * 0.35;
      ctx.fillStyle = `rgb(${Math.round(120 * shade)},${Math.round(116 * shade)},${Math.round(114 * shade)})`;
      const off = j % 2 ? 5 : 0;
      ctx.beginPath();
      ctx.roundRect(x + ((i * 10 + off) % TILE) + 1, y + j * 10 + 1, 8, 8, 3);
      ctx.fill();
    }
  }
}

function drawWall(ctx, map, x, y, tx, ty) {
  ctx.fillStyle = '#1f2433';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#39405a';
  for (let row = 0; row < 3; row += 1) {
    const off = (row + ty) % 2 ? 7 : 0;
    for (let col = -1; col < 3; col += 1) {
      ctx.fillRect(x + col * 14 + off + 1, y + row * 10 + 1, 12, 8);
    }
  }
  if (tileAt(map, tx, ty + 1) !== TILE_WALL) {
    ctx.fillStyle = '#141826';
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  }
  if (tileAt(map, tx, ty - 1) !== TILE_WALL) {
    ctx.fillStyle = '#6a7598';
    ctx.fillRect(x, y, TILE, 3);
  }
}

function drawCrate(ctx, x, y) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 4, y + 5, TILE - 2, TILE - 2);
  ctx.fillStyle = '#c98a3e';
  ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
  ctx.strokeStyle = '#7a4a1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2.5, y + 2.5, TILE - 5, TILE - 5);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + TILE - 4, y + TILE - 4);
  ctx.moveTo(x + TILE - 4, y + 4);
  ctx.lineTo(x + 4, y + TILE - 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,180,0.35)';
  ctx.fillRect(x + 1, y + 1, TILE - 2, 2);
}

function drawBarrel(ctx, x, y) {
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(cx + 3, cy + 4, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8c4f2a';
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a3f47';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 11.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#b06a3a';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater(ctx, x, y) {
  ctx.fillStyle = '#185a70';
  ctx.fillRect(x, y, TILE, TILE);
}

function drawLampPost(ctx, x, y) {
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;
  ctx.fillStyle = '#2a2d36';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPost(ctx, x, y) {
  ctx.fillStyle = '#2a2d36';
  ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
}

/** Render the still layer of a level into its own canvas, once. */
export function paintLevel(map) {
  const canvas = document.createElement('canvas');
  canvas.width = map.cols * TILE;
  canvas.height = map.rows * TILE;
  const ctx = canvas.getContext('2d');
  for (let ty = 0; ty < map.rows; ty += 1) {
    for (let tx = 0; tx < map.cols; tx += 1) {
      const code = tileAt(map, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (code === TILE_WALL) drawWall(ctx, map, x, y, tx, ty);
      else if (code === TILE_WATER) drawWater(ctx, x, y);
      else if (code === TILE_BRIDGE) {
        drawWater(ctx, x, y);
        drawPlanks(ctx, x, y, tx, ty, true);
      } else if (code === TILE_COBBLE) drawCobbles(ctx, x, y, tx, ty);
      else drawPlanks(ctx, x, y, tx, ty, false);
      if (code === TILE_CRATE) drawCrate(ctx, x, y);
      if (code === TILE_BARREL) drawBarrel(ctx, x, y);
      if (code === TILE_LAMP) drawLampPost(ctx, x, y);
      if (code === TILE_POST) drawPost(ctx, x, y);
      if (code === TILE_REEDS) {
        ctx.fillStyle = '#2f4a26';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
  return canvas;
}

/** The moving parts of the scenery: water glints and reeds. */
export function drawLivingScenery(ctx, map, time) {
  for (let ty = 0; ty < map.rows; ty += 1) {
    for (let tx = 0; tx < map.cols; tx += 1) {
      const code = tileAt(map, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (code === TILE_WATER) {
        const phase = time * 1.3 + tx * 0.7 + ty * 1.1;
        ctx.strokeStyle = `rgba(120,200,220,${0.18 + 0.12 * Math.sin(phase)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const wx = x + 4 + ((time * 8 + tx * 11) % 18);
        ctx.moveTo(wx, y + 10 + (tx % 2) * 8);
        ctx.quadraticCurveTo(wx + 4, y + 7 + (tx % 2) * 8, wx + 9, y + 10 + (tx % 2) * 8);
        ctx.stroke();
      } else if (code === TILE_REEDS) {
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i += 1) {
          const bx = x + 3 + i * 6;
          const sway = Math.sin(time * 1.6 + tx + i * 0.9) * 3;
          ctx.strokeStyle = i % 2 ? '#7fb04f' : '#5e8f3a';
          ctx.beginPath();
          ctx.moveTo(bx, y + TILE - 2);
          ctx.quadraticCurveTo(bx + sway * 0.5, y + 14, bx + sway, y + 3 + (i % 3) * 3);
          ctx.stroke();
        }
      } else if (code === TILE_EXIT) {
        ctx.fillStyle = '#2b2f3c';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
}
