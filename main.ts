// Vice Cover Studio — entrypoint for make.fun gta6-cover-art-01.
// Copies app/ and screenshots/ into the output directory and writes the
// entry dossier (dossier.json) with buildDossier from vendor/makefun-app.ts.
// No build step, no network: Node 22 standard library only.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? 'out');

function copyTree(name: string): void {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ in ${repoRoot}`);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
const appEntries = readdirSync(join(outDir, 'app'), { recursive: true }).length;
const shotFiles = readdirSync(join(outDir, 'screenshots')).length;
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
console.log(`output: ${appEntries} app entries, ${shotFiles} screenshots`);
