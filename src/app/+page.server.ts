import { productFromRow, toProductSummary } from '../domain/product';
import { getStore } from '../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category');
  try {
    const rows = await getStore().listActiveProducts(category);
    const products = rows.map(productFromRow).map(toProductSummary);
    return { products, category };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return { products: [], category };
  }
};
