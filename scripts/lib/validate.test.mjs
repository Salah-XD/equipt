import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAssets } from './validate.mjs';

const ok = { kind: 'skill', plugin: 'p', name: 'good-skill', description: 'fine', file: 'a/SKILL.md' };

test('clean assets produce no errors', () => {
  assert.deepEqual(validateAssets([ok]), []);
});

test('flags missing name and bad casing', () => {
  const problems = validateAssets([
    { kind: 'skill', plugin: 'p', description: 'x', file: 'b/SKILL.md' },
    { kind: 'skill', plugin: 'p', name: 'Bad_Name', description: 'x', file: 'c/SKILL.md' },
  ]);
  const msgs = problems.map(p => p.msg);
  assert.ok(msgs.some(m => m.includes('missing name')));
  assert.ok(msgs.some(m => m.includes('not kebab-case')));
});

test('duplicate name in same plugin is an error; across plugins is a warning', () => {
  const problems = validateAssets([
    { kind: 'skill', plugin: 'p', name: 'dup', description: 'x', file: 'd/SKILL.md' },
    { kind: 'skill', plugin: 'p', name: 'dup', description: 'x', file: 'e/SKILL.md' },
    { kind: 'skill', plugin: 'q', name: 'dup', description: 'x', file: 'f/SKILL.md' },
  ]);
  assert.equal(problems.filter(p => p.level === 'error' && p.msg.includes('duplicate')).length, 1);
  assert.equal(problems.filter(p => p.level === 'warning' && p.msg.includes('cross-plugin')).length, 1);
});
