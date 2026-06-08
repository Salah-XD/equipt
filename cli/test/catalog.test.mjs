import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, resolveTarget } from '../src/lib/catalog.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');

test('loadCatalog reads plugins + assets + scores', async () => {
  const cat = await loadCatalog(FIX);
  assert.deepEqual(cat.plugins, ['demo-plugin']);
  assert.equal(cat.assets.length, 2);
  const skill = cat.assets.find((a) => a.name === 'demo-skill');
  assert.equal(skill.kind, 'skill');
  assert.equal(skill.readiness, 90);
  assert.equal(skill.tier, 'certified');
  assert.ok(skill.src.endsWith(join('skills', 'demo-skill')));
  const agent = cat.assets.find((a) => a.name === 'demo-agent');
  assert.equal(agent.kind, 'agent');
  assert.ok(agent.src.endsWith('demo-agent.md'));
});

test('resolveTarget: plugin / asset / qualified / none', async () => {
  const cat = await loadCatalog(FIX);
  assert.equal(resolveTarget(cat, 'demo-plugin').kind, 'plugin');
  assert.equal(resolveTarget(cat, 'demo-plugin').matches.length, 2);
  assert.equal(resolveTarget(cat, 'demo-skill').kind, 'asset');
  assert.equal(resolveTarget(cat, 'demo-plugin/demo-agent').kind, 'asset');
  assert.equal(resolveTarget(cat, 'nope').kind, 'none');
});
