import { productFromRow, toProductSummary, type ProductRow } from '../domain/product';
import { getStore } from '../libs/store';
import type { PageServerLoad } from './$types';

function matchesQuery(row: ProductRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${row.name} ${row.description} ${row.category}`.toLowerCase().includes(needle);
}

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q')?.trim() ?? '';
  try {
    const store = getStore();
    const [rows, categories] = await Promise.all([store.listActiveProducts(category), store.listCategories()]);
    const products = rows.filter((row) => matchesQuery(row, q)).map(productFromRow).map(toProductSummary);
    return { products, category, categories, q };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return { products: [], category, categories: [], q };
  }
};
