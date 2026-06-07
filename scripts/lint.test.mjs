import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));

async function repoWith(skillFrontmatter) {
  const root = await mkdtemp(join(tmpdir(), 'equipt-lint-'));
  await mkdir(join(root, 'scripts', 'lib'), { recursive: true });
  await cp(join(HERE, 'lint.mjs'), join(root, 'scripts', 'lint.mjs'));
  await cp(join(HERE, 'lib'), join(root, 'scripts', 'lib'), { recursive: true });
  // copy node_modules so gray-matter resolves
  await cp(join(HERE, '..', 'node_modules'), join(root, 'node_modules'), { recursive: true });
  const dir = join(root, 'plugins', 'equipt-x', 'skills', 'thing');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'SKILL.md'), skillFrontmatter);
  return root;
}

test('lint exits 0 on clean content', async () => {
  const root = await repoWith('---\nname: thing\ndescription: "ok"\n---\n# Thing\n');
  const res = spawnSync('node', ['scripts/lint.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
});

test('lint exits 1 on a missing name', async () => {
  const root = await repoWith('---\ndescription: "ok"\n---\n# Thing\n');
  const res = spawnSync('node', ['scripts/lint.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 1);
  assert.match(res.stderr + res.stdout, /missing name/);
});
