// Vice Cover Studio — hands the app in for the make.fun GTA 6 cover art
// bounty (Node 22, standard library only). It copies app/ and screenshots/
// from beside this file into the output directory and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory itself is never removed: the grader runs this file
// as a user who can write inside /output but cannot delete the mount, so
// deleting it would fail with EPERM. Only the directory's contents are
// cleared, one entry at a time.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
clearDir(out);

function clearDir(dir) {
  // One entry at a time, never the directory itself: the grader's /output
  // is a mount its user may write in but may not remove (EPERM on rmSync).
  // A previous run's copy may be read-only (cpSync keeps the source's
  // modes), so make each child writable first, or its removal fails EACCES.
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    makeWritable(path);
    rmSync(path, { recursive: true, force: true });
  }
}

function makeWritable(path) {
  try {
    const st = statSync(path);
    if (st.isDirectory()) {
      for (const entry of readdirSync(path)) makeWritable(resolve(path, entry));
    }
    chmodSync(path, st.mode | 0o200);
  } catch {
    // Not our file to chmod: the removal below decides the outcome.
  }
}

cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files, in all, or a path under app/ over 1000 bytes).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_CAPS));
