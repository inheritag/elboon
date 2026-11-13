import { fail } from '@sveltejs/kit';
import { listedInventory } from '../../../../domain/desk';
import { heldMap, stockView } from '../../../../domain/inventory';
import { categoryFromForm } from '../../../../libs/category-form';
import { getStore, type CreateProductInput } from '../../../../libs/store';
import { colorsFromForm, sizesFromForm } from '../../../../libs/product-colors';
import { discountFromForm } from '../../../../domain/price';
import { parseSku, productFromRow, totalUnits } from '../../../../domain/product';
import { saveProductImages } from '../../../../libs/uploads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const store = getStore();
  const [products, categories, holds] = await Promise.all([
    store.listAllProducts(),
    store.listCategories(),
    store.listHeldUnits()
  ]);
  const held = heldMap(holds);
  const stock = Object.fromEntries(products.map((row) => [row.id, stockView(productFromRow(row), held)]));
  return { products, categories, listed: listedInventory(products, held), stock };
};

async function productFromForm(form: FormData): Promise<CreateProductInput | { error: string }> {
  const name = form.get('name');
  const price = Number(form.get('price'));
  const category = await categoryFromForm(form);

  if (typeof category === 'object') return category;
  if (typeof name !== 'string' || !name || !price) {
    return { error: 'Name, category and price are required' };
  }
  const discountPercent = discountFromForm(form.get('discount'));
  if (typeof discountPercent !== 'number') return discountPercent;

  let imageUrls: string[] | undefined;
  let colors;
  let sizes;
  try {
    const uploaded = await saveProductImages(form);
    if (uploaded.length > 0) imageUrls = uploaded;
    colors = await colorsFromForm(form);
    sizes = sizesFromForm(form);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save images' };
  }

  if (colors.length > 0) sizes = sizes.map((size) => ({ ...size, stockQty: 0 }));
  const stockQty = totalUnits({ colors, sizes, stockQty: Number(form.get('stockQty') ?? 0) });
  const sku = colors.length > 0 || sizes.length > 0 ? null : parseSku(form.get('sku'));

  return {
    name,
    description: String(form.get('description') ?? ''),
    priceCents: Math.round(price * 100),
    discountPercent,
    category,
    stockQty,
    lowStockThreshold: Number(form.get('lowStockThreshold') ?? 3),
    offerEnabled: form.get('offerEnabled') === 'on',
    active: form.get('active') === 'on',
    imageUrls,
    sku,
    colors,
    sizes
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
