// Stage a screenshot scene in Node (no browser) and print where everyone is and what they are doing.
// usage: node tools/scene-probe.mjs <scene>
import { createGame } from '../game/src/game-flow.js';
import { stageShot } from '../game/src/shots.js';
const game = createGame();
stageShot(process.argv[2] ?? 'cover', game);
const w = game.world;
const t = (v) => (v / 30).toFixed(1);
console.log(`screen=${game.screen} level=${w.levelIndex + 1} outcome=${w.outcome} time=${w.stats.time.toFixed(1)} stats=${JSON.stringify(w.stats)} rank=${game.rank}`);
console.log(`player tile=(${t(w.player.x)},${t(w.player.y)}) ledger=${w.player.hasLedger} hidden=${!!w.player.hiddenIn} lit=${w.player.lit}`);
for (const g of w.guards) console.log(`  ${g.name.padEnd(8)} ${g.state.padEnd(11)} tile=(${t(g.x)},${t(g.y)}) facing=${Math.round(g.facing * 57.3)} susp=${g.suspicion.toFixed(2)} sees=${g.seesPlayer}`);
console.log(`noises=${w.noises.map((n) => n.kind + '@' + t(n.x) + ',' + t(n.y) + ' heard ' + n.heardBy).join(' ')} popups=${w.popups.map((p) => p.text)}`);
