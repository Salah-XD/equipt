import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCuration } from './curation.mjs';

const base = (over = {}) => ({
  asset: { plugin: 'p', name: 'n', kind: 'skill' },
  readiness: 90, tier: 'provisional', unsafe: false, partial: false,
  eligibleTier: 'field-ready', axes: {}, ...over,
});

test('no entry leaves tier untouched', () => {
  const r = mergeCuration(base(), undefined);
  assert.equal(r.tier, 'provisional');
  assert.equal(r.curation, null);
});

test('valid certified elevation is applied', () => {
  const r = mergeCuration(base({ eligibleTier: 'certified' }), { tier: 'certified', reviewer: 'a' });
  assert.equal(r.tier, 'certified');
  assert.equal(r.curation.applied, true);
});

test('claiming field-ready without eligibility is rejected', () => {
  const r = mergeCuration(base({ eligibleTier: 'certified' }), { tier: 'field-ready', reviewer: 'a' });
  assert.equal(r.tier, 'provisional');
  assert.equal(r.curation.applied, false);
});

test('unsafe assets cannot be elevated', () => {
  const r = mergeCuration(base({ unsafe: true }), { tier: 'certified', reviewer: 'a' });
  assert.equal(r.tier, 'provisional');
  assert.equal(r.curation.applied, false);
});

test('partial scores cannot be elevated', () => {
  const r = mergeCuration(base({ partial: true }), { tier: 'certified', reviewer: 'a' });
  assert.equal(r.curation.applied, false);
});
