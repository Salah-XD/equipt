// Pure. asset: { body, frontmatter }
// Continuous scoring (no flat baseline) so genuinely thin assets score low and
// the distribution spreads instead of clustering near the top.
export function scoreProofStatic(asset) {
  const signals = [];
  let score = 0;
  const body = asset.body || '';
  const fm = asset.frontmatter || {};

  // Example blocks (continuous, up to 45)
  const fences = Math.floor((body.match(/```/g) || []).length / 2);
  if (fences > 0) { score += Math.min(45, 20 + fences * 12); signals.push(`${fences} example block(s)`); }
  else signals.push('no example blocks');

  // Usage / how-to (25)
  if (/\b(usage|how to|how it works|example|workflow|step-by-step|steps|output format)\b/i.test(body)) {
    score += 25; signals.push('has usage / how-to');
  } else signals.push('no usage / how-to section');

  // Structure depth (continuous, up to 20)
  const sections = (body.match(/^#{2,3}\s/gm) || []).length;
  if (sections > 0) { score += Math.min(20, sections * 5); signals.push(`${sections} section(s)`); }

  // Adoption (low weight, up to 10) — usually absent for in-repo assets
  const stars = Number(fm.stars);
  if (Number.isFinite(stars) && stars > 0) {
    score += Math.min(10, Math.round(Math.log10(stars + 1) * 5));
    signals.push(`${stars} stars`);
  }

  return { score: Math.min(100, score), signals };
}
