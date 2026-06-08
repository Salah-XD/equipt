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

/** Human label for a tier slug. */
export function tierLabel(tier: string): string {
  if (tier === 'field-ready') return 'Field-Ready';
  if (tier === 'certified') return 'Certified';
  return 'Provisional';
}
