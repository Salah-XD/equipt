import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { c } from 'tar';
import { findLocalSource, extractTarball, resolveSource } from '../src/lib/source.mjs';

const FIXES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const FIX = join(FIXES, 'source');
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

test('findLocalSource walks up to the dir with plugins.config.json', () => {
  assert.equal(findLocalSource(join(FIX, 'plugins', 'demo-plugin')), FIX);
  assert.equal(findLocalSource(tmpdir()), null);
});

test('extractTarball unpacks a GitHub-style tarball (strip top dir)', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  const tgz = join(t, 'src.tgz');
  await c({ gzip: true, file: tgz, cwd: FIXES }, ['source']);
  const out = join(t, 'out');
  await extractTarball(tgz, out);
  assert.ok(await exists(join(out, 'plugins.config.json')));
  await rm(t, { recursive: true, force: true });
});

test('resolveSource honors --from and auto-detects local', async () => {
  assert.equal((await resolveSource({ from: FIX })).dir, FIX);
  assert.equal((await resolveSource({ cwd: join(FIX, 'plugins') })).dir, FIX);
});
