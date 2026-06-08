import { readdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function nameFromFrontmatter(file, fallback) {
  try {
    const fm = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fm) {
      const nm = fm[1].match(/^name:\s*["']?(.+?)["']?\s*$/m);
      if (nm) return nm[1].trim();
    }
  } catch {}
  return fallback;
}

async function safeReaddir(dir) {
  try { return await readdir(dir, { withFileTypes: true }); }
  catch (err) { if (err.code === 'ENOENT') return []; throw err; }
}

export async function loadCatalog(sourceDir) {
  const pluginsDir = join(sourceDir, 'plugins');
  let plugins = [];
  try {
    const cfg = JSON.parse(await readFile(join(sourceDir, 'plugins.config.json'), 'utf8'));
    plugins = Object.keys(cfg.plugins ?? {});
  } catch {
    plugins = (await safeReaddir(pluginsDir)).filter((e) => e.isDirectory()).map((e) => e.name);
  }

  const assets = [];
  for (const plugin of plugins) {
    const skillsBase = join(pluginsDir, plugin, 'skills');
    for (const e of await safeReaddir(skillsBase)) {
      if (!e.isDirectory()) continue;
      const src = join(skillsBase, e.name);
      assets.push({ plugin, name: nameFromFrontmatter(join(src, 'SKILL.md'), e.name), kind: 'skill', src });
    }
    const agentsBase = join(pluginsDir, plugin, 'agents');
    for (const e of await safeReaddir(agentsBase)) {
      if (!e.isFile() || !e.name.endsWith('.md') || e.name === 'README.md') continue;
      const src = join(agentsBase, e.name);
      assets.push({ plugin, name: nameFromFrontmatter(src, e.name.replace(/\.md$/, '')), kind: 'agent', src });
    }
  }

  try {
    const idx = JSON.parse(await readFile(join(sourceDir, 'scores', 'index.json'), 'utf8'));
    const byKey = new Map(idx.assets.map((a) => [`${a.plugin}/${a.name}`, a]));
    for (const a of assets) {
      const s = byKey.get(`${a.plugin}/${a.name}`);
      if (s) { a.readiness = s.readiness; a.tier = s.tier; }
    }
  } catch {}

  return { plugins, assets };
}

export function resolveTarget(catalog, query) {
  if (query.includes('/')) {
    const [p, n] = query.split('/');
    const m = catalog.assets.filter((a) => a.plugin === p && a.name === n);
    return m.length ? { kind: 'asset', matches: m } : { kind: 'none', matches: [] };
  }
  if (catalog.plugins.includes(query)) {
    return { kind: 'plugin', matches: catalog.assets.filter((a) => a.plugin === query) };
  }
  const named = catalog.assets.filter((a) => a.name === query);
  if (named.length === 1) return { kind: 'asset', matches: named };
  if (named.length > 1) return { kind: 'ambiguous', matches: named.map((a) => `${a.plugin}/${a.name}`) };
  return { kind: 'none', matches: [] };
}
