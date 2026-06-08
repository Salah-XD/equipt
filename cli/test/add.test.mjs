import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { add } from '../src/commands/add.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

test('add <plugin> installs all assets and records them', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  const out = await add('demo-plugin', { from: FIX, cwd: t });
  assert.equal(out.results.length, 2);
  assert.ok(await exists(join(t, '.claude', 'skills', 'demo-skill', 'SKILL.md')));
  assert.ok(await exists(join(t, '.claude', 'agents', 'demo-agent.md')));
  const m = JSON.parse(await readFile(join(t, '.claude', 'equipt.json'), 'utf8'));
  assert.ok(m.installed['demo-skill'] && m.installed['demo-agent']);
  await rm(t, { recursive: true, force: true });
});

test('add <name> installs one; second add skips; --force overwrites', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  const a = await add('demo-skill', { from: FIX, cwd: t });
  assert.equal(a.results[0].status, 'installed');
  const b = await add('demo-skill', { from: FIX, cwd: t });
  assert.equal(b.results[0].status, 'skipped');
  const c = await add('demo-skill', { from: FIX, cwd: t, force: true });
  assert.equal(c.results[0].status, 'overwritten');
  await rm(t, { recursive: true, force: true });
});

test('add returns an error for an unknown target', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  const out = await add('nope', { from: FIX, cwd: t });
  assert.match(out.error, /no plugin or asset/);
  await rm(t, { recursive: true, force: true });
});
