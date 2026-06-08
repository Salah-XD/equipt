// Pure. asset: { kind, frontmatter }; ctx: { nowMs, lastCommitMs }  (lastCommitMs may be null)
const DAY = 86_400_000;

export function scoreUpkeep(asset, ctx) {
  const signals = [];
  let score = 0;
  const fm = asset.frontmatter || {};

  // Recency (60)
  if (Number.isFinite(ctx.lastCommitMs)) {
    const days = Math.floor((ctx.nowMs - ctx.lastCommitMs) / DAY);
    if (days <= 90) { score += 60; signals.push(`updated ${days}d ago`); }
    else if (days <= 365) { score += 35; signals.push(`updated ${days}d ago`); }
    else { score += 10; signals.push(`stale: updated ${days}d ago`); }
  } else {
    score += 30; signals.push('no git history (neutral baseline)');
  }

  // Spec compatibility (40)
  const hasName = !!fm.name;
  const hasDesc = !!fm.description;
  const agentOk = asset.kind !== 'agent' || !!(fm.tools || fm['allowed-tools']);
  if (hasName && hasDesc && agentOk) { score += 40; signals.push('spec-compatible frontmatter'); }
  else {
    if (!hasName || !hasDesc) signals.push('incomplete frontmatter for current spec');
    if (!agentOk) signals.push('agent missing tools declaration');
  }

  return { score: Math.min(100, score), signals };
}
