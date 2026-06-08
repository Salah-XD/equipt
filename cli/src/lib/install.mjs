import { cp, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

async function exists(p) { try { await access(p); return true; } catch { return false; } }

export async function installAsset(asset, { targetDir, force = false, shouldOverwrite }) {
  const parent = join(targetDir, asset.kind === 'skill' ? 'skills' : 'agents');
  const dest = asset.kind === 'skill' ? join(parent, asset.name) : join(parent, `${asset.name}.md`);

  const already = await exists(dest);
  if (already && !force) {
    // Non-interactive (no callback) preserves the original behavior: skip.
    if (!shouldOverwrite || !(await shouldOverwrite(asset))) return { status: 'skipped', dest };
  }

  await mkdir(parent, { recursive: true });
  await cp(asset.src, dest, { recursive: true, force: true });
  return { status: already ? 'overwritten' : 'installed', dest };
}
