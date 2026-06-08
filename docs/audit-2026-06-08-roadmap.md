# Equipt Audit & Launch Roadmap — 2026-06-08

Synthesized from a 6-dimension multi-agent audit (landing UX, catalog UX, frontend a11y/SEO/perf, codebase/CI, scoring credibility, CLI/launch) — 71 findings.

## Headline
Equipt is **engineering-solid but launch-hollow**: the toolchain, CLI, and site shell work, but the landing page never shows a single real skill, and the "verified" scoring certifies ~98% of assets at 74–97 with a null Fit axis. **Fix scoring credibility and surface real assets before going public.**

## 🔴 Top bugs / gaps
1. **Guard analyzer is bypassable** — only flags `curl`/`wget`; `fetch()`, `XMLHttpRequest`, Python `requests`, PowerShell `Invoke-WebRequest`/`IEX` all score Guard=100. (`scoring/analyzers/guard-static.mjs`)
2. **Guard false-positive** — `curl` in prose penalizes legit doc skills 20–25 pts.
3. **Score compression** — all 607 score 74–97 (avg 93, ~17 unique values); Proof `+15` + Upkeep `+30` baselines make "verified" meaningless.
4. **Fit is null for all 607** — the discriminating axis is unimplemented (needs `ANTHROPIC_API_KEY` eval).
5. **Tier/score contradiction** — 597 assets show "Provisional" next to a 93 readiness.
6. **CI never runs the CLI tests, the site build, or a scores drift gate** — broken artifacts ship green.
7. **`@equipt/cli` can't publish cleanly** — missing `publishConfig:{access:public}` + repository/homepage/keywords/author.
8. **CLI temp tarballs never cleaned up**; `resolveSource` `cleanup()` is a no-op and never called.
9. **Scorer spawns 607 sequential `git log`** — minutes; batch for ~50–90× speedup.
10. **`astro.config.mjs` `site:` = the vercel.app preview domain** — poisons canonicals/OG/sitemap until a real domain is set.
11. **`index.astro` loads all asset data then discards it** (uses only `assets.length`) — the library is invisible by accident.
12. **6 site links 404** (Star, nav, footer license, View-source, release zip) — repo still private.
13. `schema.mjs` doesn't validate `eligibleTier`; no curation/asset cross-check.
14. **Upkeep cliff** — all assets share the initial commit date → simultaneous ~5-pt drop on day 91.

## Critical path to public launch (ordered)
1. Run Fit + Guard-injection LLM evals (`ANTHROPIC_API_KEY`) → real, spread scores; re-review curation
2. Fix Guard false-negatives/positives before scores are published as trust
3. Wire CLI tests + site build + a scores drift gate into CI
4. Rebuild the landing page (feature real assets + Standard section + search/Cmd+K)
5. Add the 5 npm fields to `cli/package.json`; verify the `@equipt` org is owned
6. Add an npm-publish workflow (`cli-v*` tag → publish); drop the private-repo caveat from the CLI README
7. Pick a custom domain; replace the vercel.app placeholder + robots sitemap; redeploy
8. `npm publish @equipt/cli`
9. Make the repo **public** on the owner's explicit `! proceed!`
10. Smoke-test the full public funnel

## Phased roadmap (impact / effort)

### 🚧 Launch-blocking
- `[H/L]` Run Fit + Guard-injection evals → populate Fit, commit updated scores
- `[H/M]` Widen score distribution (drop Proof/Upkeep flat baselines; add a continuous axis)
- `[H/M]` Fix Guard false-negatives (fetch/XHR/requests/Invoke-WebRequest/IEX) + tests
- `[M/M]` Fix Guard `curl`-in-prose false-positive (scope to code fences)
- `[H/S]` Resolve tier-vs-score label (surface `eligibleTier` / "Auto-Certified" ≥90)
- `[H/S]` `cli/package.json`: `publishConfig:{access:public}` + repository/homepage/keywords/author
- `[H/S]` CI: add CLI test job + site build job (Node 22) to ci.yml + release.yml
- `[M/M]` CI: add a `score:check` drift gate
- `[H/S]` npm publish workflow (`cli-v*` tag → `npm publish --access=public`, `NPM_TOKEN`)
- `[M/S]` Remove private-repo caveat from `cli/README.md`; add badges
- `[H/S]` Pick domain; replace vercel.app in astro.config + robots; redeploy
- `[H/S]` Make repo public (`! proceed!`)

### 🎨 Landing-page UX (owner's top concern)
- `[H/M]` `FeaturedAssets` — real top-scored cross-plugin cards with tier/score badges
- `[H/M]` Equipt Standard / `TrustSection` — axes named + a mini live Scorecard
- `[H/M]` Inline hero search + Cmd+K command palette
- `[H/S]` Reorder into a persuasion arc (Hero → Featured → Standard → Plugins → Install → Explore)
- `[H/S]` Stop discarding asset data in `index.astro`
- `[M/S]` Replace the CatalogTeaser stub with a live preview / search-entry
- `[M/S]` Sample-skill chips inside plugin cards
- `[L/S]` Upgrade ProofBar to real trust signals; tertiary "Browse featured" CTA

### 🔎 Catalog & discovery
- `[H/S]` Tier filter + readiness-floor preset on the catalog
- `[H/S]` Sort control (Best match / Highest readiness / A–Z)
- `[H/S]` Color-coded tier badges on catalog + plugin cards
- `[M/M]` Shared `CommandPalette.astro` (Cmd+K) site-wide
- `[M/S]` Empty-state + Clear-filters; score-ranked related items
- `[M/M]` Local search + tier filter on plugin pages

### 🧰 Technical / CI
- `[M/S]` Implement + call `resolveSource` cleanup() (rm tmp tarball)
- `[M/S]` Batch the 607 `git log` calls (~50–90× faster scoring)
- `[M/S]` Validate `eligibleTier` + cross-check curation keys
- `[M/M]` Extract the duplicated plugin-walk (site lib vs scripts/lib)
- `[L/S]` SDK-starter CI; remove dead `catalog-index.json`/`glob`/`tsx` (mostly done)

### ♿ a11y / SEO / perf
- `[H/M]` Replace render-blocking `@import` fonts with `@font-face` + preload
- `[H/M]` Move the ~120KB catalog JSON out of inline HTML → lazy-fetched endpoint
- `[H/M]` Make scorecard tooltips keyboard/touch-accessible (aria-describedby, focus, Esc)
- `[M/M]` JSON-LD (WebSite+SearchAction, per-asset); SSR initial catalog set
- `[M/S]` Skip-to-main link; fix 404 `<main>`-inside-`<header>`
- `[M/M]` Lazy-load Motion (GSAP/Lenis) via client:idle/visible

### ✨ Polish
- Disable the dead "Cursor/Codex — soon" install tab; expand footer; finalize CLAUDE.md at launch.

### 🔭 Post-launch
- Independent reviewers + published rubric for Field-Ready; `equipt remove/update/list --installed`; real Upkeep signal; Phase-2 Cursor/Codex/Antigravity adapters.
