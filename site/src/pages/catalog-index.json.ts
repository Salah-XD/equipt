import type { APIRoute } from 'astro';
import { loadAssets } from '../lib/catalog';
import { toIndex } from '../lib/search';

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = toIndex(await loadAssets());
  return new Response(JSON.stringify(entries), {
    headers: { 'content-type': 'application/json' },
  });
};
