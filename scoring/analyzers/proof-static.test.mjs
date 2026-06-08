import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreProofStatic } from './proof-static.mjs';

test('examples + usage + sections score high', () => {
  const body = '## Usage\n\n```\ndemo\n```\n\n## Steps\n\nthings\n\n## Output format\n\n```\nout\n```';
  const r = scoreProofStatic({ body, frontmatter: {} });
  assert.ok(r.score >= 70, `got ${r.score}`);
});

test('bare prose with no examples/usage/sections scores low (no flat baseline)', () => {
  const r = scoreProofStatic({ body: 'just a paragraph of words with nothing structured', frontmatter: {} });
  assert.ok(r.score < 25, `got ${r.score}`);
});

test('more example blocks score higher (continuous)', () => {
  const one = scoreProofStatic({ body: '```\na\n```', frontmatter: {} });
  const three = scoreProofStatic({ body: '```\na\n```\n```\nb\n```\n```\nc\n```', frontmatter: {} });
  assert.ok(three.score > one.score, `${three.score} !> ${one.score}`);
});

test('star count adds a small adoption signal', () => {
  const withStars = scoreProofStatic({ body: 'plain', frontmatter: { stars: 1000 } });
  const without = scoreProofStatic({ body: 'plain', frontmatter: {} });
  assert.ok(withStars.score > without.score);
});
