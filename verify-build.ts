import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'out');
mkdirSync(output, { recursive:true });
function tree(path: string, prefix = ''): string[] {
  return readdirSync(path, { withFileTypes:true }).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(entry => {
    const name = prefix + entry.name;
    return entry.isDirectory() ? [name+'/', ...tree(join(path,entry.name),name+'/')] : [name+':'+createHash('sha256').update(readFileSync(join(path,entry.name))).digest('hex')];
  });
}
let first: string[] | undefined;
let failures = 0;
for (let run=1;run<=2;run++) {
  const result = spawnSync(process.execPath, ['main.ts'], { cwd:root, env:{...process.env,MAKEFUN_OUTPUT_DIR:output}, encoding:'utf8' });
  if (result.status !== 0) { failures++; console.error(`Run ${run}: FAILED — no valid dossier checksum\n${result.stderr}`); continue; }
  const snapshot=tree(output);
  const checksum=createHash('sha256').update(readFileSync(join(output,'dossier.json'))).digest('hex');
  console.log(`Run ${run}: dossier SHA-256 ${checksum}`);
  if(first&&JSON.stringify(first)!==JSON.stringify(snapshot))throw Error('Output file trees differ');
  first=snapshot;
}
if(failures)process.exitCode=1;
else console.log('PASS: both dossiers and full output file trees are byte-identical.');
