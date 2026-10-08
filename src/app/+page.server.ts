import { paginate } from '../domain/paging';
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
  const requestedPage = Number(url.searchParams.get('page') ?? 1);
  try {
    const store = getStore();
    const [rows, categories] = await Promise.all([store.listActiveProducts(category), store.listCategories()]);
    const matched = rows.filter((row) => matchesQuery(row, q)).map(productFromRow).map(toProductSummary);
    const window = paginate(matched, requestedPage);
    return {
      products: window.items,
      total: window.total,
      page: window.page,
      pages: window.pages,
      category,
      categories,
      q
    };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return { products: [], total: 0, page: 1, pages: 1, category, categories: [], q };
  }
};
