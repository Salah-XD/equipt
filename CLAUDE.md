# Equipt — Project Guide

Context, architecture, and roadmap for this repository. Read this first when working on Equipt.

## What this is

**Equipt** is an open-source **Claude Code plugin marketplace**, evolving into a **curated, _verified_ marketplace** for skills & agents — the trust/curation play ("Glama for skills/agents") positioned against the popularity-ranked **skills.sh** (Vercel Labs). It ships a library of ready-to-use **skills** and **subagents** that equip Claude (and other AI coding surfaces) for real work across engineering, content, marketing, business, and data.

- **Tagline:** *Equip Claude with 600+ ready-to-use skills & agents.*
- **Library:** **501 skills + 106 agents = 607 assets** (+ 1 SDK starter), organized into **5 installable plugins**.
- **The Equipt Standard:** every asset is machine-scored on a **Readiness** scorecard (axes Craft / Fit / Guard / Proof / Upkeep, a Guard safety gate, and Provisional → Certified → Field-Ready tiers). See the **The Equipt Standard** section below. Spec: `docs/superpowers/specs/2026-06-08-equipt-standard-design.md`.
- **Install (once public):** `/plugin marketplace add Salah-XD/equipt`
- **Author / GitHub:** `Salah-XD` (personal account). The user **owns the scoped npm name `@equipt`** — the phase-2 CLI ships as **`@equipt/cli`** (bin `equipt`); NOT a GitHub org.
- **Licenses:** code **MIT** (`LICENSE`), content **CC-BY-4.0** (`LICENSE-CONTENT`).

## The five plugins

`plugins.config.json` is the **single source of truth** for grouping (which content categories / agent folders map to which plugin). Manifests are generated from it — never hand-edit generated files.

| Plugin | Skills | Agents | Focus |
|---|---:|---:|---|
| `equipt-engineering` | 4 | 15 | Dev subagents: review, debug, test, refactor, security, API/schema |
| `equipt-content` | 76 | 12 | Writing: blog, copy, email, scripts, courses |
| `equipt-marketing` | 200 | 11 | Ads, SEO, social, email, sales funnels, growth, branding |
| `equipt-business` | 199 | 56 | Finance, ops, HR, legal, client, e-commerce, events |
| `equipt-data` | 22 | 12 | SQL, dashboards, analytics narrative |

## Repository layout

```
plugins/<plugin>/skills/<name>/SKILL.md   # one skill = one folder + SKILL.md (frontmatter: name, description, …)
plugins/<plugin>/agents/<name>.md          # one subagent = one markdown file (frontmatter: name, description, tools)
plugins.config.json                        # SINGLE SOURCE OF TRUTH — category/agent → plugin mapping
.claude-plugin/marketplace.json            # GENERATED — marketplace manifest
plugins/<plugin>/.claude-plugin/plugin.json# GENERATED — per-plugin manifest
docs/directory.md                          # GENERATED — full asset directory
scripts/                                   # Node ESM tooling (see below)
sdk-starters/customer-research-agent/      # standalone Agent SDK starter (own package.json)
scoring/                                    # The Equipt Standard scorer (Node ESM; `npm run score`)
scoring/methodology.md                      # published standard (rendered at /standard on the site)
scores/<plugin>/<name>.json                 # GENERATED, committed — per-asset scorecards (+ scores/index.json)
curation.json                               # maintainer tier overrides; `{}` = none yet (machine = Provisional)
site/                                       # Astro 6 marketing site + live catalog (see below)
.github/workflows/{ci,release}.yml         # CI + tagged release
```

## Tooling & commands (run from repo root)

Node **ESM**, no build framework. **Requires Node 22** (see gotchas).

```bash
npm test            # node --test "scripts/**/*.test.mjs" "scoring/**/*.test.mjs" — marketplace + scorer unit tests (51)
npm run lint        # validate frontmatter + per-plugin name uniqueness
npm run build       # regenerate marketplace.json, plugin.json, docs/directory.md, README table
npm run build:check # build in --check mode: fails if generated files are stale (drift gate, used in CI)
npm run new-skill   # scaffold a new skill folder (default author: Salah-XD)
npm run score       # run the Equipt Standard scorer over all assets → scores/
```

