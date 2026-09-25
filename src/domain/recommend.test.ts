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
    offerEnabled: false
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
});
