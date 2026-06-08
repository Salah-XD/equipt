# The Equipt Standard — Design Spec

**Date:** 2026-06-08
**Status:** Approved design, pre-implementation
**Topic:** A verification + scorecard standard for skills & agents, and the automated scorer that produces it.

---

## 1. Context & motivation

Equipt today is a static, hand-curated library of 607 skills & agents rendered by an Astro site. The strategic direction is to evolve Equipt into a **curated, verified marketplace** for skills *and* agents — "the trusted source," positioned against the popularity-ranked open leaderboard at **skills.sh** (Vercel Labs) and inspired by how **Glama.ai** added a quality/trust layer to the MCP-server ecosystem.

The wedge is **trust + curation**, not coverage. The moat is a credible, transparent, *original* rating standard — with its own vocabulary, deliberately not Glama's "quality/security" framing.

This spec defines that standard (**The Equipt Standard**) and scopes the **first** buildable piece: the standard's methodology plus an automated scorer applied to the existing 607 assets as a seed corpus.

## 2. Goals

- Define **The Equipt Standard**: a readiness rating with five named axes, an overall **Readiness** score (0–100), and a **tier badge**.
- Build an **automated scorer** that produces a reproducible, machine-generated *Provisional* scorecard for every in-repo asset.
- Emit scorecard data in a schema the existing site can consume later.
- Publish a **methodology document** so the standard is transparent and defensible.
- Dogfood: score all 607 in-repo assets honestly (low scores are acceptable and informative).

## 3. Non-goals (deferred to later specs)

- Submission flow / author onboarding.
- Ingestion of external (non-repo) assets / GitHub crawling.
- New marketplace UI beyond the data contract (rendering scorecards on the site is the **next** spec).
- The distribution CLI (`@equipt/cli`).
- Live telemetry (install counts, usage). Adoption signals in this spec use only data already available (e.g. GitHub stars if present), and are weighted low.

## 4. The standard

### 4.1 Headline

**Readiness (0–100)** — "how ready is this to equip into your agent?" — a weighted composite of five axes, capped by a safety gate.

### 4.2 The five axes

Each axis is scored 0–100 from documented sub-signals.

| Axis | Question | Sub-signals | Method |
|---|---|---|---|
| **Craft** | Is it well-built? | Frontmatter completeness; clear structure; appropriate scope (not too broad/narrow); presence of examples; instruction clarity; no contradictions | Static parse + LLM rubric |
| **Fit** | Does it fire at the right time and *not* the wrong time? | Activation precision & recall vs the asset's `description` | Eval harness: generated should-trigger / should-NOT-trigger prompts |
| **Guard** | Is it safe to run? | Tool/permission scope (least privilege); network/file/exec calls; secret access; obfuscated/hidden instructions; destructive-action risk; injection resistance | Static scan + adversarial prompt-injection eval (+ Socket/Snyk for bundled code) |
| **Proof** | Is there evidence it works? | Examples/tests present; our eval pass; author track record; adoption signals (low weight, inputs only) | Static checks + eval result |
| **Upkeep** | Is it alive & current? | Last-update recency; commit cadence; spec-version compatibility | Git history + spec compatibility check |

**Fit** and **Guard's adversarial eval** are the differentiators no competitor publishes — they are what make "Equipt-verified" mean something specific.

### 4.3 Readiness composite

Weighted sum (weights are tunable and version-stamped in the methodology doc):

```
Readiness = 0.25*Craft + 0.20*Fit + 0.25*Guard + 0.15*Proof + 0.15*Upkeep
```

**Guard gate:** Guard is not just a weighted input — it gates the result.
- `Guard < 40` (a critical safety problem, e.g. detected exfiltration pattern or unguarded destructive action) → Readiness is **capped at 40** and the asset cannot exceed **Provisional**; it is flagged `unsafe` and excluded from any future one-click install surface.
- Hard-fail conditions (defined in the methodology doc) set Guard to 0 regardless of other Guard sub-signals.

### 4.4 Tier badge

Derived from Readiness **plus** the human-curation gate:

| Tier | Requirement |
|---|---|
| **Provisional** | Machine-scored only. Default for everything the scorer touches. |
| **Certified** | Passed all gates **and** human review; Readiness ≥ 70. |
| **Field-Ready** | Human-reviewed; Readiness ≥ 85 with Guard ≥ 70 and Proof ≥ 60. |

The badge is where **curation becomes the product**: a tier above Provisional requires a maintainer sign-off, recorded in a committed curation file (§5.4). This is the trust the open leaderboard lacks.

## 5. Architecture (first spec: methodology + automated scorer)

Follows the repo's existing conventions: Node ESM, no build framework, small focused modules with colocated `*.test.mjs`, discovery reusing `scripts/lib/discover`.

### 5.1 Layout

