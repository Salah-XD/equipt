import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAssets } from './lib/discover.mjs';
import { validateAssets } from './lib/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const assets = await discoverAssets(join(ROOT, 'plugins'));
const problems = validateAssets(assets);
const errors = problems.filter(p => p.level === 'error');

for (const p of problems) {
  const line = `${p.level.toUpperCase()} ${p.where}: ${p.msg}`;
  if (p.level === 'error') console.error(line);
  else console.warn(line);
}

console.log(`\n${assets.length} assets · ${errors.length} errors · ${problems.length - errors.length} warnings`);
if (errors.length) process.exit(1);
