import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { resolveTargetDir } from '../src/lib/paths.mjs';

test('project target is <cwd>/.claude', () => {
  assert.equal(resolveTargetDir({ cwd: '/proj' }), join('/proj', '.claude'));
});

test('global target is <home>/.claude', () => {
  assert.equal(resolveTargetDir({ global: true, cwd: '/proj' }), join(homedir(), '.claude'));
});
