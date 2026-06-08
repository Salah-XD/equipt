import { readFile } from 'node:fs/promises';
import { discoverAssets } from '../../scripts/lib/discover.mjs';
import { parseFrontmatter } from '../../scripts/lib/frontmatter.mjs';

// discoverAssets returns records without the body; enrich each with parsed body text.
export async function loadAssetsForScoring(pluginsDir) {
  const records = await discoverAssets(pluginsDir);
  const out = [];
  for (const r of records) {
    const content = await readFile(r.file, 'utf8');
    const { body } = parseFrontmatter(content);
    out.push({ ...r, body });
  }
  return out;
}
