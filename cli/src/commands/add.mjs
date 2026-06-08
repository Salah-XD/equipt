import { resolveSource } from '../lib/source.mjs';
import { loadCatalog, resolveTarget } from '../lib/catalog.mjs';
import { resolveTargetDir } from '../lib/paths.mjs';
import { installAsset } from '../lib/install.mjs';
import { readManifest, writeManifest } from '../lib/manifest.mjs';

export async function add(query, { global = false, force = false, from, cwd = process.cwd() } = {}) {
  if (!query) return { error: 'usage: equipt add <plugin|name>' };

  const { dir } = await resolveSource({ from, cwd });
  const catalog = await loadCatalog(dir);
  const r = resolveTarget(catalog, query);

  if (r.kind === 'none') return { error: `no plugin or asset named "${query}". Try: equipt list` };
  if (r.kind === 'ambiguous') return { error: `"${query}" is ambiguous: ${r.matches.join(', ')}. Qualify as <plugin>/<name>.` };

  const targetDir = resolveTargetDir({ global, cwd });
  const manifest = await readManifest(targetDir);
  const results = [];
  for (const asset of r.matches) {
    const res = await installAsset(asset, { targetDir, force });
    if (res.status !== 'skipped') {
      manifest.installed[asset.name] = { plugin: asset.plugin, kind: asset.kind, addedAt: new Date().toISOString() };
    }
    results.push({ name: asset.name, kind: asset.kind, status: res.status });
  }
  await writeManifest(targetDir, manifest);
  return { targetDir, results };
}
