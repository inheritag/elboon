import { productFromRow, toProductSummary } from '../domain/product';
import { getStore } from '../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category');
  try {
    const store = getStore();
    const [rows, categories] = await Promise.all([store.listActiveProducts(category), store.listCategories()]);
    const products = rows.map(productFromRow).map(toProductSummary);
    return { products, category, categories };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return { products: [], category, categories: [] };
  }
};
