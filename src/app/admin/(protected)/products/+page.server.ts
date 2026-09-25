import { fail } from '@sveltejs/kit';
import { isCategorySlug } from '../../../../domain/catalog';
import { getStore, type CreateProductInput } from '../../../../libs/store';
import { saveProductImages } from '../../../../libs/uploads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const store = getStore();
  const [products, categories] = await Promise.all([store.listAllProducts(), store.listCategories()]);
  return { products, categories };
};

async function resolveCategory(form: FormData): Promise<string | { error: string }> {
  const selected = String(form.get('category') ?? '');
  const store = getStore();
  if (selected === '__new__') {
    const label = String(form.get('newCategory') ?? '').trim();
    if (!label) return { error: 'Enter a name for the new category' };
    try {
      return (await store.createCategory(label)).slug;
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not add category' };
    }
  }
  const known = new Set((await store.listCategories()).map((row) => row.slug));
  if (!isCategorySlug(selected) || !known.has(selected)) {
    return { error: 'Name, category and price are required' };
  }
  return selected;
}

async function productFromForm(form: FormData): Promise<CreateProductInput | { error: string }> {
  const name = form.get('name');
  const price = Number(form.get('price'));
  const category = await resolveCategory(form);

  if (typeof category === 'object') return category;
  if (typeof name !== 'string' || !name || !price) {
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
