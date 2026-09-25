import { error, fail, redirect } from '@sveltejs/kit';
import { isCategory } from '../../../../../domain/catalog';
import { getStore } from '../../../../../libs/store';
import { keptImageUrls, saveProductImages } from '../../../../../libs/uploads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const product = await getStore().getProduct(params.id);
  if (!product) {
    error(404, 'Product not found');
  }
  return { product };
};

export const actions: Actions = {
  default: async ({ request, params }) => {
    const form = await request.formData();
    const name = form.get('name');
    const category = form.get('category');
    const price = Number(form.get('price'));

    if (typeof name !== 'string' || !name || !price || typeof category !== 'string' || !isCategory(category)) {
      return fail(400, { error: 'Name, category and price are required' });
    }

    let uploaded: string[];
    try {
      uploaded = await saveProductImages(form);
    } catch (err) {
      return fail(400, { error: err instanceof Error ? err.message : 'Could not save images' });
    }

    await getStore().updateProduct(params.id, {
      name,
      description: String(form.get('description') ?? ''),
      priceCents: Math.round(price * 100),
      category,
      stockQty: Number(form.get('stockQty') ?? 0),
      lowStockThreshold: Number(form.get('lowStockThreshold') ?? 3),
      offerEnabled: form.get('offerEnabled') === 'on',
      imageUrls: [...keptImageUrls(form), ...uploaded]
    });

    redirect(303, '/admin/products');
  }
};
