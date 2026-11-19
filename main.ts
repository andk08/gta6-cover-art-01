// Vice Cover Studio: the entry program (Node 22, standard library only).
//
// It hands the app in: app/ and screenshots/ are copied from beside this
// file into the output directory, and dossier.json is written there with
// the vendored make.fun library, so the judge can read the app's source and
// screenshots. The program runs twice in the grader and both runs must
// write the same bytes, so it does nothing time- or network-dependent:
// a straight copy plus a dossier built from the files it just wrote.
//
// Locally, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the rest refuse an entry the scorer would refuse.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies a directory from the repository into the output, if it exists. */
function copyDir(name) {
  const from = join(repoDir, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyDir('app');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyDir('screenshots');

// The one file the gate cannot do without: if the copy missed it, fail
// loudly instead of writing a dossier for an app with no page.
if (!existsSync(join(outputDir, 'app', 'index.html'))) {
  throw new Error('app/index.html did not reach the output directory');
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));
