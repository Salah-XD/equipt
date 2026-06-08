# @equipt/cli — Design Spec

**Date:** 2026-06-08
**Status:** Approved design, pre-implementation
**Topic:** A CLI that installs curated Equipt skills & agents into a project's Claude Code setup.

---

## 1. Context

Phase-2 distribution channel for Equipt. The user owns the scoped npm name **`@equipt`**, so the CLI ships as **`@equipt/cli`** (bin `equipt`). It installs the **curated, scored** Equipt assets into a project — aligned with the verified-marketplace direction (you install *vetted* things from Equipt, not arbitrary repos).

The marketplace's native install is Claude Code's `/plugin marketplace add` + `/plugin install`. The CLI's distinct value is **granular, file-level install into `.claude/`** (a single skill or a whole plugin) that works without the plugin system and is the foundation for future cross-surface adapters.

## 2. Goals

- Three commands: **`init`**, **`add <plugin|name>`**, **`list`**.
- Install into Claude Code **project-level** `./.claude/skills/<name>/SKILL.md` and `./.claude/agents/<name>.md`, with a `--global` flag for `~/.claude/`.
- **Equipt-only** (resolve against the curated catalog).
- **Works locally today** (`--from <path>`, or auto-detect when run inside the repo) and **via GitHub once the repo is public** (tarball).
- Minimal footprint: Node 22 ESM, no build step, `node:util parseArgs` for args, a single runtime dep (`tar`).

## 3. Non-goals (later)

- Any-repo install (`<owner>/<repo>`), `remove` / `update`, multi-surface adapters (Cursor/Codex), interactive prompts, automated npm publishing.

## 4. Commands

### 4.1 `equipt init`
Creates `./.claude/skills/` and `./.claude/agents/` if absent, and writes **`./.claude/equipt.json`** if absent (the install manifest, §7). Idempotent — re-running never clobbers existing content. `--global` targets `~/.claude/`. Prints what it created.

### 4.2 `equipt add <target>`
Resolves `<target>` against the catalog (§6):
- A **plugin name** (e.g. `equipt-engineering`) → installs every skill + agent in that plugin.
- An **asset name** (e.g. `code-reviewer`) → installs that single asset. Ambiguous/duplicate names are disambiguated by listing the matches (`<plugin>/<name>`).
Auto-runs `init`'s directory/manifest setup if `.claude/` is missing. Copies files into the target, records each install in `equipt.json`. Flags: `--global`, `--force` (overwrite existing files; default skips with a notice), `--from <path>` (local source). Prints a per-asset summary and a total.

### 4.3 `equipt list`
Prints the catalog grouped by plugin: each asset's `kind`, `name`, and **Readiness + tier** (when `scores/` is present in the source). Supports `--plugin <name>` to scope and `--from <path>`. Read-only.

### 4.4 Global behavior
- `equipt` / `equipt --help` → usage; `equipt --version` → version. Unknown command → usage + exit 1.
- Exit codes: `0` success, `1` user error (bad target, file conflict without `--force`), `2` source/network error.

## 5. Source resolution (`src/lib/source.mjs`)

`resolveSource({ from }) -> { dir, cleanup }`. A **source dir** is any directory containing `plugins/` (and optionally `scores/`, `plugins.config.json`).
- **Local:** if `--from <path>` given, use it; else walk up from `cwd` to find a dir containing `plugins.config.json` (so running inside the repo works). `cleanup` is a no-op.
- **Remote (default when no local found):** download `https://codeload.github.com/Salah-XD/equipt/tar.gz/refs/heads/main` to a temp file, extract with `tar` into an OS cache dir keyed by ref, return the extracted repo dir. `cleanup` leaves the cache (reused next run).
- **Errors:** a 404 (private/unknown repo) or network failure throws a typed `SourceError` whose message tells the user the repo may be private and to pass `--from <path>`. (Exit 2.)

## 6. Catalog (`src/lib/catalog.mjs`)

