import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveTargetDir } from '../lib/paths.mjs';
import { readManifest, writeManifest } from '../lib/manifest.mjs';

export async function init({ global = false, cwd = process.cwd() } = {}) {
  const targetDir = resolveTargetDir({ global, cwd });
  await mkdir(join(targetDir, 'skills'), { recursive: true });
  await mkdir(join(targetDir, 'agents'), { recursive: true });
  await writeManifest(targetDir, await readManifest(targetDir));
  return { targetDir };
}
