// Play-test the real game in headless Chrome over the DevTools protocol: start a level from the
// title with Enter, walk with held keys, sneak, throw a pebble with a click, hide in a barrel,
// pause, restart, and report the game state and any page errors along the way.
// usage: node tools/play-test.mjs (expects `node serve.ts --port 8093` running)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'hush-'));
const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i += 1) {
  try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.length) break; } catch { /* starting */ }
  await sleep(200);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const waiting = new Map();
const errors = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r) => { id += 1; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
const KEYS = { Enter: 13, Space: 32, KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68, KeyE: 69, KeyP: 80, KeyR: 82, KeyH: 72, ShiftLeft: 16 };
const key = (type, code) => send('Input.dispatchKeyEvent', { type, code, key: code.replace('Key', '').toLowerCase(), windowsVirtualKeyCode: KEYS[code] });
const tap = async (code) => { await key('keyDown', code); await sleep(60); await key('keyUp', code); await sleep(60); };
const hold = async (codes, ms) => { for (const c of codes) await key('keyDown', c); await sleep(ms); for (const c of codes) await key('keyUp', c); };
const state = () => evalJs(`(() => { const g = window.hushwater, w = g.world, p = w.player; return { screen: g.screen, paused: g.paused, level: w.levelIndex, tile: [Math.floor(p.x/30), Math.floor(p.y/30)], stance: p.stance, pebbles: p.pebbles, hidden: !!p.hiddenIn, outcome: w.outcome, stats: w.stats, guards: w.guards.map(x => x.name + ':' + x.state) }; })()`);
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(process.argv[2] ?? '.', name), Buffer.from(r.result.data, 'base64')); };

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:8093/index.html' });
await sleep(1500);
console.log('title', JSON.stringify(await state()));
await tap('Enter');
await sleep(300);
console.log('started', JSON.stringify(await state()));
await hold(['ShiftLeft', 'KeyS'], 1500);
console.log('sneak down', JSON.stringify(await state()));
await hold(['KeyD'], 1200);
console.log('walk right', JSON.stringify(await state()));
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 600, y: 300, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 600, y: 300, button: 'left', clickCount: 1 });
await sleep(900);
console.log('pebble', JSON.stringify(await state()));
await shot('play-1.png');
await hold(['Space', 'KeyD'], 800);
console.log('run', JSON.stringify(await state()));
await tap('KeyP');
console.log('paused', JSON.stringify(await state()));
await tap('KeyP');
await tap('KeyR');
await sleep(200);
console.log('restarted', JSON.stringify(await state()));
await evalJs(`(() => { const w = window.hushwater.world; const b = w.map.barrels[0]; w.player.x = b.x - 26; w.player.y = b.y; })()`);
await tap('KeyE');
console.log('hide', JSON.stringify(await state()));
await tap('KeyE');
console.log('unhide', JSON.stringify(await state()));
await evalJs(`(() => { const w = window.hushwater.world; w.player.hasLedger = true; w.player.x = w.map.exit.x - 8; w.player.y = w.map.exit.y; })()`);
await sleep(300);
console.log('escape', JSON.stringify(await state()));
await shot('results.png');
await tap('KeyN');
await sleep(300);
console.log('next', JSON.stringify(await state()));
await sleep(4000);
console.log('level 2 after 4 s', JSON.stringify(await state()));
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
ws.close();
proc.kill();
process.exit(0);
