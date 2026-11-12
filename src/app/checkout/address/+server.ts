import { json } from '@sveltejs/kit';
import { addressSuggestion, matchesAddressQuery, type AddressHit } from '../../../domain/address';
import type { RequestHandler } from './$types';

const LOOKUP = 'https://photon.komoot.io/api/';

export const GET: RequestHandler = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 3) return json({ suggestions: [] });

  const endpoint = new URL(LOOKUP);
  endpoint.searchParams.set('q', q);
  endpoint.searchParams.set('limit', '8');
  endpoint.searchParams.set('lang', 'en');

  try {
    const response = await fetch(endpoint, {
      headers: {
        accept: 'application/json',
        'user-agent': 'Elboon checkout (https://elboon.com)'
      },
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return json({ suggestions: [] });
    const body = (await response.json()) as { features?: { properties?: AddressHit }[] };
    const suggestions = [];
    const seen = new Set<string>();
    for (const feature of body.features ?? []) {
      const suggestion = addressSuggestion(feature.properties ?? {});
      if (!suggestion || !matchesAddressQuery(suggestion, q) || seen.has(suggestion.label)) continue;
      seen.add(suggestion.label);
      suggestions.push(suggestion);
      if (suggestions.length === 5) break;
    }
    return json({ suggestions });
  } catch {
    return json({ suggestions: [] });
  }
};
