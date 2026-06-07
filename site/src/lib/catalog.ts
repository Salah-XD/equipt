import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export interface Asset {
  kind: 'skill' | 'agent';
  plugin: string;
  name: string;
  description: string;
  tools: string | undefined;
  body: string;
  slug: string;
}

/** Repo root = three levels up from this file (site/src/lib -> site/src -> site -> repo). */
export function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}

async function safeReaddir(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function read(file: string, kind: 'skill' | 'agent', plugin: string): Promise<Asset | null> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  const { data, content } = matter(raw);
  if (!data.name) return null;
  return {
    kind,
    plugin,
    name: data.name,
    description: data.description ?? '',
    tools: (data['allowed-tools'] ?? data.tools) as string | undefined,
    body: content,
    slug: `${plugin}/${data.name}`,
  };
}

export async function loadAssets(root: string = repoRoot()): Promise<Asset[]> {
  const pluginsDir = join(root, 'plugins');
  const assets: Asset[] = [];
  for (const plugin of await safeReaddir(pluginsDir)) {
    if (!plugin.isDirectory()) continue;

    const skillsBase = join(pluginsDir, plugin.name, 'skills');
    for (const e of await safeReaddir(skillsBase)) {
      if (!e.isDirectory()) continue;
      const rec = await read(join(skillsBase, e.name, 'SKILL.md'), 'skill', plugin.name);
      if (rec) assets.push(rec);
    }

    const agentsBase = join(pluginsDir, plugin.name, 'agents');
    for (const e of await safeReaddir(agentsBase)) {
      if (!e.isFile() || !e.name.endsWith('.md') || e.name === 'README.md') continue;
      const rec = await read(join(agentsBase, e.name), 'agent', plugin.name);
      if (rec) assets.push(rec);
    }
  }
  return assets.sort((a, b) => a.name.localeCompare(b.name));
}
