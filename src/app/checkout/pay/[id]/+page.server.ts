import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { config } from '../../../../libs/config';
import { fulfillPendingOrder } from '../../../../libs/fulfillment';
import { getStore } from '../../../../libs/store';
import { checkoutUrl } from '../../../../libs/stripe-pay';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const order = await getStore().getPendingOrder(params.id);
  if (!order) {
    error(404, 'Payment session not found');
  }
  return { order, stripe: Boolean(config.stripeApiKey()) };
};

export const actions: Actions = {
  pay: async ({ params }) => {
    if (!config.stripeApiKey()) {
      if (!config.isDevMode()) return fail(400, { error: 'Payment is not set up.' });
      const ok = await fulfillPendingOrder(params.id);
      if (!ok) error(400, 'This order is no longer awaiting payment');
      redirect(303, `/checkout/success?orderId=${params.id}`);
    }

    const order = await getStore().getOrder(params.id);
    if (!order || order.payment_status !== 'pending') {
      error(400, 'This order is no longer awaiting payment');
    }

    try {
      const url = await checkoutUrl(order);
      redirect(303, url);
    } catch (err) {
      if (isRedirect(err)) throw err;
      console.error('Stripe checkout failed', params.id, err);
      return fail(400, { error: 'Payment could not be started. Try again.' });
    }
  },

  cancel: async () => {
    redirect(303, '/cart');
  }
};