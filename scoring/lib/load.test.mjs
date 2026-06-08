import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAssetsForScoring } from './load.mjs';

const PLUGINS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins');

test('loads real in-repo assets with body text', async () => {
  const assets = await loadAssetsForScoring(PLUGINS);
  assert.ok(assets.length > 100, `expected many assets, got ${assets.length}`);
  const withBody = assets.filter((a) => typeof a.body === 'string' && a.body.length > 0);
  assert.equal(withBody.length, assets.length, 'every asset should have a body');
  assert.ok(assets.every((a) => a.name && a.plugin && (a.kind === 'skill' || a.kind === 'agent')));
});
