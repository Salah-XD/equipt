import { readdir, readFile, access } from 'node:fs/promises';
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

/** Walk up from `start` until a directory containing `plugins/` is found. */
async function findRepoRoot(start: string): Promise<string> {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    try {
      await access(join(dir, 'plugins'));
      return dir;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break; // filesystem root
      dir = parent;
    }
  }
  return start; // fallback
}

/** Repo root = directory containing `plugins/`. Walks up from this file's location. */
export function repoRoot(): string {
  // Synchronous best-effort: 3 levels up from source (site/src/lib -> repo).
  // At Astro SSG build time import.meta.url may resolve to the project root,
  // so we also check cwd-relative paths below via the async variant.
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}

/** Async-safe repo root that walks upward to find the plugins/ directory. */
async function resolveRepoRoot(): Promise<string> {
  const fromMeta = repoRoot();
  try {
    await access(join(fromMeta, 'plugins'));
    return fromMeta;
  } catch {
    // import.meta.url was not the source file path (Vite SSR build) — walk up from cwd
    return findRepoRoot(process.cwd());
  }
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

export async function loadAssets(root?: string): Promise<Asset[]> {
  if (root === undefined) root = await resolveRepoRoot();
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
