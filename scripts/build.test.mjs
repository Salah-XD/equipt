import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));

async function repo() {
  const root = await mkdtemp(join(tmpdir(), 'equipt-build-'));
  await mkdir(join(root, 'scripts', 'lib'), { recursive: true });
  await cp(join(HERE, 'build.mjs'), join(root, 'scripts', 'build.mjs'));
  await cp(join(HERE, 'lib'), join(root, 'scripts', 'lib'), { recursive: true });
  await cp(join(HERE, '..', 'node_modules'), join(root, 'node_modules'), { recursive: true });
  await writeFile(join(root, 'plugins.config.json'), JSON.stringify({
    marketplace: { name: 'equipt', owner: 'equipt' },
    plugins: { 'equipt-data': { description: 'Data.', skills: ['Analytics & Data'], agents: [] } },
  }));
  const dir = join(root, 'plugins', 'equipt-data', 'skills', 'sql-helper');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'SKILL.md'), '---\nname: sql-helper\ndescription: "SQL."\n---\n# SQL\n');
  return root;
}

test('build writes marketplace.json, plugin.json, directory.md', async () => {
  const root = await repo();
  const res = spawnSync('node', ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const market = JSON.parse(await readFile(join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.equal(market.plugins[0].name, 'equipt-data');
  const manifest = JSON.parse(await readFile(join(root, 'plugins', 'equipt-data', '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.version, '0.1.0');
  assert.match(await readFile(join(root, 'docs', 'directory.md'), 'utf8'), /sql-helper/);
});

test('build --check exits 1 when outputs are stale', async () => {
  const root = await repo();
  const res = spawnSync('node', ['scripts/build.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /drift/);
});

test('build injects the plugin table between README markers', async () => {
  const root = await repo();
  await writeFile(join(root, 'README.md'),
    '# Equipt\n\n<!-- PLUGINS:START -->\nplaceholder\n<!-- PLUGINS:END -->\n\ntail\n');
  const res = spawnSync('node', ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const readme = await readFile(join(root, 'README.md'), 'utf8');
  assert.match(readme, /<!-- PLUGINS:START -->\n- `equipt-data` — Data\.\n<!-- PLUGINS:END -->/);
  assert.doesNotMatch(readme, /placeholder/);
  assert.match(readme, /tail/);
});

test('build exits 1 when README exists but markers are missing', async () => {
  const root = await repo();
  await writeFile(join(root, 'README.md'), '# Equipt\n\nno markers here\n');
  const res = spawnSync('node', ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /missing the .* markers/);
});
