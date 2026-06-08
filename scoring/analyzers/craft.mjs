// Pure. asset: { frontmatter, description, body, kind }
export function scoreCraft(asset) {
  const signals = [];
  let score = 0;
  const fm = asset.frontmatter || {};
  const desc = (asset.description || '').trim();
  const body = (asset.body || '').trim();

  // Frontmatter completeness (30)
  if (fm.name) score += 15; else signals.push('missing name in frontmatter');
  if (desc) score += 15; else signals.push('missing description');

  // Description quality (20)
  if (desc.length >= 30 && desc.length <= 500) { score += 10; signals.push('description length ok'); }
  else if (desc) signals.push(`description length ${desc.length} (aim 30-500)`);
  if (/\b(use when|when |for )\b/i.test(desc)) { score += 10; signals.push('description has trigger cue'); }
  else if (desc) signals.push('description lacks a clear "use when" trigger cue');

  // Body substance (25)
  if (body.length >= 200) { score += 15; signals.push('substantive body'); }
  else signals.push(`thin body (${body.length} chars)`);
  if (/^#{1,3}\s/m.test(body)) { score += 10; signals.push('has headings'); }
  else signals.push('no headings / structure');

  // Examples (25)
  if (/```/.test(body) || /\bexample\b/i.test(body)) { score += 25; signals.push('includes examples'); }
  else signals.push('no examples');

  return { score: Math.min(100, score), signals };
}
