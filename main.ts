// HUSHWATER's hand-in program (Node 22, standard library only). The game is game/: static files a
// desktop browser plays offline (index.html and its ES modules, no library, no network request).
// This program copies game/ and screenshots/ to the output folder and writes dossier.json, the
// summary the judge reads, with make.fun's vendored library.
//
// Play it locally: `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The scorer's caps; only text_max_bytes changes the dossier's bytes, the rest refuse an over-size entry early. */
const LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyInto(name: string): void {
  const from = join(root, name);
  mkdirSync(join(out, name), { recursive: true });
  if (existsSync(from)) cpSync(from, join(out, name), { recursive: true });
}

mkdirSync(out, { recursive: true });
copyInto('game');
copyInto('screenshots');
writeFileSync(join(out, 'dossier.json'), buildDossier(out, LIMITS));
