import { error, fail, redirect } from '@sveltejs/kit';
import { isCategorySlug } from '../../../../../domain/catalog';
import { categoryFromForm } from '../../../../../libs/category-form';
import { getStore } from '../../../../../libs/store';
import { discountFromForm } from '../../../../../domain/price';
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
    const resolved = await categoryFromForm(form);
    if (typeof resolved === 'object') return fail(400, { error: resolved.error });
    const category = resolved;
    const known = new Set((await store.listCategories()).map((row) => row.slug));
    if (typeof name !== 'string' || !name || !price || !isCategorySlug(category) || !known.has(category)) {
      return fail(400, { error: 'Name, category and price are required' });
    }
    const discountPercent = discountFromForm(form.get('discount'));
    if (typeof discountPercent !== 'number') return fail(400, { error: discountPercent.error });

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
      discountPercent,
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
