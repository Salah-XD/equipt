import { resolveSource } from '../lib/source.mjs';
import { loadCatalog } from '../lib/catalog.mjs';

export async function list({ plugin, from, cwd = process.cwd() } = {}) {
  const { dir } = await resolveSource({ from, cwd });
  const catalog = await loadCatalog(dir);
  const assets = plugin ? catalog.assets.filter((a) => a.plugin === plugin) : catalog.assets;
  return { plugins: catalog.plugins, assets };
}
