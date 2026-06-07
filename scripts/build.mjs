import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAssets } from './lib/discover.mjs';
import { loadMapping } from './lib/mapping.mjs';
import { buildMarketplace, buildPluginManifest, buildDirectory } from './lib/generate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

const mapping = await loadMapping(join(ROOT, 'plugins.config.json'));
const assets = await discoverAssets(join(ROOT, 'plugins'));
const plugins = Object.entries(mapping.plugins).map(([name, cfg]) => ({ name, description: cfg.description }));

const json = (obj) => JSON.stringify(obj, null, 2) + '\n';

const outputs = [
  [join(ROOT, '.claude-plugin', 'marketplace.json'), json(buildMarketplace(plugins, mapping.marketplace))],
  ...plugins.map(p => [join(ROOT, 'plugins', p.name, '.claude-plugin', 'plugin.json'), json(buildPluginManifest(p))]),
  [join(ROOT, 'docs', 'directory.md'), buildDirectory(assets)],
];

// Inject the generated plugin table into README between markers.
const readmePath = join(ROOT, 'README.md');
const readme = await readFile(readmePath, 'utf8').catch(() => null);
const MARKERS = /<!-- PLUGINS:START -->[\s\S]*?<!-- PLUGINS:END -->/;
if (readme) {
  if (!MARKERS.test(readme)) {
    console.error(`README.md is missing the <!-- PLUGINS:START -->/<!-- PLUGINS:END --> markers; cannot inject the plugin table.`);
    process.exit(1);
  }
  const rows = plugins
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(p => `- \`${p.name}\` — ${p.description}`)
    .join('\n');
  const block = `<!-- PLUGINS:START -->\n${rows}\n<!-- PLUGINS:END -->`;
  const next = readme.replace(MARKERS, block);
  outputs.push([readmePath, next]);
}

let drift = false;
for (const [path, content] of outputs) {
  const existing = await readFile(path, 'utf8').catch(() => null);
  if (existing === content) continue;
  if (check) {
    drift = true;
    console.error(`drift: ${path}`);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    console.log(`wrote ${path}`);
  }
}

if (check && drift) {
  console.error('\nGenerated files are out of date. Run `npm run build` and commit.');
  process.exit(1);
}
