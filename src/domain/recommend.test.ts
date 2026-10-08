import { describe, expect, it } from 'vitest';
import type { ProductSummary } from './product';
import { recommendProducts } from './recommend';

function item(id: string, category: string): ProductSummary {
  return {
    id,
    name: id,
    priceCents: 1000,
    currency: 'GBP',
    category,
    imageUrl: null,
    lowStock: false,
    remainingQty: null,
    offerEnabled: false,
    colors: [],
    sizes: []
  };
}

describe('recommendProducts', () => {
  it('prefers the same category, then complementary ones', () => {
    const catalog = [
      item('cable', 'accessories'),
      item('speaker', 'tech'),
      item('throw', 'home'),
      item('serum', 'beauty')
    ];
    const ranked = recommendProducts({ id: 'earbuds', category: 'tech' }, catalog);
    expect(ranked.map((row) => row.id)).toEqual(['speaker', 'cable']);
  });

  it('treats nested categories as the same top-level branch', () => {
    const catalog = [item('s20', 'phones'), item('speaker', 'tech'), item('cable', 'accessories')];
    const categories = [
      { slug: 'tech', label: 'tech', parentSlug: null },
      { slug: 'phones', label: 'phones', parentSlug: 'tech' },
      { slug: 'accessories', label: 'accessories', parentSlug: null }
    ];
    const ranked = recommendProducts({ id: 's10', category: 'phones' }, catalog, 4, categories);
    expect(ranked.map((row) => row.id)).toEqual(['s20', 'speaker', 'cable']);
  });
});
