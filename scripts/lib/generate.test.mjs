import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketplace, buildPluginManifest, buildDirectory } from './generate.mjs';

const plugins = [
  { name: 'equipt-data', description: 'Data stuff.' },
  { name: 'equipt-marketing', description: 'Marketing stuff.' },
];

test('marketplace lists plugins with relative sources', () => {
  const m = buildMarketplace(plugins, { name: 'equipt', owner: 'equipt' });
  assert.equal(m.name, 'equipt');
  assert.equal(m.owner.name, 'equipt');
  assert.deepEqual(m.plugins[0], { name: 'equipt-data', source: './plugins/equipt-data', description: 'Data stuff.' });
});

test('plugin manifest carries name, description, version', () => {
  assert.deepEqual(buildPluginManifest({ name: 'equipt-data', description: 'Data stuff.' }),
    { name: 'equipt-data', description: 'Data stuff.', version: '0.1.0' });
});

test('directory groups by plugin and counts kinds', () => {
  const md = buildDirectory([
    { kind: 'skill', plugin: 'equipt-data', name: 'sql-helper', description: 'SQL.' },
    { kind: 'agent', plugin: 'equipt-data', name: 'sql-bot', description: 'Bot.' },
  ]);
  assert.match(md, /## equipt-data/);
  assert.match(md, /### Skills \(1\)/);
  assert.match(md, /- \*\*sql-helper\*\* — SQL\./);
  assert.match(md, /### Agents \(1\)/);
});
