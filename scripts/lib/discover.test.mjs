import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverAssets } from './discover.mjs';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'equipt-'));
  const skillDir = join(root, 'equipt-marketing', 'skills', 'hashtag-strategy');
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'),
    '---\nname: hashtag-strategy\ndescription: "Plan hashtags."\nallowed-tools: Read Write\n---\n# Hashtag Strategy\n');
  const agentDir = join(root, 'equipt-engineering', 'agents');
  await mkdir(agentDir, { recursive: true });
  await writeFile(join(agentDir, 'code-reviewer.md'),
    '---\nname: code-reviewer\ndescription: "Reviews diffs."\ntools: Read, Grep\n---\nYou review code.\n');
  await writeFile(join(agentDir, 'README.md'), '# ignore me\n');
  return root;
}

test('discovers skills and agents, ignores README', async () => {
  const root = await fixture();
  const assets = await discoverAssets(root);
  const names = assets.map(a => `${a.kind}:${a.plugin}:${a.name}`).sort();
  assert.deepEqual(names, [
    'agent:equipt-engineering:code-reviewer',
    'skill:equipt-marketing:hashtag-strategy',
  ]);
  const skill = assets.find(a => a.kind === 'skill');
  assert.equal(skill.description, 'Plan hashtags.');
  assert.equal(skill.tools, 'Read Write');
});

test('returns empty for a missing plugins dir', async () => {
  assert.deepEqual(await discoverAssets(join(tmpdir(), 'does-not-exist-equipt')), []);
});
