export type Theme = 'light' | 'dark';

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function nextTheme(t: Theme): Theme {
  return t === 'dark' ? 'light' : 'dark';
}
