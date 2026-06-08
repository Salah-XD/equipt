import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readManifest, writeManifest, defaultManifest } from '../src/lib/manifest.mjs';

test('reading a missing manifest returns the default', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eq-'));
  const m = await readManifest(dir);
  assert.deepEqual(m, defaultManifest());
  await rm(dir, { recursive: true, force: true });
});

test('write then read round-trips', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eq-'));
  const m = defaultManifest();
  m.installed['x'] = { plugin: 'p', kind: 'skill', addedAt: 'now' };
  await writeManifest(dir, m);
  assert.deepEqual(await readManifest(dir), m);
  await rm(dir, { recursive: true, force: true });
});
