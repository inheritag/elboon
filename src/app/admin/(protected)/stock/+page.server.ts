import { fail } from '@sveltejs/kit';
import { heldMap, inventoryLines } from '../../../../domain/inventory';
import { applyReceive, productFromRow, stockFor } from '../../../../domain/product';
import { getStore } from '../../../../libs/store';
import type { Actions, PageServerLoad } from './$types';

function lineFromForm(form: FormData) {
  return {
    id: String(form.get('id') ?? ''),
    qty: Number(form.get('qty')),
    color: String(form.get('color') ?? '').trim() || null,
    size: String(form.get('size') ?? '').trim() || null
  };
}

export const load: PageServerLoad = async ({ url }) => {
  const store = getStore();
  const [products, holds] = await Promise.all([store.listAllProducts(), store.listHeldUnits()]);
  const held = heldMap(holds);
  const lines = inventoryLines(products.map(productFromRow), held);
  return {
    lines,
    q: url.searchParams.get('q') ?? '',
    lowCount: lines.filter((line) => line.listed && line.low).length,
    outCount: lines.filter((line) => line.listed && line.out).length,
    heldCount: lines.filter((line) => line.held > 0).length
  };
};

export const actions: Actions = {
  set: async ({ request }) => {
    const { id, qty, color, size } = lineFromForm(await request.formData());
    if (!id || !Number.isFinite(qty) || qty < 0) return fail(400, { error: 'Enter a stock quantity' });
    const ok = await getStore().setProductStock(id, qty, color, size);
    if (!ok) return fail(400, { error: 'Could not update that stock line' });
    return { success: true };
  },

  receive: async ({ request }) => {
    const { id, qty, color, size } = lineFromForm(await request.formData());
    if (!id || !Number.isFinite(qty) || qty <= 0) return fail(400, { error: 'Enter how many arrived' });
    const row = await getStore().getProduct(id);
    if (!row) return fail(400, { error: 'Could not update that stock line' });
    const next = applyReceive(productFromRow(row), qty, color, size);
    if (!next) return fail(400, { error: 'Could not update that stock line' });
    const ok = await getStore().setProductStock(id, stockFor(next, color, size), color, size);
    if (!ok) return fail(400, { error: 'Could not update that stock line' });
    return { success: true };
  }
};
