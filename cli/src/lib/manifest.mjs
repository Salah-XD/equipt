import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = 'Salah-XD/equipt';

export function defaultManifest() {
  return { source: SOURCE, installed: {} };
}

export async function readManifest(targetDir) {
  try {
    const m = JSON.parse(await readFile(join(targetDir, 'equipt.json'), 'utf8'));
    return { source: m.source ?? SOURCE, installed: m.installed ?? {} };
  } catch (err) {
    if (err.code === 'ENOENT') return defaultManifest();
    throw err;
  }
}

export async function writeManifest(targetDir, manifest) {
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, 'equipt.json'), JSON.stringify(manifest, null, 2) + '\n');
}
