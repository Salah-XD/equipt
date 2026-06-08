// scoring/lib/schema.mjs
export const STANDARD_VERSION = '1.1.1';
const TIERS = ['provisional', 'certified', 'field-ready'];
const AXES = ['craft', 'fit', 'guard', 'proof', 'upkeep'];

export function validateScorecard(card) {
  const errors = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };

  if (!card || typeof card !== 'object') return { valid: false, errors: ['card must be an object'] };
  req(card.asset && typeof card.asset.plugin === 'string', 'asset.plugin required');
  req(card.asset && typeof card.asset.name === 'string', 'asset.name required');
  req(card.asset && (card.asset.kind === 'skill' || card.asset.kind === 'agent'), 'asset.kind must be skill|agent');
  req(card.standardVersion === STANDARD_VERSION, `standardVersion must be ${STANDARD_VERSION}`);
  req(Number.isFinite(card.readiness) && card.readiness >= 0 && card.readiness <= 100, 'readiness must be 0..100');
  req(TIERS.includes(card.tier), `tier must be one of ${TIERS.join(', ')}`);
  req(typeof card.unsafe === 'boolean', 'unsafe must be boolean');
  req(typeof card.partial === 'boolean', 'partial must be boolean');
  req(card.axes && typeof card.axes === 'object', 'axes required');

  for (const k of AXES) {
    const a = card.axes?.[k];
    if (a === null || a === undefined) { if (a === undefined) errors.push(`axes.${k} missing (use null if unscored)`); continue; }
    req(Number.isFinite(a.score) && a.score >= 0 && a.score <= 100, `axes.${k}.score must be 0..100`);
    req(Array.isArray(a.signals), `axes.${k}.signals must be an array`);
  }

  return { valid: errors.length === 0, errors };
}