```
scoring/
  methodology.md                 # the published standard (versioned)
  score.mjs                      # orchestrator / CLI entry (npm run score)
  analyzers/                     # PURE, deterministic, unit-tested
    craft.mjs                    # frontmatter/structure/scope/examples
    guard-static.mjs             # tool scope, network/file/exec, secrets, obfuscation
    upkeep.mjs                   # git recency/cadence, spec compatibility
    proof-static.mjs             # examples/tests presence, adoption inputs
  evals/                         # LLM-driven, nondeterministic, cached, API-key gated
    fit.mjs                      # trigger precision/recall harness
    guard-injection.mjs          # adversarial injection eval
  lib/
    composite.mjs                # axis scores -> Readiness -> gate -> tier
    cache.mjs                    # content-hash keyed eval cache
    schema.mjs                   # scorecard JSON schema + validator
  *.test.mjs                     # colocated tests w/ fixtures + mocked LLM
scores/                          # GENERATED, committed
  index.json                     # aggregate: all scorecards, summary stats
  <plugin>/<name>.json           # per-asset scorecard
curation.json                    # human tier overrides (maintainer-edited)
```

### 5.2 Data flow

1. **Discover** assets (reuse `scripts/lib/discover`).
2. For each asset, in parallel with a concurrency cap:
   a. Run **static analyzers** (sync, deterministic) → Craft, Guard(static), Upkeep, Proof(static) sub-scores.
   b. Run **evals** (async) → Fit, Guard(injection). Each eval result is **cached by a hash of the asset content** so re-runs are stable and cheap; nondeterminism is reduced by running N times and taking the median/majority.
3. **Composite** (`lib/composite.mjs`): combine sub-scores → axis scores → Readiness → apply Guard gate → set machine tier = Provisional.
4. **Merge curation** (`curation.json`) to elevate eligible assets to Certified / Field-Ready.
5. **Emit** per-asset scorecard JSON (validated against `schema.mjs`) + `scores/index.json`.
6. (Next spec) the site reads `scores/` at build time and renders scorecards on detail pages.

### 5.3 Scorecard schema (the data contract for the site)

```jsonc
{
  "asset": { "plugin": "equipt-engineering", "name": "code-reviewer", "kind": "agent" },
  "standardVersion": "1.0.0",
  "readiness": 86,
  "tier": "provisional",            // provisional | certified | field-ready
  "unsafe": false,
  "axes": {
    "craft":  { "score": 88, "signals": [ "frontmatter complete", "has examples" ] },
    "fit":    { "score": 91, "signals": [ "precision 0.95", "recall 0.88" ] },
    "guard":  { "score": 64, "signals": [ "broad tool access" ], "gated": false },
    "proof":  { "score": 80, "signals": [ "examples present" ] },
    "upkeep": { "score": 92, "signals": [ "updated 12d ago" ] }
  },
  "scoredAt": "<stamped by runner, not inside the pure scorer>",
  "partial": false                  // true if any eval was skipped (no API key)
}
```

### 5.4 Human curation

`curation.json` is a maintainer-edited file mapping `plugin/name` → `{ tier, reviewer, note, reviewedAt }`. The scorer treats it as the **only** source that can raise a tier above Provisional, and validates that the asset still meets the numeric threshold for the claimed tier (a stale Certified entry whose Readiness dropped below 70 is rejected with a warning).

## 6. Error handling

- **Missing/invalid frontmatter** → Craft penalty + recorded signal, never a crash.
- **No API key / eval failure** → affected axis marked `unscored`; Readiness computed from available axes with documented reweighting, scorecard flagged `partial: true`, tier forced to **Provisional** (a partial score can't be Certified).
- **LLM nondeterminism** → N runs + median/majority; results cached by content hash for stability and cost.
- **Rate limits** → batch with backoff; the scorer is an offline batch job, not realtime.
- **Determinism for CI** → tests never call a real LLM; eval modules accept an injected client so tests use mocked responses.

## 7. Testing strategy

- **Unit tests** per static analyzer with good/bad fixture assets (e.g. a SKILL.md missing frontmatter, an agent with overly broad tool scope).
- **Composite tests**: given fixed axis scores, assert Readiness, the Guard gate cap, and tier thresholds.
- **Eval harness tests**: drive `fit.mjs` / `guard-injection.mjs` with a mocked LLM client; assert precision/recall math and injection-detection logic, not model output.
- **Schema validation test**: every emitted scorecard validates against `schema.mjs`.
- **Golden scorecards**: snapshot a handful of representative assets to catch scoring drift.
- Wired into the existing `npm test` flow (kept Node 22, ESM, `*.test.mjs` glob).

## 8. Transparency

- `scoring/methodology.md` publishes: each axis, its sub-signals, the weights, the Guard gate rules and hard-fail list, tier thresholds, and the `standardVersion`. Bumping any weight/threshold bumps the version.
- Every scorecard surfaces its `signals` (the *why*), never just a number.
- Re-scored on asset change (cache keyed by content hash makes this cheap).

## 9. Rollout

1. Implement analyzers + composite + schema (deterministic core) and unit tests.
2. Implement evals with a mockable client + cache.
3. Run the scorer over all 607 assets → commit `scores/`.
4. Seed `curation.json` with a first hand-reviewed Certified/Field-Ready set.
5. Publish `methodology.md`.
6. (Next spec) render scorecards on the site; (later) submissions, external ingestion, CLI.

## 10. Open questions (resolve during planning)

- Exact weights and the Guard hard-fail list — start with §4.3 defaults, tune against real seed-corpus results.
- Which LLM + how many eval repetitions balances cost vs stability for ~1200 eval runs (Fit + Guard × 607).
- Whether adoption signals (GitHub stars) are worth including at all in v1, given the trust-not-popularity wedge.
