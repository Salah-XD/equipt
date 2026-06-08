# The Equipt Standard — Methodology (v1.0.0)

Equipt rates how *ready* a skill or agent is to equip into your AI. The headline
is **Readiness (0–100)**, a weighted blend of five axes, capped by a safety gate.

## Axes

| Axis | What it measures | v1 method |
|---|---|---|
| **Craft** | How well it is built | Static: frontmatter completeness, description quality, body substance, structure, examples |
| **Fit** | Triggers at the right time, not the wrong time | *Not scored in v1* (LLM eval — see roadmap). Emitted as `null`. |
| **Guard** | Safety to run | Static scan: secret-exfiltration / destructive hard-fails, network/shell/eval risk, tool-scope (least privilege) |
| **Proof** | Evidence it works | Static: examples/usage sections, adoption inputs (low weight) |
| **Upkeep** | Alive & current | Git recency + current-spec frontmatter compatibility |

## Readiness

`Readiness = 0.25·Craft + 0.20·Fit + 0.25·Guard + 0.15·Proof + 0.15·Upkeep`

When an axis is unscored (e.g. Fit in v1), its weight is redistributed across the
scored axes and the card is marked `partial: true`.

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
(currently `1.0.0`) so historical scorecards remain interpretable.

## Roadmap

- **Fit** and **Guard (adversarial injection)** LLM evals — the differentiating
  signals — land in the follow-on evals plan.
