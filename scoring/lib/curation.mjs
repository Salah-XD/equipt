// Pure. Elevate a machine card's tier iff a human entry is justified by the numbers.
export function mergeCuration(card, entry) {
  if (!entry) return { ...card, curation: null };
  if (card.unsafe) return { ...card, curation: { ...entry, applied: false, reason: 'asset flagged unsafe' } };
  if (card.partial) return { ...card, curation: { ...entry, applied: false, reason: 'score is partial' } };

  const wants = entry.tier;
  const ok =
    (wants === 'certified' && (card.eligibleTier === 'certified' || card.eligibleTier === 'field-ready')) ||
    (wants === 'field-ready' && card.eligibleTier === 'field-ready');

  if (!ok) return { ...card, curation: { ...entry, applied: false, reason: `does not meet ${wants} thresholds` } };
  return { ...card, tier: wants, curation: { ...entry, applied: true } };
}