`scripts/lib/` modules: `mapping` (config→plugin resolution), `frontmatter` (gray-matter parse), `discover` (walk `plugins/`), `validate` (uniqueness), `generate` (build manifests/dir/README), `lint`, `new-skill`. Each has a colocated `*.test.mjs`.

**Workflow for content changes:** add/edit files under `plugins/` → `npm run build` → commit both source and regenerated manifests. CI runs `lint` + `test` + `build:check`, so stale manifests fail the build.

**Releasing:** see `RELEASING.md`. Two tag-driven tracks: `v*` → `release.yml` (GitHub Release + skill zips, **not** npm) and `cli-v*` → `cli-publish.yml` (`npm publish @equipt/cli`). Keep `package.json` and `cli/package.json` versions **in sync**; push **both** tags for a full release. npm publishing is independent of repo visibility.

## The site (`site/`)

Astro 6 **static** site, **deployed to Vercel at `https://equipt-agent.vercel.app`** (Root Directory = `site/`, **not** GitHub Pages — user preference; auto-deploys on push to `main`).

- **What it builds (~616 pages):** marketing landing page + a **live searchable catalog** of all 607 assets (Fuse.js fuzzy search + plugin/kind facets) + **one static detail page per asset** + **one page per plugin** (`/catalog/<plugin>`) + a `/standard` methodology page. Data is read **at build time** from `plugins/` + `scores/` — no runtime backend.
- **Scorecards rendered:** detail pages show the full Equipt Standard scorecard in a sticky sidebar (+ install block + related); catalog/plugin cards show kind + Readiness. Site-wide nav lives in `Nav.astro` (rendered from `Base.astro`).
- **Data loaders:** `site/src/lib/catalog.ts` → `loadAssets()` resolves the repo root via `resolveRepoRoot()` (walks up from `cwd` to find `plugins/`; handles Vite SSR rewriting `import.meta.url` — this is what makes it work on Vercel). `site/src/lib/scores.ts` → `loadScoreIndex()` / `loadScorecard()` read `scores/`.
- **Design:** warm "hybrid" editorial/brutalist system — paper canvas, brutalist grid, Space Grotesk + Instrument Serif display, burnt-orange accent, first-class warm **dark mode** (no-flash inline bootstrap in `Base.astro`). Lenis + GSAP motion, reduced-motion safe. WCAG-AA tuned via `--accent-text` / darkened `--muted` tokens in `src/styles/tokens.css`. Aesthetic from the `awwwards-ui-skill` package.
- **Commands:** `cd site && npm install && npm run dev` / `npm run build` / `npm test` (Vitest).

## The Equipt Standard (`scoring/`)

The verification/scorecard layer — the moat. Node ESM, same conventions as `scripts/` (pure modules + colocated `*.test.mjs`).

- **Readiness (0–100)**, currently **v1.1.0 (4-axis)** = **Craft** 0.30, **Guard** 0.30, **Proof** 0.20, **Upkeep** 0.20. **Fit** is the deferred 5th axis (needs an LLM eval → v1.1; emitted `null`, shown as "coming", excluded from weighting so cards are **not** partial). **Guard is a gate** — a hard-fail or Guard < 40 caps Readiness at 40 and flags `unsafe`.
- **Tiers:** Provisional (machine) → Certified (human-reviewed, ≥70) → Field-Ready (≥85, Guard ≥70, Proof ≥60). Promotion needs a `curation.json` entry that still meets the numeric bar; partial/unsafe cards can't be promoted. `curation.json` is **seeded with 10 starter picks** (5 Field-Ready, 5 Certified across all plugins) — expand it.
- **Deterministic only (no API key):** Craft / Guard(static) / Proof / Upkeep are scored; **Fit + Guard-injection are LLM evals, deferred to v1.1** (need `ANTHROPIC_API_KEY`). Readiness spreads ~74–97; not partial.
- **Layout:** `scoring/analyzers/*` (pure axis scorers), `scoring/lib/{composite,schema,curation,load,git}.mjs`, `scoring/score.mjs` (orchestrator → writes `scores/`), `scoring/methodology.md`. Plan: `docs/superpowers/plans/2026-06-08-equipt-standard-scorer.md`.

