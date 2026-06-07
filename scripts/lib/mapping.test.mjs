import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluginForCategory } from './mapping.mjs';

const mapping = {
  plugins: {
    'equipt-marketing': { skills: ['Social Media'], agents: ['marketing'] },
    'equipt-data': { skills: ['Analytics & Data'], agents: ['data'] },
  },
};

test('maps a skill category to its plugin', () => {
  assert.equal(pluginForCategory(mapping, 'skills', 'Social Media'), 'equipt-marketing');
});

test('maps an agent category to its plugin', () => {
  assert.equal(pluginForCategory(mapping, 'agents', 'data'), 'equipt-data');
});

test('returns null for an unmapped category', () => {
  assert.equal(pluginForCategory(mapping, 'skills', 'Nope'), null);
});
