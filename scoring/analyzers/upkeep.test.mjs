import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreUpkeep } from './upkeep.mjs';

const now = 1_700_000_000_000;
const DAY = 86_400_000;
const skill = { kind: 'skill', frontmatter: { name: 'x', description: 'd' } };

test('recently updated, spec-compatible skill scores high', () => {
  const r = scoreUpkeep(skill, { nowMs: now, lastCommitMs: now - 10 * DAY });
  assert.ok(r.score >= 90, `got ${r.score}`);
});

test('stale asset loses recency points', () => {
  const r = scoreUpkeep(skill, { nowMs: now, lastCommitMs: now - 800 * DAY });
  assert.ok(r.score < 90);
  assert.ok(r.signals.some((s) => /stale/i.test(s)));
});

test('agent without tools is flagged as spec-incompatible', () => {
  const agent = { kind: 'agent', frontmatter: { name: 'x', description: 'd' } };
  const r = scoreUpkeep(agent, { nowMs: now, lastCommitMs: now - 10 * DAY });
  assert.ok(r.signals.some((s) => /tools/i.test(s)));
});

test('unknown git history uses a neutral baseline', () => {
  const r = scoreUpkeep(skill, { nowMs: now, lastCommitMs: null });
  assert.ok(r.signals.some((s) => /no git history/i.test(s)));
});
