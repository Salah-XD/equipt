# @equipt/cli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `@equipt/cli` (bin `equipt`) that installs curated Equipt skills & agents into a project's `.claude/`, with `init`, `add`, and `list` commands.

**Architecture:** A new self-contained `cli/` package (Node 22 ESM, no build step). A **source** module resolves a repo-shaped directory (local `--from` / auto-detected, or a GitHub tarball). A **catalog** module reads `plugins/` + `scores/` from that dir. **install** copies asset files into `.claude/`, **manifest** records them in `equipt.json`. Thin command modules return data; `cli.mjs` parses args (`node:util parseArgs`) and prints. Everything is testable against a committed local fixture — no network.

**Tech Stack:** Node 22 ESM, `node --test` + `node:assert/strict`, `node:util parseArgs`, one runtime dep `tar`.

**Spec:** `docs/superpowers/specs/2026-06-08-equipt-cli-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `cli/package.json` | `@equipt/cli`, `bin.equipt`, `type: module`, dep `tar`, `test` script |
| `cli/test/fixtures/source/**` | repo-shaped fixture (1 plugin, 1 skill, 1 agent, scores/index.json) |
| `cli/src/lib/paths.mjs` | `resolveTargetDir({global, cwd})` → `.claude` dir |
| `cli/src/lib/manifest.mjs` | `defaultManifest`, `readManifest`, `writeManifest` (equipt.json) |
| `cli/src/lib/catalog.mjs` | `loadCatalog(dir)`, `resolveTarget(catalog, query)` |
| `cli/src/lib/install.mjs` | `installAsset(asset, {targetDir, force})` (copy) |
| `cli/src/lib/source.mjs` | `findLocalSource`, `extractTarball`, `resolveSource`, `SourceError` |
| `cli/src/commands/init.mjs` | `init({global, cwd})` |
| `cli/src/commands/add.mjs` | `add(query, {global, force, from, cwd})` |
| `cli/src/commands/list.mjs` | `list({plugin, from, cwd})` |
| `cli/src/cli.mjs` | `run(argv)` — parseArgs → dispatch → print → exit code |
| `cli/bin/equipt.mjs` | `#!/usr/bin/env node` entry |
| `cli/README.md` | usage |

**Shared shapes (use these exact names):**
```js
// Asset: { plugin, name, kind: 'skill'|'agent', src, readiness?, tier? }
//   src = absolute path: a folder for skills, a .md file for agents
// Catalog: { plugins: string[], assets: Asset[] }
// resolveTarget(...) -> { kind: 'plugin'|'asset'|'ambiguous'|'none', matches: Asset[] | string[] }
// Manifest: { source: string, installed: Record<name, {plugin, kind, addedAt}> }
```

---

### Task 0: Package scaffold + fixture

**Files:** Create `cli/package.json`, `cli/test/fixtures/source/plugins.config.json`, `cli/test/fixtures/source/plugins/demo-plugin/skills/demo-skill/SKILL.md`, `cli/test/fixtures/source/plugins/demo-plugin/agents/demo-agent.md`, `cli/test/fixtures/source/scores/index.json`

- [ ] **Step 1: Create `cli/package.json`**
```json
{
  "name": "@equipt/cli",
  "version": "0.1.0",
  "description": "Install curated Equipt skills & agents into your project.",
  "type": "module",
  "bin": { "equipt": "./bin/equipt.mjs" },
  "engines": { "node": ">=22" },
  "files": ["bin", "src", "README.md"],
  "scripts": { "test": "node --test \"test/**/*.test.mjs\"" },
  "dependencies": { "tar": "^7.4.3" },
  "license": "MIT"
}
```

- [ ] **Step 2: Create the fixture files**

`cli/test/fixtures/source/plugins.config.json`:
```json
{ "plugins": { "demo-plugin": { "description": "Demo plugin for tests." } } }
```
`cli/test/fixtures/source/plugins/demo-plugin/skills/demo-skill/SKILL.md`:
```markdown
---
name: demo-skill
description: A demo skill for tests.
---
# Demo Skill

Body content.
```
`cli/test/fixtures/source/plugins/demo-plugin/agents/demo-agent.md`:
```markdown
---
name: demo-agent
description: A demo agent for tests.
tools: Read, Grep
---
# Demo Agent

