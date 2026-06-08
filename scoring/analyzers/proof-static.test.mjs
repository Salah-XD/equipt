import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreProofStatic } from './proof-static.mjs';

test('examples + usage section score well', () => {
  const r = scoreProofStatic({ body: '## Usage\n\n```\ndemo\n```', frontmatter: {} });
  assert.ok(r.score >= 70, `got ${r.score}`);
});

test('bare prose with no examples scores low but non-zero (neutral baseline)', () => {
  const r = scoreProofStatic({ body: 'just words', frontmatter: {} });
  assert.ok(r.score > 0 && r.score < 50, `got ${r.score}`);
});

test('star count raises the adoption signal', () => {
  const withStars = scoreProofStatic({ body: 'just words', frontmatter: { stars: 1000 } });
  const without = scoreProofStatic({ body: 'just words', frontmatter: {} });
  assert.ok(withStars.score > without.score);
});
