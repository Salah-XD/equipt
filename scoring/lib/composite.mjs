// scoring/lib/composite.mjs
export const WEIGHTS = { craft: 0.25, fit: 0.20, guard: 0.25, proof: 0.15, upkeep: 0.15 };
export const GUARD_GATE = 40; // guard below this caps readiness + flags unsafe
export const TIER_THRESHOLDS = { certified: 70, fieldReady: 85 };

// axes: { craft, fit, guard, proof, upkeep } — each { score, signals, gated? } | null
export function computeReadiness(axes) {
  const keys = Object.keys(WEIGHTS);
  const present = keys.filter((k) => axes[k] && Number.isFinite(axes[k].score));
  const partial = present.length < keys.length;

  const totalWeight = present.reduce((s, k) => s + WEIGHTS[k], 0) || 1;
  let readiness = present.reduce((s, k) => s + axes[k].score * (WEIGHTS[k] / totalWeight), 0);

  const guard = axes.guard;
  let unsafe = false;
  const gated = !!(guard && guard.gated);
  if (gated || (guard && Number.isFinite(guard.score) && guard.score < GUARD_GATE)) {
    readiness = Math.min(readiness, GUARD_GATE);
    unsafe = true;
  }

  readiness = Math.round(readiness);

  let eligibleTier = null;
  if (!partial && !unsafe) {
    const g = guard?.score ?? 0;
    const p = axes.proof?.score ?? 0;
    if (readiness >= TIER_THRESHOLDS.fieldReady && g >= 70 && p >= 60) eligibleTier = 'field-ready';
    else if (readiness >= TIER_THRESHOLDS.certified) eligibleTier = 'certified';
  }

  return { readiness, tier: 'provisional', unsafe, partial, eligibleTier };
}
