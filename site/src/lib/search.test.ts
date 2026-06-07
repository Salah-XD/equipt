import { test, expect } from 'vitest';
import { toIndex, filterEntries } from './search';

const assets = [
  { kind: 'skill', plugin: 'equipt-marketing', name: 'hashtag-strategy', description: 'Plan hashtags.', tools: 'Read', body: '', slug: 'equipt-marketing/hashtag-strategy' },
  { kind: 'agent', plugin: 'equipt-engineering', name: 'code-reviewer', description: 'Reviews diffs.', tools: 'Read', body: '', slug: 'equipt-engineering/code-reviewer' },
] as const;

test('toIndex strips body/tools and keeps searchable fields', () => {
  const idx = toIndex(assets as any);
  expect(idx[0]).toEqual({ name: 'hashtag-strategy', description: 'Plan hashtags.', plugin: 'equipt-marketing', kind: 'skill', slug: 'equipt-marketing/hashtag-strategy' });
  expect((idx[0] as any).body).toBeUndefined();
});

test('filterEntries matches query against name and description', () => {
  const idx = toIndex(assets as any);
  expect(filterEntries(idx, { q: 'diffs' }).map(e => e.name)).toEqual(['code-reviewer']);
  expect(filterEntries(idx, { q: 'HASHTAG' }).map(e => e.name)).toEqual(['hashtag-strategy']);
});

test('filterEntries respects plugin and kind facets', () => {
  const idx = toIndex(assets as any);
  expect(filterEntries(idx, { kind: 'agent' }).map(e => e.name)).toEqual(['code-reviewer']);
  expect(filterEntries(idx, { plugin: 'equipt-marketing' }).map(e => e.name)).toEqual(['hashtag-strategy']);
  expect(filterEntries(idx, {}).length).toBe(2);
});
