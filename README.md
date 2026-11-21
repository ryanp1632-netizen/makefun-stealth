# makefun-stealth: HUSHWATER

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/ryanp1632-netizen/makefun-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/ryanp1632-netizen/makefun-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

HUSHWATER is an original top-down stealth game for the browser: a night thief on the canal docks must take the ledger and slip out of the exit gate past lantern guards, a keen-eared hound and sweeping wall beacons. Guards' lantern cones are ray-cast against walls and crates, a detection meter fills while you are seen ("?" suspicious, then "!" alert), and you can recover by breaking line of sight, hiding in reeds or barrels, or luring guards away with a thrown pebble. Footprints, footstep rings and panned footstep sounds tell you where every guard walks.

Four levels, a title screen with rules and controls, a results screen with GHOST / SHADOW / SEEN / CAUGHT ranks. Plain Canvas 2D and ES modules, no libraries; every sprite is drawn in code and every sound is synthesized with WebAudio.

Built for make.fun's [Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759) bounty.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | move |
| Shift | sneak (silent, slow; invisible in reeds) |
| Space | run (fast, loud) |
| Click | throw a pebble (a noise guards go to check) |
| E | hide in / leave a barrel |
| H | field-guide labels |
| P / Esc | pause |
| R | restart the level |

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

Hand-in (writes the game, screenshots and dossier.json): `MAKEFUN_OUTPUT_DIR=out node main.ts`.
Screenshots are rendered from the game's own code by `bash tools/shots.sh` (headless Chrome, `?shot=` scenes in `game/src/shots.js`).

## Layout

- `game/src/levels/`: level maps and patrol routes (`level-data.js`), tile grid and sight-line ray marching (`tilemap.js`)
- `game/src/ai/`: vision cones, hearing, pathfinding, patrol routes and the guard state machine
- `game/src/actors/`: the thief and the guards
- `game/src/systems/`: noise, hiding, footprints, detection meter, saved ranks
- `game/src/render/`: level painting, night lighting, actors, HUD
- `game/src/ui/`: title and results screens; `game/src/audio/synth.js`: all sound

MIT licensed.

---

<sub>Entered on [make.fun](https://make.fun/?ref=z79n7aa6&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
