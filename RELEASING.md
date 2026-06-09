# Releasing Equipt

Equipt has **two independent release tracks**, each fired by pushing a **git tag**.
They're separate on purpose — the content marketplace and the CLI version ship
independently — but we keep their version numbers **in sync**.

## The version lives in two files — keep them equal

| File | Versions… | Shipped by tag |
|------|-----------|----------------|
| `package.json` (root) | the repo / skills marketplace | `v<x.y.z>` |
| `cli/package.json` | the `@equipt/cli` npm package | `cli-v<x.y.z>` |

Bump **both** to the same number in the same commit.

## Cut a full release (version `X.Y.Z`)

1. Bump both versions:
   - `package.json` → `"version": "X.Y.Z"`
   - `cli/package.json` → `"version": "X.Y.Z"`
2. Commit: `git commit -am "chore: release vX.Y.Z"`
3. Push `main`: `git push origin main`
4. Tag and push **both** tags:
   ```bash
   git tag vX.Y.Z     && git push origin vX.Y.Z        # → GitHub Release + skill zips
   git tag cli-vX.Y.Z && git push origin cli-vX.Y.Z    # → npm publish @equipt/cli
   ```

> Only the CLI changed? Push just `cli-vX.Y.Z`. Only content changed? Push just
> `vX.Y.Z`. Either way, keep the two `package.json` versions equal.

## What each tag does

**`v*` → `.github/workflows/release.yml`**
- Runs `npm test`, `npm run lint`, `npm run build:check`; verifies the CLI tests and the site build.
- Builds **three** sets of zips:
  - `dist/plugins/<plugin>.zip` — the whole plugin, **flat** (`.claude-plugin/plugin.json` + `skills/` + `agents/` at the zip **root**, no wrapper folder). This is claude.ai/desktop's **Customize → Personal plugins (+) → Create plugin → Upload plugin** path — installs every skill in the plugin at once (paid plans; the plugin also installs its agents, which activate in Cowork & Claude Code — greyed out in normal claude.ai chat).
  - `dist/skills/<name>.zip` — one per skill, **wrapped** in a `<name>/` folder. claude.ai/desktop's **Customize → Skills (+) → Create skill → Upload a skill** path (one skill per upload; works on Free).
  - `dist/<plugin>-skills.zip` — the 5 category bundles (`skills/<name>/…`). For unzipping into Claude Code's `~/.claude/`; not uploadable to claude.ai as-is.
- Note the **opposite zip shapes**: a *plugin* zip has its manifest at the root; a *skill* zip is wrapped in one named folder. Don't swap them — claude.ai validates each.
- Publishes a **GitHub Release** with all of those zips.
- **Does not touch npm.**

**`cli-v*` → `.github/workflows/cli-publish.yml`**
- Runs the CLI tests, then `npm publish --access public` from `cli/`.
- Requires the **`NPM_TOKEN`** repo secret (an npm automation token for the `@equipt` org).
- This is the **only** thing that publishes to npm.

## Gotchas

- A tag points at a commit — **bump + commit before tagging**, or the release ships the old version.
- A `v*` tag will **not** update npm; a `cli-v*` tag will **not** create a GitHub Release. Push **both** for a full release.
- npm publishing is independent of GitHub repo visibility — the CLI publishes whether the repo is public or private.
