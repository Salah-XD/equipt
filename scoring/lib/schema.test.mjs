// scoring/lib/schema.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateScorecard, STANDARD_VERSION } from './schema.mjs';

function validCard() {
  return {
    asset: { plugin: 'equipt-data', name: 'sql-explainer', kind: 'skill' },
    standardVersion: STANDARD_VERSION,
    readiness: 80,
    tier: 'provisional',
    unsafe: false,
    partial: true,
    axes: {
      craft: { score: 90, signals: ['ok'] },
      fit: null,
      guard: { score: 75, signals: ['ok'], gated: false },
      proof: { score: 70, signals: ['ok'] },
      upkeep: { score: 88, signals: ['ok'] },
    },
  };
}

test('accepts a well-formed card', () => {
  const { valid, errors } = validateScorecard(validCard());
  assert.equal(valid, true, errors.join('; '));
});

test('rejects out-of-range readiness', () => {
  const c = validCard(); c.readiness = 140;
  assert.equal(validateScorecard(c).valid, false);
});

test('rejects unknown tier', () => {
  const c = validCard(); c.tier = 'gold';
  assert.equal(validateScorecard(c).valid, false);
});

test('allows a null (unscored) axis but rejects a malformed one', () => {
  const c = validCard(); c.axes.proof = { score: 70 }; // missing signals
  assert.equal(validateScorecard(c).valid, false);
});
