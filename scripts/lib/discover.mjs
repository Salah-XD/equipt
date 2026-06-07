import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';

async function safeReaddir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function readRecord(file, kind, plugin, dir) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  const { data } = parseFrontmatter(content);
  return {
    kind,
    plugin,
    dir,
    file,
    name: data.name,
    description: data.description,
    tools: data['allowed-tools'] ?? data.tools,
    frontmatter: data,
  };
}

export async function discoverAssets(pluginsDir) {
  const assets = [];
  for (const plugin of await safeReaddir(pluginsDir)) {
    if (!plugin.isDirectory()) continue;

    const skillsBase = join(pluginsDir, plugin.name, 'skills');
    for (const entry of await safeReaddir(skillsBase)) {
      if (!entry.isDirectory()) continue;
      const dir = join(skillsBase, entry.name);
      const record = await readRecord(join(dir, 'SKILL.md'), 'skill', plugin.name, dir);
      if (record) assets.push(record);
    }

    const agentsBase = join(pluginsDir, plugin.name, 'agents');
    for (const entry of await safeReaddir(agentsBase)) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.md') || entry.name === 'README.md') continue;
      const file = join(agentsBase, entry.name);
      const record = await readRecord(file, 'agent', plugin.name, agentsBase);
      if (record) assets.push(record);
    }
  }
  return assets;
}
