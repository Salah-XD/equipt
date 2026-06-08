import type { Asset } from './catalog';

export interface IndexEntry {
  name: string;
  description: string;
  plugin: string;
  kind: 'skill' | 'agent';
  slug: string;
  readiness?: number;
  tier?: string;
}

/**
 * Strip assets down to searchable index entries. When a `scores` map is passed,
 * each entry is enriched with its Readiness score + tier; otherwise the shape is
 * unchanged (no extra keys), so the index stays backward-compatible.
 */
export function toIndex(
  assets: Asset[],
  scores?: Map<string, { readiness: number; tier: string }>,
): IndexEntry[] {
  return assets.map(({ name, description, plugin, kind, slug }) => {
    const s = scores?.get(slug);
    return s
      ? { name, description, plugin, kind, slug, readiness: s.readiness, tier: s.tier }
      : { name, description, plugin, kind, slug };
  });
}

export interface Facets {
  q?: string;
  plugin?: string;
  kind?: '' | 'skill' | 'agent';
}

export function filterEntries(entries: IndexEntry[], { q = '', plugin = '', kind = '' }: Facets): IndexEntry[] {
  const needle = q.trim().toLowerCase();
  return entries.filter((e) => {
    if (plugin && e.plugin !== plugin) return false;
    if (kind && e.kind !== kind) return false;
    if (needle && !(e.name.toLowerCase().includes(needle) || e.description.toLowerCase().includes(needle))) return false;
    return true;
  });
}
