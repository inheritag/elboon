import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { config } from '../../../../libs/config';
import { fulfillPendingOrder } from '../../../../libs/fulfillment';
import { getStore } from '../../../../libs/store';
import { checkoutUrl } from '../../../../libs/stripe-pay';
import type { Actions, PageServerLoad } from './$types';

function isThrownRedirect(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const status = 'status' in err ? err.status : undefined;
  const location = 'location' in err ? err.location : undefined;
  return typeof status === 'number' && status >= 300 && status < 400 && typeof location === 'string';
}

function paymentError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/publishable key|invalid api key|not configured/i.test(message)) return 'Payment is not set up.';
  if (/cannot be charged|unit_amount|amount must|at least .+pence/i.test(message)) {
    return 'This amount cannot be charged.';
  }
  return 'Payment could not be started. Try again.';
}

export const load: PageServerLoad = async ({ params }) => {
  const order = await getStore().getPendingOrder(params.id);
  if (!order) {
    error(404, 'Payment session not found');
  }
  return { order, stripe: Boolean(config.stripeApiKey()) };
};

export const actions: Actions = {
  pay: async ({ params, url }) => {
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
      const checkout = await checkoutUrl(order, url.origin);
      redirect(303, checkout);
    } catch (err) {
      if (isRedirect(err) || isThrownRedirect(err)) throw err;
      console.error('Stripe checkout failed', params.id, err);
      return fail(400, { error: paymentError(err) });
    }
  },

  cancel: async () => {
    redirect(303, '/cart');
  }
};