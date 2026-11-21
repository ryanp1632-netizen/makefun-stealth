// Keyboard and mouse: held keys for movement and stance, one-shot presses for actions, and mouse
// clicks turned into canvas coordinates (the canvas is letterboxed to fit the window).
import { VIEW } from './config.js';

export function createInput(canvas) {
  const held = new Set();
  const pressed = [];
  const clicks = [];
  const mouse = { x: VIEW.width / 2, y: VIEW.height / 2 };

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / VIEW.width, rect.height / VIEW.height);
    const offX = (rect.width - VIEW.width * scale) / 2;
    const offY = (rect.height - VIEW.height * scale) / 2;
    return { x: (event.clientX - rect.left - offX) / scale, y: (event.clientY - rect.top - offY) / scale };
  }

  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.code)) event.preventDefault();
    if (!event.repeat) pressed.push(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => {
    held.clear();
    pressed.push('Blur');
  });
  canvas.addEventListener('pointermove', (event) => Object.assign(mouse, toCanvas(event)));
  canvas.addEventListener('pointerdown', (event) => {
    Object.assign(mouse, toCanvas(event));
    clicks.push({ ...mouse, button: event.button });
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    mouse,
    /** Movement and stance wanted this tick. */
    intent() {
      const dx = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0);
      const dy = (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0) - (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0);
      return { dx, dy, sneak: held.has('ShiftLeft') || held.has('ShiftRight'), run: held.has('Space') };
    },
    takePresses() {
      return pressed.splice(0, pressed.length);
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
