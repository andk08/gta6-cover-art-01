// Vice Cover Studio — entry builder.
//
// Copies app/ and screenshots/ into the output directory and writes the
// dossier buildDossier derives from them, so what is handed in is exactly
// what the scorer would derive from the same directory.
//
// Usage: node main.ts            (writes /output)
//        MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const root = resolve(new URL('.', import.meta.url).pathname);

// Fail fast on what buildDossier would refuse anyway, with a plain message.
const shotsDir = resolve(root, 'screenshots');
if (!existsSync(shotsDir)) throw new Error('missing screenshots/ next to main.ts');
const shotFiles = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (shotFiles.length === 0) throw new Error('screenshots/ holds no image: the first is the cover');
for (const f of shotFiles) {
  const bytes = statSync(resolve(shotsDir, f)).size;
  if (bytes > 262144) throw new Error(`screenshots/${f} is ${bytes} bytes, over the 262144 byte cap`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const name of ['app', 'screenshots']) {
  const src = resolve(root, name);
  if (!existsSync(src)) throw new Error(`missing ${name}/ next to main.ts`);
  cpSync(src, resolve(outDir, name), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
const dossierPath = resolve(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log(`wrote ${dossierPath} (${dossier.length} bytes)`);

// Summary: how many entries the output holds, so a bad copy is visible.
function countFiles(dir: string): number {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(resolve(dir, e.name)) : 1;
  }
  return n;
}
console.log(
  `output holds ${countFiles(resolve(outDir, 'app'))} app entries and ${shotFiles.length} screenshots`,
);
