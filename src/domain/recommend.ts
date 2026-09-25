import { COMPLEMENTARY } from './catalog';
import type { ProductSummary } from './product';

/**
 * Rank other products as similar (same category) or complementary
 * (paired categories such as tech ↔ accessories).
 */
export function recommendProducts(
  product: { id: string; category: string },
  catalog: ProductSummary[],
  limit = 4
): ProductSummary[] {
  const complementary = new Set(COMPLEMENTARY[product.category] ?? []);

  return catalog
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({
      product: candidate,
      score:
        candidate.category === product.category ? 2 : complementary.has(candidate.category) ? 1 : 0
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.product);
}
