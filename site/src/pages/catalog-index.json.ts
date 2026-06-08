import type { APIRoute } from 'astro';
import { loadAssets } from '../lib/catalog';
import { loadScoreIndex } from '../lib/scores';
import { toIndex } from '../lib/search';

export const prerender = true;

// Lazily fetched by the Cmd+K command palette (and reusable elsewhere) so the
// ~607-entry index isn't embedded inline on every page.
export const GET: APIRoute = async () => {
  const entries = toIndex(await loadAssets(), await loadScoreIndex());
  return new Response(JSON.stringify(entries), {
    headers: { 'content-type': 'application/json' },
  });
};
