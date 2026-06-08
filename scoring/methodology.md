# The Equipt Standard — Methodology (v1.1.1)

Equipt rates how *ready* a skill or agent is to equip into your AI. The headline
is **Readiness (0–100)**, a weighted blend of four axes (a fifth, **Fit**, is
deferred to v1.1), capped by a safety gate.

## Axes

| Axis | What it measures | v1 method |
|---|---|---|
| **Craft** | How well it is built | Static: frontmatter completeness, description quality, body substance, structure, examples |
| **Fit** | Triggers at the right time, not the wrong time | *Deferred to v1.1* (needs an LLM eval). Shown on cards as “coming”. |
| **Guard** | Safety to run | Static scan of the asset's **code** (fenced/inline, not prose): destructive / credential-in-URL hard-fails, secret-exfiltration over the network (curl/wget **and** fetch/XHR/requests/Invoke-WebRequest/…), shell/eval/spawn risk, tool-scope (least privilege) |
| **Proof** | Evidence it works | Static, **continuous**: count of example blocks + usage/how-to + structure depth + adoption (low weight) — no flat baseline, so thin assets score low |
| **Upkeep** | Alive & current | Git recency + current-spec frontmatter compatibility |

## Readiness

`Readiness = 0.30·Craft + 0.30·Guard + 0.20·Proof + 0.20·Upkeep`

**Fit** is excluded from the v1 weighting (it needs an LLM eval) and lands in
v1.1. If a *scored* axis is ever missing, its weight is redistributed across the
rest and the card is marked `partial: true`.

## Guard gate

Guard is also a gate: a `gated` hard-fail, or any Guard score below **40**, caps
Readiness at 40 and flags the asset `unsafe: true`. Unsafe assets can never be
promoted above Provisional.

## Tiers

| Tier | Requirement |
|---|---|
| **Provisional** | Machine-scored (default). |
| **Certified** | Human-reviewed + Readiness ≥ 70 (and not partial/unsafe). |
| **Field-Ready** | Human-reviewed + Readiness ≥ 85, Guard ≥ 70, Proof ≥ 60. |

A tier above Provisional requires an entry in `curation.json`; the scorer only
honours it when the asset still meets the numeric threshold.

## Versioning

Changing any weight, threshold, or hard-fail rule bumps `standardVersion`
(currently `1.1.1`) so historical scorecards remain interpretable.

> **Note on tiers:** *Provisional* means **machine-scored, not yet human-reviewed** — it is not a quality verdict. A high Readiness with a Provisional tier just means a human hasn't signed off yet.

## Roadmap

- **Fit** and **Guard (adversarial injection)** LLM evals — the differentiating
  signals — land in the follow-on evals plan.
