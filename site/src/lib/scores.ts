import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveRepoRoot } from './catalog';

export interface AxisScore {
  score: number;
  signals: string[];
  gated?: boolean;
}

export interface Scorecard {
  asset: { plugin: string; name: string; kind: string };
  standardVersion: string;
  readiness: number;
  tier: string;
  unsafe: boolean;
  partial: boolean;
  eligibleTier: string | null;
  axes: {
    craft: AxisScore | null;
    fit: AxisScore | null;
    guard: AxisScore | null;
    proof: AxisScore | null;
    upkeep: AxisScore | null;
  };
}

export interface ScoreSummary {
  readiness: number;
  tier: string;
  unsafe: boolean;
  partial: boolean;
}

/** Map of `plugin/name` → score summary, read from the generated scores/index.json. */
export async function loadScoreIndex(root?: string): Promise<Map<string, ScoreSummary>> {
  if (root === undefined) root = await resolveRepoRoot();
  const map = new Map<string, ScoreSummary>();
  try {
    const raw = await readFile(join(root, 'scores', 'index.json'), 'utf8');
    const data = JSON.parse(raw) as { assets: Array<{ plugin: string; name: string } & ScoreSummary> };
    for (const a of data.assets) {
      map.set(`${a.plugin}/${a.name}`, {
        readiness: a.readiness,
        tier: a.tier,
        unsafe: a.unsafe,
        partial: a.partial,
      });
    }
  } catch {
    // no scores generated yet — callers handle an empty map gracefully
  }
  return map;
}

/** Full scorecard (with per-axis detail) for one asset, or null if unscored. */
export async function loadScorecard(plugin: string, name: string, root?: string): Promise<Scorecard | null> {
  if (root === undefined) root = await resolveRepoRoot();
  try {
    const raw = await readFile(join(root, 'scores', plugin, `${name}.json`), 'utf8');
    return JSON.parse(raw) as Scorecard;
  } catch {
    return null;
  }
}

export const AXIS_LABELS: Record<string, string> = {
  craft: 'Craft',
  fit: 'Fit',
  guard: 'Guard',
  proof: 'Proof',
  upkeep: 'Upkeep',
};

export const AXIS_BLURB: Record<string, string> = {
  craft: 'How well it’s built',
  fit: 'Triggers at the right time',
  guard: 'Safe to run',
  proof: 'Evidence it works',
  upkeep: 'Alive & current',
};

/** "How we measure it" copy, surfaced as tooltips on each axis. */
export const AXIS_TIP: Record<string, string> = {
  craft: 'Static analysis of the SKILL/agent file — frontmatter completeness, description quality, body substance, structure, and examples.',
  fit: 'Whether it triggers at the right time and not the wrong time — measured by an LLM eval. Lands in v1.1.',
  guard: 'A static safety scan: secret-exfiltration / destructive hard-fails, network / shell / eval risk, and tool scope (least privilege). Guard also gates the overall score.',
  proof: 'Evidence it works — examples and usage sections in the body, plus adoption signals (low weight).',
  upkeep: 'Alive & current — recency of the last change (git) and compatibility with the current skill spec.',
};

export const READINESS_TIP =
  'Readiness is a weighted blend of the axes (Craft .30, Guard .30, Proof .20, Upkeep .20), capped by the Guard safety gate. Fit joins the blend in v1.1.';

/** What each tier means — surfaced as a tooltip so "Readiness 93 · Provisional" isn't confusing. */
export const TIER_TIP: Record<string, string> = {
  provisional: 'Machine-scored on the Equipt Standard — not yet human-reviewed.',
  certified: 'Human-reviewed · Readiness ≥ 70. A maintainer has vetted this asset.',
  'field-ready': 'Human-reviewed, top tier · Readiness ≥ 85 with strong Guard & Proof.',
};

/** Human label for a tier slug. */
export function tierLabel(tier: string): string {
  if (tier === 'field-ready') return 'Field-Ready';
  if (tier === 'certified') return 'Certified';
  return 'Provisional';
}