Body content.
```
`cli/test/fixtures/source/scores/index.json`:
```json
{ "standardVersion": "1.1.0", "count": 2, "assets": [
  { "plugin": "demo-plugin", "name": "demo-skill", "kind": "skill", "readiness": 90, "tier": "certified", "unsafe": false, "partial": false },
  { "plugin": "demo-plugin", "name": "demo-agent", "kind": "agent", "readiness": 85, "tier": "provisional", "unsafe": false, "partial": false }
] }
```

- [ ] **Step 3: Install deps**

Run: `cd cli && npm install`
Expected: installs `tar`, creates `cli/package-lock.json`, exit 0.

- [ ] **Step 4: Commit**
```bash
git add cli/package.json cli/package-lock.json cli/test/fixtures
git commit -m "chore(cli): scaffold @equipt/cli package + test fixture"
```

---

### Task 1: paths.mjs

**Files:** Create `cli/src/lib/paths.mjs`, `cli/test/paths.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/paths.test.mjs`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { resolveTargetDir } from '../src/lib/paths.mjs';

test('project target is <cwd>/.claude', () => {
  assert.equal(resolveTargetDir({ cwd: '/proj' }), join('/proj', '.claude'));
});

test('global target is <home>/.claude', () => {
  assert.equal(resolveTargetDir({ global: true, cwd: '/proj' }), join(homedir(), '.claude'));
});
```

- [ ] **Step 2: Run — expect FAIL** `node --test cli/test/paths.test.mjs` → "Cannot find module".

- [ ] **Step 3: Implement** — `cli/src/lib/paths.mjs`
```js
import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveTargetDir({ global = false, cwd = process.cwd() } = {}) {
  return global ? join(homedir(), '.claude') : join(cwd, '.claude');
}
```

- [ ] **Step 4: Run — expect PASS** `node --test cli/test/paths.test.mjs` → 2 pass.

- [ ] **Step 5: Commit**
```bash
git add cli/src/lib/paths.mjs cli/test/paths.test.mjs
git commit -m "feat(cli): resolveTargetDir (.claude path)"
```

---

### Task 2: manifest.mjs

**Files:** Create `cli/src/lib/manifest.mjs`, `cli/test/manifest.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/manifest.test.mjs`
```js
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
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/lib/manifest.mjs`
```js
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = 'Salah-XD/equipt';

export function defaultManifest() {
  return { source: SOURCE, installed: {} };
}

export async function readManifest(targetDir) {
  try {
    const m = JSON.parse(await readFile(join(targetDir, 'equipt.json'), 'utf8'));
    return { source: m.source ?? SOURCE, installed: m.installed ?? {} };
  } catch (err) {
    if (err.code === 'ENOENT') return defaultManifest();
    throw err;
  }
}

export async function writeManifest(targetDir, manifest) {
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, 'equipt.json'), JSON.stringify(manifest, null, 2) + '\n');
}
```

- [ ] **Step 4: Run — expect PASS** (2).

- [ ] **Step 5: Commit**
```bash
git add cli/src/lib/manifest.mjs cli/test/manifest.test.mjs
git commit -m "feat(cli): equipt.json manifest read/write"
```

---

### Task 3: catalog.mjs

**Files:** Create `cli/src/lib/catalog.mjs`, `cli/test/catalog.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/catalog.test.mjs`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, resolveTarget } from '../src/lib/catalog.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');

test('loadCatalog reads plugins + assets + scores', async () => {
  const cat = await loadCatalog(FIX);
  assert.deepEqual(cat.plugins, ['demo-plugin']);
  assert.equal(cat.assets.length, 2);
  const skill = cat.assets.find((a) => a.name === 'demo-skill');
  assert.equal(skill.kind, 'skill');
  assert.equal(skill.readiness, 90);
  assert.equal(skill.tier, 'certified');
  assert.ok(skill.src.endsWith(join('skills', 'demo-skill')));
  const agent = cat.assets.find((a) => a.name === 'demo-agent');
  assert.equal(agent.kind, 'agent');
  assert.ok(agent.src.endsWith('demo-agent.md'));
});

