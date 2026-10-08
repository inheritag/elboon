import { error, fail, redirect } from '@sveltejs/kit';
import { isCategorySlug } from '../../../../../domain/catalog';
import { getStore } from '../../../../../libs/store';
import { parseSku, totalUnits } from '../../../../../domain/product';
import { colorsFromForm, sizesFromForm } from '../../../../../libs/product-colors';
import { keptImageUrls, saveProductImages } from '../../../../../libs/uploads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const store = getStore();
  const product = await store.getProduct(params.id);
  if (!product) {
    error(404, 'Product not found');
  }
  const categories = await store.listCategories();
  return { product, categories };
};

export const actions: Actions = {
  default: async ({ request, params }) => {
    const form = await request.formData();
    const name = form.get('name');
    const price = Number(form.get('price'));
    const store = getStore();
    let category = String(form.get('category') ?? '');
    if (category === '__new__') {
      const label = String(form.get('newCategory') ?? '').trim();
      const parent = String(form.get('newCategoryParent') ?? '').trim() || null;
      if (!label) return fail(400, { error: 'Enter a name for the new category' });
      try {
        category = (await store.createCategory(label, parent)).slug;
      } catch (err) {
        return fail(400, { error: err instanceof Error ? err.message : 'Could not add category' });
      }
    }
    const known = new Set((await store.listCategories()).map((row) => row.slug));
    if (typeof name !== 'string' || !name || !price || !isCategorySlug(category) || !known.has(category)) {
      return fail(400, { error: 'Name, category and price are required' });
    }

    let uploaded: string[];
    let colors;
    let sizes;
    try {
      uploaded = await saveProductImages(form);
      colors = await colorsFromForm(form);
      sizes = sizesFromForm(form);
    } catch (err) {
      return fail(400, { error: err instanceof Error ? err.message : 'Could not save images' });
    }

    if (colors.length > 0) sizes = sizes.map((size) => ({ ...size, stockQty: 0 }));

    await getStore().updateProduct(params.id, {
      name,
      description: String(form.get('description') ?? ''),
      priceCents: Math.round(price * 100),
      category,
      stockQty: totalUnits({ colors, sizes, stockQty: Number(form.get('stockQty') ?? 0) }),
      lowStockThreshold: Number(form.get('lowStockThreshold') ?? 3),
      offerEnabled: form.get('offerEnabled') === 'on',
      imageUrls: [...keptImageUrls(form), ...uploaded],
      sku: colors.length > 0 || sizes.length > 0 ? null : parseSku(form.get('sku')),
      colors,
      sizes
    });

    redirect(303, '/admin/products');
  }
};
