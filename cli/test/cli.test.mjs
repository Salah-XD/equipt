import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'source');

test('exit codes: help=0, no-cmd=1, unknown=1, list=0, version=0', async () => {
  assert.equal(await run(['--help']), 0);
  assert.equal(await run([]), 1);
  assert.equal(await run(['bogus']), 1);
  assert.equal(await run(['list', '--from', FIX]), 0);
  assert.equal(await run(['--version']), 0);
});

test('add with unknown target exits 1', async () => {
  assert.equal(await run(['add', 'nope', '--from', FIX]), 1);
});
