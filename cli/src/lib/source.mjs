import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { x } from 'tar';

export class SourceError extends Error {}

export function findLocalSource(cwd) {
  let dir = cwd;
  for (let i = 0; i < 12; i++) {
    try { readFileSync(join(dir, 'plugins.config.json')); return dir; } catch {}
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function extractTarball(tgzPath, destDir) {
  await mkdir(destDir, { recursive: true });
  await x({ file: tgzPath, cwd: destDir, strip: 1 });
  return destDir;
}

async function defaultDownload(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function resolveSource({ from, cwd = process.cwd(), ref = 'main', download = defaultDownload } = {}) {
  if (from) return { dir: from, cleanup: async () => {} };
  const local = findLocalSource(cwd);
  if (local) return { dir: local, cleanup: async () => {} };

  const url = `https://codeload.github.com/Salah-XD/equipt/tar.gz/refs/heads/${ref}`;
  let buf;
  try { buf = await download(url); }
  catch (err) {
    throw new SourceError(
      `Could not download Equipt from GitHub (${err.message}). The repo may be private — pass --from <path> to a local checkout.`,
    );
  }
  const tgz = join(tmpdir(), `equipt-${ref}.tgz`);
  await mkdir(dirname(tgz), { recursive: true });
  await writeFile(tgz, buf);
  const dir = join(tmpdir(), 'equipt-cli', ref);
  await extractTarball(tgz, dir);
  return { dir, cleanup: async () => {} };
}
