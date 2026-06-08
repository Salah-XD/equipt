import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreCraft } from './craft.mjs';

const good = {
  frontmatter: { name: 'x', description: 'd' },
  description: 'Use when reviewing a pull request before merge to catch real bugs.',
  body: '# Title\n\nDetailed guidance that is clearly well over two hundred characters long so that the body-substance check passes comfortably and we exercise the headings and examples paths too.\n\n## Example\n\n```\ncode\n```',
  kind: 'skill',
};

test('a well-formed asset scores high', () => {
  const r = scoreCraft(good);
  assert.ok(r.score >= 90, `got ${r.score}`);
});

test('missing description is penalized', () => {
  const r = scoreCraft({ ...good, description: '', frontmatter: { name: 'x' } });
  assert.ok(r.score < 90);
  assert.ok(r.signals.some((s) => /description/i.test(s)));
});

test('thin body with no examples scores low', () => {
  const r = scoreCraft({ frontmatter: { name: 'x', description: 'd' }, description: 'short', body: 'tiny', kind: 'skill' });
  assert.ok(r.score < 60, `got ${r.score}`);
});

test('score never exceeds 100', () => {
  assert.ok(scoreCraft(good).score <= 100);
});
