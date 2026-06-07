import type { Asset } from './catalog';

export interface IndexEntry {
  name: string;
  description: string;
  plugin: string;
  kind: 'skill' | 'agent';
  slug: string;
}

export function toIndex(assets: Asset[]): IndexEntry[] {
  return assets.map(({ name, description, plugin, kind, slug }) => ({ name, description, plugin, kind, slug }));
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
