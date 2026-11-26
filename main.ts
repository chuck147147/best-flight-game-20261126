import { cpSync, mkdirSync, writeFileSync, readdirSync, lstatSync, rmSync } from 'node:fs';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
function checkTree(path: string): void {
  for (const name of readdirSync(path).sort()) {
    const full = join(path, name);
    const info = lstatSync(full);
    if (info.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${full}`);
    if (info.isDirectory()) checkTree(full);
    else if (!info.isFile()) throw new Error(`Not a regular file: ${full}`);
  }
}
// Keep source trees safe, including nested or ancestor output paths.
if (root === output || root.startsWith(output + sep) || ['game', 'screenshots', 'vendor'].some(name => output === join(root, name) || output.startsWith(join(root, name) + sep))) {
  throw new Error('Output must be separate from the entry sources.');
}
for (const directory of ['game', 'screenshots']) checkTree(join(root, directory));
// Preflight before touching output: missing screenshots must never yield a partial dossier.
const expected = buildDossier(root, caps);
mkdirSync(output, { recursive: true });
for (const directory of ['game', 'screenshots']) {
  // Replace prior generated trees so stale files cannot affect deterministic output.
  rmSync(join(output, directory), { recursive: true, force: true });
  cpSync(join(root, directory), join(output, directory), { recursive: true, force: true });
}
const dossier = buildDossier(output, caps);
if (!Buffer.from(dossier).equals(Buffer.from(expected))) throw new Error('Copied output differs from source dossier.');
writeFileSync(join(output, 'dossier.json'), dossier);
console.log(`RIDGE RUNNER packaged at ${output}`);
