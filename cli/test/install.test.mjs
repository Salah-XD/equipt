import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installAsset } from '../src/lib/install.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');
const skill = { plugin: 'demo-plugin', name: 'demo-skill', kind: 'skill', src: join(FIX, 'plugins/demo-plugin/skills/demo-skill') };
const agent = { plugin: 'demo-plugin', name: 'demo-agent', kind: 'agent', src: join(FIX, 'plugins/demo-plugin/agents/demo-agent.md') };
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

test('installs a skill folder and an agent file', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  const s = await installAsset(skill, { targetDir: t });
  assert.equal(s.status, 'installed');
  assert.ok(await exists(join(t, 'skills', 'demo-skill', 'SKILL.md')));
  const a = await installAsset(agent, { targetDir: t });
  assert.equal(a.status, 'installed');
  assert.ok(await exists(join(t, 'agents', 'demo-agent.md')));
  await rm(t, { recursive: true, force: true });
});

test('skips an existing asset, overwrites with force', async () => {
  const t = await mkdtemp(join(tmpdir(), 'eq-'));
  await installAsset(agent, { targetDir: t });
  assert.equal((await installAsset(agent, { targetDir: t })).status, 'skipped');
  assert.equal((await installAsset(agent, { targetDir: t, force: true })).status, 'overwritten');
  await rm(t, { recursive: true, force: true });
});