`loadCatalog(sourceDir) -> { plugins: string[], assets: Asset[] }` where
`Asset = { plugin, name, kind: 'skill'|'agent', path, readiness?: number, tier?: string }`.
- Reads `plugins.config.json` for the plugin list; walks `plugins/<plugin>/skills/*/SKILL.md` and `plugins/<plugin>/agents/*.md` (skipping `README.md`) to build `assets` (frontmatter `name` via a tiny gray-matter-free parse, or fall back to the folder/file name).
- If `sourceDir/scores/index.json` exists, joins `readiness`/`tier` by `plugin/name`.
- `resolveTarget(catalog, query) -> { kind: 'plugin'|'asset'|'ambiguous'|'none', matches }` powers `add`.

## 7. Install + manifest

`installAsset(asset, sourceDir, { targetDir, force }) -> { status: 'installed'|'skipped'|'overwritten', dest }`:
- skill → copy the asset's folder to `<targetDir>/skills/<name>/` (preserve `SKILL.md` + any sibling files).
- agent → copy the `.md` to `<targetDir>/agents/<name>.md`.
- existing dest + no `--force` → `skipped`.

`manifest.mjs`: `readManifest(targetDir)` / `writeManifest(targetDir, m)`. **`equipt.json`** shape:
```jsonc
{
  "source": "Salah-XD/equipt",
  "installed": {
    "code-reviewer": { "plugin": "equipt-engineering", "kind": "agent", "addedAt": "<ISO>" }
  }
}
```
`paths.mjs`: `resolveTargetDir({ global }) -> <cwd>/.claude` or `<home>/.claude`.

## 8. Error handling

- **Unknown target:** print `no plugin or asset named "<x>"` + a hint to run `equipt list`; exit 1.
- **Ambiguous name:** list `<plugin>/<name>` matches and ask the user to qualify; exit 1.
- **File exists (no `--force`):** report `skipped (exists)`; continue other assets; exit 0.
- **Source/network (incl. private-repo 404):** the `SourceError` guidance message; exit 2.
- Never partially corrupt the manifest — write it once at the end of a successful `add`.

## 9. Testing

- **Fixture source:** `cli/test/fixtures/source/` — a tiny repo-shaped dir (`plugins.config.json`, one plugin with 1 skill + 1 agent, a `scores/index.json`). All command tests run with `--from` this fixture → **no network**.
- **Unit:** catalog parse/resolve, manifest read/write, target-path resolution, `installAsset` copy semantics (incl. skip vs force) into a temp dir.
- **End-to-end (`--from` fixture):** `init` creates dirs+manifest; `add <plugin>` installs both assets + records them; `add <name>` installs one; `add` twice skips; `--force` overwrites; `list` prints assets with Readiness.
- The remote tarball path is exercised by a small unit with `tar` against a local `.tar.gz` fixture (no GitHub call); the GitHub fetch itself is not unit-tested.
- Runner: `node --test` from `cli/` (own `package.json` `test` script). Not wired into the root marketplace test glob.

## 10. Layout

```
cli/
  package.json            # @equipt/cli, "type":"module", bin {equipt: bin/equipt.mjs}, deps: tar; engines node>=22
  README.md
  bin/equipt.mjs          # #!/usr/bin/env node — imports src/cli.mjs run()
  src/
    cli.mjs               # parseArgs → dispatch to a command; --help/--version
    commands/{init,add,list}.mjs
    lib/{source,catalog,install,manifest,paths,log}.mjs
  test/
    fixtures/source/...    # repo-shaped fixture
    *.test.mjs
```

## 11. Distribution & the public-repo caveat

- `cli/` is a standalone package (like `sdk-starters/`), **not** part of the marketplace `build`/`lint`/`test`. Published manually later as `@equipt/cli`.
- **Until `Salah-XD/equipt` is public, the default remote source 404s.** `add`/`list` then instruct the user to pass `--from <path>`. The local path is fully functional today, so the CLI is build- and test-complete now; the GitHub path "just works" the day the repo goes public (no code change).

## 12. Open questions (resolve in planning)

- Cache location for the extracted tarball (`os.tmpdir()` vs a stable XDG cache dir) and whether to verify freshness per run — start with `os.tmpdir()/equipt-cli/<ref>/`.
- Whether `list` Readiness output should be opt-in (`--scores`) to keep default output terse — default to showing it when `scores/` exists.