## Conventions

- **Skills** carry `name` + `description` frontmatter; names must be unique **within a plugin**. A skill body usually opens with `# Title` — the site lifts that into the page `<h1>` so there's a single H1.
- **Agents** carry `name` + `description` + `tools`.
- **Brand:** the project is "Equipt" throughout. The original third-party brand it was rebranded from must appear **nowhere** in the repo.
- **Line endings:** `.gitattributes` enforces `* text=auto eol=lf` for cross-platform consistency.
- Never edit generated manifests by hand — change `plugins.config.json` or the source files and re-run `npm run build`.

## Gotchas / lessons learned

- **Node 22 is required.** `npm test` uses a glob in `node --test`, which needs Node 21+. CI/release pin `node-version: 22`.
- **Test script is scoped to `scripts/`** on purpose. Node 22 strips TypeScript, so a bare `node --test` would wrongly execute the site's `.test.ts` files. Keep the `"scripts/**/*.test.mjs"` glob.
- **`build:check` README injection fails loudly** if the `<!-- PLUGINS -->` markers are missing (don't silently no-op).
- **`site/astro.config.mjs` `site:` is `https://equipt-agent.vercel.app`** (the Vercel URL). Replace it if a custom domain is chosen so the sitemap/canonicals follow.
- **Catalog cards are injected by client JS**, so Astro **scoped** CSS can't reach them (scoped selectors require a `data-astro-cid` attr the injected nodes lack). Card styles live in a `<style is:global>` block namespaced under `#results` in `CatalogBrowser.astro` — keep new card styling there, not scoped.
- **Scores are v1.1.0 (4-axis), Readiness ~74–97, not partial.** Tiers: 5 Field-Ready + 5 Certified (seeded in `curation.json`), the rest Provisional. The clustering is high because the corpus is curated; **Fit** (the discriminating axis) lands in v1.1 and will spread scores. To re-score: `npm run score`, then commit `scores/`.

## Status & roadmap

**Current status:** Repo is **PRIVATE** on `github.com/Salah-XD/equipt`. v0.1.0 released. **Site deployed** (Vercel, `equipt-agent.vercel.app`; auto-deploys on push to `main`). Shipped to `main`: the **Equipt Standard scorer** (deterministic core) + the **marketplace UI** (rendered scorecards, redesigned catalog/detail, plugin pages, `/standard`, site-wide nav). CI green on Node 22.

> **Launch gate:** Do **not** make the repo public until the user says the exact phrase `! proceed!` — "proceed" / "proceed further" do **not** count. The install command and zip downloads only work once the repo is public. (Transient — remove at public launch.)

**Immediate next steps (ship plan):**
1. **Fit + Guard-injection LLM evals** — the deferred, differentiating axes. Fills the `null` Fit axis (removes `partial`, spreads scores) and adds Guard's adversarial half. **Needs `ANTHROPIC_API_KEY` to run** (~6k calls; Haiku). Follow-on of the approved Standard spec.
2. **Seed curation** — once scores are non-partial, hand-review the best assets → `curation.json` → they earn Certified / Field-Ready badges.
3. **Go public** — only on the user's explicit `! proceed!`.

**Phase 2 (post-launch):**
- Real format **adapters** for Cursor / Codex / Antigravity (export skills/agents to each surface's native format).
- **`@equipt/cli`** (owned scoped npm name; bin `equipt`, e.g. `npx @equipt/cli add <owner/repo>`).
