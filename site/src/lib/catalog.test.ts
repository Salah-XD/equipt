import { test, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadAssets } from './catalog';

async function fixtureRoot() {
  const root = await mkdtemp(join(tmpdir(), 'equipt-site-'));
  const skill = join(root, 'plugins', 'equipt-marketing', 'skills', 'hashtag-strategy');
  await mkdir(skill, { recursive: true });
  await writeFile(join(skill, 'SKILL.md'),
    '---\nname: hashtag-strategy\ndescription: "Plan hashtags."\nallowed-tools: Read Write\n---\n# Hashtag Strategy\nBody here.\n');
  const agents = join(root, 'plugins', 'equipt-engineering', 'agents');
  await mkdir(agents, { recursive: true });
  await writeFile(join(agents, 'code-reviewer.md'),
    '---\nname: code-reviewer\ndescription: "Reviews diffs."\ntools: Read, Grep\n---\nYou review code.\n');
  await writeFile(join(agents, 'README.md'), '# ignore\n');
  return root;
}

test('loads skills and agents, ignores README, sorts by name', async () => {
  const assets = await loadAssets(await fixtureRoot());
  expect(assets.map(a => a.slug)).toEqual([
    'equipt-engineering/code-reviewer',
    'equipt-marketing/hashtag-strategy',
  ]);
  const skill = assets.find(a => a.kind === 'skill')!;
  expect(skill.description).toBe('Plan hashtags.');
  expect(skill.tools).toBe('Read Write');
  expect(skill.body).toContain('Body here.');
});

test('returns [] for a missing plugins dir', async () => {
  expect(await loadAssets(join(tmpdir(), 'nope-equipt'))).toEqual([]);
});
