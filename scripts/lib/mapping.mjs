import { readFile } from 'node:fs/promises';

export async function loadMapping(configPath) {
  return JSON.parse(await readFile(configPath, 'utf8'));
}

export function pluginForCategory(mapping, kind, category) {
  for (const [plugin, groups] of Object.entries(mapping.plugins)) {
    if ((groups[kind] || []).includes(category)) return plugin;
  }
  return null;
}
