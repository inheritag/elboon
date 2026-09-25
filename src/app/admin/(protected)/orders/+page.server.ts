import { fail } from '@sveltejs/kit';
import { getStore } from '../../../../libs/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const orders = await getStore().listOrders();
  return { orders };
};

export const actions: Actions = {
  handoff: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'Missing order id' });
    const order = (await getStore().listOrders()).find((row) => row.id === id);
    if (!order || order.payment_status !== 'paid') {
      return fail(400, { error: 'Only paid orders can go to logistics' });
    }
    await getStore().markHandedToLogistics(id);
    return { success: true };
  }
};
