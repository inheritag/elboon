import {
  categoryNav,
  categoryPath,
  categoryTrail,
  inCategoryTree,
  type CategoryNavLevel,
  type CategoryRecord
} from '../domain/catalog';
import { heldMap, totalAvailable } from '../domain/inventory';
import { categoryBands, groupListings, parseSort, sortListings } from '../domain/listing';
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

function coverImage(rows: ProductRow[], slug: string | null, categories: CategoryRecord[]): string | null {
  const row = rows.find((item) => {
    if (!item.image_urls[0]) return false;
    if (!slug) return true;
    return inCategoryTree(item.category, slug, categories);
  });
  return row?.image_urls[0] ?? null;
}

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q')?.trim() ?? '';
  const sort = parseSort(url.searchParams.get('sort'));
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
    const grouped = sortListings(groupListings(matched), sort);
    const nav = categoryNav(category, categories);
    const heroImage = !category && !q ? (coverImage(rows, 'fashion', categories) ?? coverImage(rows, null, categories)) : null;
    const heroProduct = heroImage ? rows.find((row) => row.image_urls[0] === heroImage) : undefined;
    const browsingAll = !category && !q;
    const homeListings = browsingAll
      ? grouped.filter((item) => !(heroProduct && item.options.length === 1 && item.id === heroProduct.id))
      : grouped;
    const window = paginate(browsingAll ? [] : grouped, requestedPage);
    const bands = browsingAll ? categoryBands(homeListings, categories) : null;
    return {
      products: window.items,
      bands,
      total: browsingAll ? homeListings.length : window.total,
      page: browsingAll ? 1 : window.page,
      pages: browsingAll ? 1 : window.pages,
      sort,
      category,
      categories,
      nav,
      trail: categoryTrail(category, categories),
      categoryLabel: category ? categoryPath(category, categories) : null,
      q,
      hero: heroImage && heroProduct ? { imageUrl: heroImage, href: `/product/${heroProduct.id}` } : null
    };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return {
      products: [],
      bands: null,
      total: 0,
      page: 1,
      pages: 1,
      sort,
      category,
      categories: [],
      nav: emptyNav,
      trail: [],
      categoryLabel: category,
      q,
      hero: null
    };
  }
};
