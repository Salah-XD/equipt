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
- Builds the 5 per-plugin skill bundles `dist/<plugin>-skills.zip`.
- Publishes a **GitHub Release** with those zips (the claude.ai upload path + marketplace).
- **Does not touch npm.**

**`cli-v*` → `.github/workflows/cli-publish.yml`**
- Runs the CLI tests, then `npm publish --access public` from `cli/`.
- Requires the **`NPM_TOKEN`** repo secret (an npm automation token for the `@equipt` org).
- This is the **only** thing that publishes to npm.

## Gotchas

- A tag points at a commit — **bump + commit before tagging**, or the release ships the old version.
- A `v*` tag will **not** update npm; a `cli-v*` tag will **not** create a GitHub Release. Push **both** for a full release.
- npm publishing is independent of GitHub repo visibility — the CLI publishes whether the repo is public or private.
