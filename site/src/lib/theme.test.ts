import { test, expect } from 'vitest';
import { resolveTheme, nextTheme } from './theme';

test('resolveTheme honors a stored choice', () => {
  expect(resolveTheme('dark', false)).toBe('dark');
  expect(resolveTheme('light', true)).toBe('light');
});

test('resolveTheme falls back to system preference', () => {
  expect(resolveTheme(null, true)).toBe('dark');
  expect(resolveTheme(null, false)).toBe('light');
  expect(resolveTheme('garbage', true)).toBe('dark');
});

test('nextTheme toggles', () => {
  expect(nextTheme('light')).toBe('dark');
  expect(nextTheme('dark')).toBe('light');
});
