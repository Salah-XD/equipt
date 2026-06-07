import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));

test('scaffolds a new skill with valid frontmatter', async () => {
  const root = await mkdtemp(join(tmpdir(), 'equipt-new-'));
  await mkdir(join(root, 'scripts'), { recursive: true });
  await cp(join(HERE, 'new-skill.mjs'), join(root, 'scripts', 'new-skill.mjs'));
  await mkdir(join(root, 'plugins', 'equipt-marketing', 'skills'), { recursive: true });

  const res = spawnSync('node', [
    'scripts/new-skill.mjs',
    '--plugin', 'equipt-marketing',
    '--name', 'tiktok-hook-writer',
    '--description', 'Writes scroll-stopping TikTok hooks.',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);

  const md = await readFile(join(root, 'plugins', 'equipt-marketing', 'skills', 'tiktok-hook-writer', 'SKILL.md'), 'utf8');
  assert.match(md, /^name: tiktok-hook-writer$/m);
  assert.match(md, /description: "Writes scroll-stopping TikTok hooks\."/);
  assert.match(md, /# Tiktok Hook Writer/);
});
