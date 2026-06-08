// scoring/lib/composite.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeReadiness, WEIGHTS, GUARD_GATE } from './composite.mjs';

const ax = (score, gated = false) => ({ score, signals: [], gated });

test('weights sum to 1', () => {
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('full set of axes → weighted readiness', () => {
  const r = computeReadiness({ craft: ax(80), fit: ax(80), guard: ax(80), proof: ax(80), upkeep: ax(80) });
  assert.equal(r.readiness, 80);
  assert.equal(r.partial, false);
  assert.equal(r.unsafe, false);
  assert.equal(r.tier, 'provisional');
});

test('a null axis reweights and marks partial', () => {
  const r = computeReadiness({ craft: ax(90), fit: null, guard: ax(90), proof: ax(90), upkeep: ax(90) });
  assert.equal(r.readiness, 90);
  assert.equal(r.partial, true);
  assert.equal(r.eligibleTier, null);
});

test('guard below gate caps readiness and flags unsafe', () => {
  const r = computeReadiness({ craft: ax(100), fit: ax(100), guard: ax(10), proof: ax(100), upkeep: ax(100) });
  assert.ok(r.readiness <= GUARD_GATE);
  assert.equal(r.unsafe, true);
});

test('gated guard flags unsafe regardless of score field', () => {
  const r = computeReadiness({ craft: ax(100), fit: ax(100), guard: ax(0, true), proof: ax(100), upkeep: ax(100) });
  assert.equal(r.unsafe, true);
  assert.ok(r.readiness <= GUARD_GATE);
});

test('eligibleTier reflects thresholds for a clean full card', () => {
  const r = computeReadiness({ craft: ax(95), fit: ax(95), guard: ax(90), proof: ax(80), upkeep: ax(95) });
  assert.equal(r.eligibleTier, 'field-ready');
  const r2 = computeReadiness({ craft: ax(72), fit: ax(72), guard: ax(72), proof: ax(72), upkeep: ax(72) });
  assert.equal(r2.eligibleTier, 'certified');
});
