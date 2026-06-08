// Pure. asset: { body, frontmatter }
export function scoreProofStatic(asset) {
  const signals = [];
  let score = 0;
  const body = asset.body || '';
  const fm = asset.frontmatter || {};

  if (/```/.test(body)) { score += 40; signals.push('has code/example blocks'); }
  else signals.push('no code/example blocks');

  if (/\b(usage|how to|example|workflow|steps?)\b/i.test(body)) { score += 30; signals.push('has usage/how-to section'); }
  else signals.push('no usage/how-to section');

  const stars = Number(fm.stars);
  if (Number.isFinite(stars) && stars > 0) {
    score += Math.min(30, Math.round(Math.log10(stars + 1) * 15));
    signals.push(`adoption signal: ${stars} stars`);
  } else {
    score += 15; // neutral baseline so absence of adoption data isn't a hard zero
    signals.push('no adoption data (neutral baseline)');
  }

  return { score: Math.min(100, score), signals };
}
