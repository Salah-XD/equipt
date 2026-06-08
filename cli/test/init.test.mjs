import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { init } from '../src/commands/init.mjs';

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

test('init creates .claude/{skills,agents} + equipt.json', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  const { targetDir } = await init({ cwd: t });
  assert.equal(targetDir, join(t, '.claude'));
  assert.ok(await exists(join(t, '.claude', 'skills')));
  assert.ok(await exists(join(t, '.claude', 'agents')));
  assert.ok(await exists(join(t, '.claude', 'equipt.json')));
  await rm(t, { recursive: true, force: true });
});
