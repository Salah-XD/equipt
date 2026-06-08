import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { list } from '../src/commands/list.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');

test('list returns assets with readiness', async () => {
  const out = await list({ from: FIX });
  assert.deepEqual(out.plugins, ['demo-plugin']);
  assert.equal(out.assets.length, 2);
  assert.equal(out.assets.find((a) => a.name === 'demo-skill').readiness, 90);
});

test('list --plugin scopes results', async () => {
  const out = await list({ from: FIX, plugin: 'demo-plugin' });
  assert.ok(out.assets.every((a) => a.plugin === 'demo-plugin'));
  const empty = await list({ from: FIX, plugin: 'missing' });
  assert.equal(empty.assets.length, 0);
});
