import { error, redirect } from '@sveltejs/kit';
import { fulfillPendingOrder } from '../../../../libs/fulfillment';
import { getStore } from '../../../../libs/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const order = await getStore().getPendingOrder(params.id);
  if (!order) {
    error(404, 'Payment session not found');
  }
  return { order };
};

export const actions: Actions = {
  pay: async ({ params }) => {
    const ok = await fulfillPendingOrder(params.id);
    if (!ok) {
      error(400, 'This order is no longer awaiting payment');
    }
    redirect(303, `/checkout/success?orderId=${params.id}`);
  },

  cancel: async () => {
    redirect(303, '/cart');
  }
};
