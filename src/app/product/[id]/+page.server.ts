import { error } from '@sveltejs/kit';
import { productFromRow, toProductSummary, type Product } from '../../../domain/product';
import { recommendProducts } from '../../../domain/recommend';
import { getStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const row = await getStore().getActiveProduct(params.id);
  if (!row) {
    error(404, 'Product not found');
  }

  const product: Product = productFromRow(row);
  const catalog = (await getStore().listActiveProducts()).map(productFromRow).map(toProductSummary);

  return {
    product,
    related: recommendProducts(product, catalog, 4)
  };
};
