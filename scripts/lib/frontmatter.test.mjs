import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from './frontmatter.mjs';

const sample = [
  '---',
  'name: instagram-carousel',
  'description: "Plans Instagram carousels: slides, copy, hashtags."',
  'allowed-tools: Read Write Glob',
  'metadata:',
  '  author: Salah-XD',
  '---',
  '',
  '# Instagram Carousel',
].join('\n');

test('extracts frontmatter data and body', () => {
  const { data, body } = parseFrontmatter(sample);
  assert.equal(data.name, 'instagram-carousel');
  assert.equal(data['allowed-tools'], 'Read Write Glob');
  assert.equal(data.metadata.author, 'Salah-XD');
  assert.match(body, /# Instagram Carousel/);
});
