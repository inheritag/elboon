import { fail } from '@sveltejs/kit';
import { isCategory } from '../../../../domain/catalog';
import { getStore, type CreateProductInput } from '../../../../libs/store';
import { saveProductImages } from '../../../../libs/uploads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const products = await getStore().listAllProducts();
  return { products };
};

async function productFromForm(form: FormData): Promise<CreateProductInput | { error: string }> {
  const name = form.get('name');
  const category = form.get('category');
  const price = Number(form.get('price'));

  if (typeof name !== 'string' || !name || typeof category !== 'string' || !isCategory(category) || !price) {
    return { error: 'Name, category and price are required' };
  }

  let imageUrls: string[] | undefined;
  try {
    const uploaded = await saveProductImages(form);
    if (uploaded.length > 0) imageUrls = uploaded;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save images' };
  }

  return {
    name,
    description: String(form.get('description') ?? ''),
    priceCents: Math.round(price * 100),
    category,
    stockQty: Number(form.get('stockQty') ?? 0),
    lowStockThreshold: Number(form.get('lowStockThreshold') ?? 3),
    offerEnabled: form.get('offerEnabled') === 'on',
    active: form.get('active') === 'on',
    imageUrls
  };
}

export const actions: Actions = {
  create: async ({ request }) => {
    const input = await productFromForm(await request.formData());
    if ('error' in input) return fail(400, { error: input.error });
    await getStore().createProduct(input);
    return { success: true };
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'Missing product id' });
    await getStore().deleteProduct(id);
    return { success: true };
  },

  toggleActive: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'Missing product id' });
    await getStore().toggleProductActive(id);
    return { success: true };
  }
};
