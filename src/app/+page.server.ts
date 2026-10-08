import {
  categoryNav,
  categoryPath,
  categoryTrail,
  inCategoryTree,
  type CategoryNavLevel,
  type CategoryRecord
} from '../domain/catalog';
import { heldMap, totalAvailable } from '../domain/inventory';
import { paginate } from '../domain/paging';
import { productFromRow, toProductSummary, type ProductRow } from '../domain/product';
import { getStore } from '../libs/store';
import type { PageServerLoad } from './$types';

function matchesQuery(row: ProductRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${row.name} ${row.description} ${row.category}`.toLowerCase().includes(needle);
}

const emptyNav: { top: CategoryRecord[]; levels: CategoryNavLevel[] } = { top: [], levels: [] };

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q')?.trim() ?? '';
  const requestedPage = Number(url.searchParams.get('page') ?? 1);
  try {
    const store = getStore();
    const [rows, categories, holds] = await Promise.all([
      store.listActiveProducts(),
      store.listCategories(),
      store.listHeldUnits()
    ]);
    const held = heldMap(holds);
    const matched = rows
      .filter((row) => inCategoryTree(row.category, category, categories))
      .filter((row) => matchesQuery(row, q))
      .map(productFromRow)
      .map((product) => toProductSummary(product, totalAvailable(product, held)));
    const window = paginate(matched, requestedPage);
    return {
      products: window.items,
      total: window.total,
      page: window.page,
      pages: window.pages,
      category,
      categories,
      nav: categoryNav(category, categories),
      trail: categoryTrail(category, categories),
      categoryLabel: category ? categoryPath(category, categories) : null,
      q
    };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return {
      products: [],
      total: 0,
      page: 1,
      pages: 1,
      category,
      categories: [],
      nav: emptyNav,
      trail: [],
      categoryLabel: category,
      q
    };
  }
};