test('resolveTarget: plugin / asset / ambiguous-as-qualified / none', async () => {
  const cat = await loadCatalog(FIX);
  assert.equal(resolveTarget(cat, 'demo-plugin').kind, 'plugin');
  assert.equal(resolveTarget(cat, 'demo-plugin').matches.length, 2);
  assert.equal(resolveTarget(cat, 'demo-skill').kind, 'asset');
  assert.equal(resolveTarget(cat, 'demo-plugin/demo-agent').kind, 'asset');
  assert.equal(resolveTarget(cat, 'nope').kind, 'none');
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/lib/catalog.mjs`
```js
import { readdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function nameFromFrontmatter(file, fallback) {
  try {
    const fm = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fm) {
      const nm = fm[1].match(/^name:\s*["']?(.+?)["']?\s*$/m);
      if (nm) return nm[1].trim();
    }
  } catch {}
  return fallback;
}

async function safeReaddir(dir) {
  try { return await readdir(dir, { withFileTypes: true }); }
  catch (err) { if (err.code === 'ENOENT') return []; throw err; }
}

export async function loadCatalog(sourceDir) {
  const pluginsDir = join(sourceDir, 'plugins');
  let plugins = [];
  try {
    const cfg = JSON.parse(await readFile(join(sourceDir, 'plugins.config.json'), 'utf8'));
    plugins = Object.keys(cfg.plugins ?? {});
  } catch {
    plugins = (await safeReaddir(pluginsDir)).filter((e) => e.isDirectory()).map((e) => e.name);
  }

  const assets = [];
  for (const plugin of plugins) {
    const skillsBase = join(pluginsDir, plugin, 'skills');
    for (const e of await safeReaddir(skillsBase)) {
      if (!e.isDirectory()) continue;
      const src = join(skillsBase, e.name);
      assets.push({ plugin, name: nameFromFrontmatter(join(src, 'SKILL.md'), e.name), kind: 'skill', src });
    }
    const agentsBase = join(pluginsDir, plugin, 'agents');
    for (const e of await safeReaddir(agentsBase)) {
      if (!e.isFile() || !e.name.endsWith('.md') || e.name === 'README.md') continue;
      const src = join(agentsBase, e.name);
      assets.push({ plugin, name: nameFromFrontmatter(src, e.name.replace(/\.md$/, '')), kind: 'agent', src });
    }
  }

  try {
    const idx = JSON.parse(await readFile(join(sourceDir, 'scores', 'index.json'), 'utf8'));
    const byKey = new Map(idx.assets.map((a) => [`${a.plugin}/${a.name}`, a]));
    for (const a of assets) {
      const s = byKey.get(`${a.plugin}/${a.name}`);
      if (s) { a.readiness = s.readiness; a.tier = s.tier; }
    }
  } catch {}

  return { plugins, assets };
}

export function resolveTarget(catalog, query) {
  if (query.includes('/')) {
    const [p, n] = query.split('/');
    const m = catalog.assets.filter((a) => a.plugin === p && a.name === n);
    return m.length ? { kind: 'asset', matches: m } : { kind: 'none', matches: [] };
  }
  if (catalog.plugins.includes(query)) {
    return { kind: 'plugin', matches: catalog.assets.filter((a) => a.plugin === query) };
  }
  const named = catalog.assets.filter((a) => a.name === query);
  if (named.length === 1) return { kind: 'asset', matches: named };
  if (named.length > 1) return { kind: 'ambiguous', matches: named.map((a) => `${a.plugin}/${a.name}`) };
  return { kind: 'none', matches: [] };
}
```

- [ ] **Step 4: Run — expect PASS** (2).

- [ ] **Step 5: Commit**
```bash
git add cli/src/lib/catalog.mjs cli/test/catalog.test.mjs
git commit -m "feat(cli): catalog loader + target resolver"
```

---

### Task 4: install.mjs

**Files:** Create `cli/src/lib/install.mjs`, `cli/test/install.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/install.test.mjs`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
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
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/lib/install.mjs`
```js
import { cp, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

async function exists(p) { try { await access(p); return true; } catch { return false; } }

export async function installAsset(asset, { targetDir, force = false }) {
  const parent = join(targetDir, asset.kind === 'skill' ? 'skills' : 'agents');
  const dest = asset.kind === 'skill' ? join(parent, asset.name) : join(parent, `${asset.name}.md`);

  const already = await exists(dest);
  if (already && !force) return { status: 'skipped', dest };

  await mkdir(parent, { recursive: true });
  await cp(asset.src, dest, { recursive: true, force: true });
  return { status: already ? 'overwritten' : 'installed', dest };
}
```

- [ ] **Step 4: Run — expect PASS** (2).

- [ ] **Step 5: Commit**
```bash
git add cli/src/lib/install.mjs cli/test/install.test.mjs
git commit -m "feat(cli): installAsset (copy skill folder / agent file)"
```

---

### Task 5: source.mjs

**Files:** Create `cli/src/lib/source.mjs`, `cli/test/source.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/source.test.mjs`
```js
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
  await c({ gzip: true, file: tgz, cwd: FIXES }, ['source']); // top-level "source/"
  const out = join(t, 'out');
  await extractTarball(tgz, out);
  assert.ok(await exists(join(out, 'plugins.config.json')));
  await rm(t, { recursive: true, force: true });
});

test('resolveSource honors --from and auto-detects local', async () => {
  assert.equal((await resolveSource({ from: FIX })).dir, FIX);
  assert.equal((await resolveSource({ cwd: join(FIX, 'plugins') })).dir, FIX);
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/lib/source.mjs`
```js
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { x } from 'tar';

export class SourceError extends Error {}

export function findLocalSource(cwd) {
  let dir = cwd;
  for (let i = 0; i < 12; i++) {
    try { readFileSync(join(dir, 'plugins.config.json')); return dir; } catch {}
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function extractTarball(tgzPath, destDir) {
  await mkdir(destDir, { recursive: true });
  await x({ file: tgzPath, cwd: destDir, strip: 1 });
  return destDir;
}

async function defaultDownload(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function resolveSource({ from, cwd = process.cwd(), ref = 'main', download = defaultDownload } = {}) {
  if (from) return { dir: from, cleanup: async () => {} };
  const local = findLocalSource(cwd);
  if (local) return { dir: local, cleanup: async () => {} };

  const url = `https://codeload.github.com/Salah-XD/equipt/tar.gz/refs/heads/${ref}`;
  let buf;
  try { buf = await download(url); }
  catch (err) {
    throw new SourceError(
      `Could not download Equipt from GitHub (${err.message}). The repo may be private — pass --from <path> to a local checkout.`,
    );
  }
  const tgz = join(tmpdir(), `equipt-${ref}.tgz`);
  await mkdir(dirname(tgz), { recursive: true });
  await writeFile(tgz, buf);
  const dir = join(tmpdir(), 'equipt-cli', ref);
  await extractTarball(tgz, dir);
  return { dir, cleanup: async () => {} };
}
```

- [ ] **Step 4: Run — expect PASS** (3).

- [ ] **Step 5: Commit**
```bash
git add cli/src/lib/source.mjs cli/test/source.test.mjs
git commit -m "feat(cli): source resolution (local + GitHub tarball)"
```

---

### Task 6: commands/init.mjs

**Files:** Create `cli/src/commands/init.mjs`, `cli/test/init.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/init.test.mjs`
```js
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
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/commands/init.mjs`
```js
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveTargetDir } from '../lib/paths.mjs';
import { readManifest, writeManifest } from '../lib/manifest.mjs';

export async function init({ global = false, cwd = process.cwd() } = {}) {
  const targetDir = resolveTargetDir({ global, cwd });
  await mkdir(join(targetDir, 'skills'), { recursive: true });
  await mkdir(join(targetDir, 'agents'), { recursive: true });
  await writeManifest(targetDir, await readManifest(targetDir));
  return { targetDir };
}
```

- [ ] **Step 4: Run — expect PASS** (1).

- [ ] **Step 5: Commit**
```bash
git add cli/src/commands/init.mjs cli/test/init.test.mjs
git commit -m "feat(cli): init command"
```

---

### Task 7: commands/add.mjs

**Files:** Create `cli/src/commands/add.mjs`, `cli/test/add.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/add.test.mjs`
```js
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
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/commands/add.mjs`
```js
import { resolveSource } from '../lib/source.mjs';
import { loadCatalog, resolveTarget } from '../lib/catalog.mjs';
import { resolveTargetDir } from '../lib/paths.mjs';
import { installAsset } from '../lib/install.mjs';
import { readManifest, writeManifest } from '../lib/manifest.mjs';

export async function add(query, { global = false, force = false, from, cwd = process.cwd() } = {}) {
  if (!query) return { error: 'usage: equipt add <plugin|name>' };

  const { dir } = await resolveSource({ from, cwd });
  const catalog = await loadCatalog(dir);
  const r = resolveTarget(catalog, query);

  if (r.kind === 'none') return { error: `no plugin or asset named "${query}". Try: equipt list` };
  if (r.kind === 'ambiguous') return { error: `"${query}" is ambiguous: ${r.matches.join(', ')}. Qualify as <plugin>/<name>.` };

  const targetDir = resolveTargetDir({ global, cwd });
  const manifest = await readManifest(targetDir);
  const results = [];
  for (const asset of r.matches) {
    const res = await installAsset(asset, { targetDir, force });
    if (res.status !== 'skipped') {
      manifest.installed[asset.name] = { plugin: asset.plugin, kind: asset.kind, addedAt: new Date().toISOString() };
    }
    results.push({ name: asset.name, kind: asset.kind, status: res.status });
  }
  await writeManifest(targetDir, manifest);
  return { targetDir, results };
}
```

- [ ] **Step 4: Run — expect PASS** (3).

- [ ] **Step 5: Commit**
```bash
git add cli/src/commands/add.mjs cli/test/add.test.mjs
git commit -m "feat(cli): add command (plugin + single asset, manifest, skip/force)"
```

---

### Task 8: commands/list.mjs

**Files:** Create `cli/src/commands/list.mjs`, `cli/test/list.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/list.test.mjs`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { list } from '../src/commands/list.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');

test('list returns assets with readiness', async () => {
  const out = await list({ from: FIX });
  assert.deepEqual(out.plugins, ['demo-plugin']);
  assert.equal(out.assets.length, 2);
  assert.equal(out.assets.find((a) => a.name === 'demo-skill').readiness, 90);
});

test('list --plugin scopes results', async () => {
  const out = await list({ from: FIX, plugin: 'demo-plugin' });
  assert.ok(out.assets.every((a) => a.plugin === 'demo-plugin'));
  const empty = await list({ from: FIX, plugin: 'missing' });
  assert.equal(empty.assets.length, 0);
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/commands/list.mjs`
```js
import { resolveSource } from '../lib/source.mjs';
import { loadCatalog } from '../lib/catalog.mjs';

export async function list({ plugin, from, cwd = process.cwd() } = {}) {
  const { dir } = await resolveSource({ from, cwd });
  const catalog = await loadCatalog(dir);
  const assets = plugin ? catalog.assets.filter((a) => a.plugin === plugin) : catalog.assets;
  return { plugins: catalog.plugins, assets };
}
```

- [ ] **Step 4: Run — expect PASS** (2).

- [ ] **Step 5: Commit**
```bash
git add cli/src/commands/list.mjs cli/test/list.test.mjs
git commit -m "feat(cli): list command"
```

---

### Task 9: cli.mjs + bin/equipt.mjs

**Files:** Create `cli/src/cli.mjs`, `cli/bin/equipt.mjs`, `cli/test/cli.test.mjs`

- [ ] **Step 1: Write the failing test** — `cli/test/cli.test.mjs`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');

test('exit codes: help=0, no-cmd=1, unknown=1, list=0, version=0', async () => {
  assert.equal(await run(['--help']), 0);
  assert.equal(await run([]), 1);
  assert.equal(await run(['bogus']), 1);
  assert.equal(await run(['list', '--from', FIX]), 0);
  assert.equal(await run(['--version']), 0);
});

test('add with unknown target exits 1', async () => {
  assert.equal(await run(['add', 'nope', '--from', FIX]), 1);
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** — `cli/src/cli.mjs`
```js
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { init } from './commands/init.mjs';
import { add } from './commands/add.mjs';
import { list } from './commands/list.mjs';
import { SourceError } from './lib/source.mjs';

const HELP = `equipt — install curated Equipt skills & agents

Usage:
  equipt init                 scaffold ./.claude + equipt.json
  equipt add <plugin|name>    install a plugin or a single asset
  equipt list                 list available assets (+ Readiness)

Options:
  --global      target ~/.claude instead of ./.claude
  --force       overwrite existing files (add)
  --from <p>    use a local Equipt checkout instead of GitHub
  --plugin <p>  scope list to a plugin
  --help, --version`;

async function pkgVersion() {
  const f = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
  return JSON.parse(await readFile(f, 'utf8')).version;
}

export async function run(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv, allowPositionals: true,
      options: {
        global: { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
        from: { type: 'string' },
        plugin: { type: 'string' },
        help: { type: 'boolean', default: false },
        version: { type: 'boolean', default: false },
      },
    });
  } catch (err) { console.error(err.message); return 1; }

  const { values, positionals } = parsed;
  if (values.version) { console.log(await pkgVersion()); return 0; }
  if (values.help) { console.log(HELP); return 0; }
  const cmd = positionals[0];
  if (!cmd) { console.log(HELP); return 1; }

  try {
    if (cmd === 'init') {
      const { targetDir } = await init({ global: values.global });
      console.log(`Initialized Equipt in ${targetDir}`);
      return 0;
    }
    if (cmd === 'add') {
      const out = await add(positionals[1], { global: values.global, force: values.force, from: values.from });
      if (out.error) { console.error(out.error); return 1; }
      for (const r of out.results) console.log(`  ${r.status.padEnd(11)} ${r.kind} ${r.name}`);
      console.log(`Done → ${out.targetDir}`);
      return 0;
    }
    if (cmd === 'list') {
      const out = await list({ plugin: values.plugin, from: values.from });
      for (const a of out.assets) {
        const score = a.readiness != null ? `  [R${a.readiness}${a.tier ? ' ' + a.tier : ''}]` : '';
        console.log(`  ${a.kind.padEnd(5)} ${a.plugin}/${a.name}${score}`);
      }
      return 0;
    }
    console.error(`unknown command: ${cmd}`);
    console.log(HELP);
    return 1;
  } catch (err) {
    if (err instanceof SourceError) { console.error(err.message); return 2; }
    console.error(err.stack || String(err));
    return 1;
  }
}
```

- [ ] **Step 4: Create `cli/bin/equipt.mjs`**
```js
#!/usr/bin/env node
import { run } from '../src/cli.mjs';
run().then((code) => { process.exitCode = code ?? 0; });
```

- [ ] **Step 5: Run — expect PASS** `node --test cli/test/cli.test.mjs` (2).

- [ ] **Step 6: Smoke-run the bin against the fixture**

Run: `node cli/bin/equipt.mjs list --from cli/test/fixtures/source`
Expected: prints two lines (`skill demo-plugin/demo-skill  [R90 certified]`, `agent demo-plugin/demo-agent  [R85 provisional]`), exit 0.

- [ ] **Step 7: Commit**
```bash
git add cli/src/cli.mjs cli/bin/equipt.mjs cli/test/cli.test.mjs
git commit -m "feat(cli): arg dispatch + bin entry"
```

---

### Task 10: README + full suite

**Files:** Create `cli/README.md`

- [ ] **Step 1: Write `cli/README.md`**
```markdown
# @equipt/cli

Install curated [Equipt](https://github.com/Salah-XD/equipt) skills & agents into your project's `.claude/`.

```bash
npx @equipt/cli init                     # scaffold ./.claude + equipt.json
npx @equipt/cli add equipt-engineering   # install a whole plugin
npx @equipt/cli add code-reviewer        # install a single skill/agent
npx @equipt/cli list                     # browse the catalog (with Readiness)
```

Flags: `--global` (target `~/.claude`), `--force` (overwrite), `--from <path>` (use a local Equipt checkout), `--plugin <name>` (scope `list`).

> While the Equipt repo is private, the GitHub source is unavailable — pass `--from <path-to-equipt-checkout>` to install from a local clone.
```

- [ ] **Step 2: Run the full CLI suite**

Run: `cd cli && npm test`
Expected: all tests across `cli/test/*.test.mjs` pass (paths 2, manifest 2, catalog 2, install 2, source 3, init 1, add 3, list 2, cli 2 = 19), 0 fail.

- [ ] **Step 3: Commit**
```bash
git add cli/README.md
git commit -m "docs(cli): usage README"
```

---

## Out of scope (later)
Any-repo install (`<owner>/<repo>`), `remove`/`update` commands, multi-surface adapters (Cursor/Codex), interactive `init`, npm publish automation.

## Self-review notes
- **Spec coverage:** init/add/list (§4) → Tasks 6/7/8/9; source local+tarball (§5) → Task 5; catalog+resolve (§6) → Task 3; install+manifest (§7) → Tasks 4/2; paths (§7) → Task 1; error handling (§8) → add/cli tests; testing (§9) → fixture + per-module; layout (§10) → all; distribution (§11) → Task 0 package + README. ✓
- **No placeholders:** every step has complete runnable code. ✓
- **Type consistency:** `Asset {plugin,name,kind,src,readiness?,tier?}`, `resolveTarget → {kind,matches}`, `installAsset → {status,dest}`, `Manifest {source,installed}`, and `resolveSource → {dir,cleanup}` are identical across modules, tests, and commands. ✓
