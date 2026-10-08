import { COMPLEMENTARY, rootCategory, type CategoryRecord } from './catalog';
import type { ProductSummary } from './product';

/**
 * Rank other products as similar (same category or same top-level branch)
 * or complementary (paired top-level categories such as tech ↔ accessories).
 */
export function recommendProducts(
  product: { id: string; category: string },
  catalog: ProductSummary[],
  limit = 4,
  categories: CategoryRecord[] = []
): ProductSummary[] {
  const productRoot = rootCategory(product.category, categories)?.slug ?? product.category;
  const complementary = new Set(COMPLEMENTARY[productRoot] ?? []);

  return catalog
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      const candidateRoot = rootCategory(candidate.category, categories)?.slug ?? candidate.category;
      const score =
        candidate.category === product.category
          ? 3
          : candidateRoot === productRoot
            ? 2
            : complementary.has(candidateRoot)
              ? 1
              : 0;
      return { product: candidate, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.product);
}
