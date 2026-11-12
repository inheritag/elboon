import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { config } from '../../../../libs/config';
import { fulfillPendingOrder } from '../../../../libs/fulfillment';
import { getStore } from '../../../../libs/store';
import { checkoutExpiresAt, checkoutUrl } from '../../../../libs/stripe-pay';
import type { Actions, PageServerLoad } from './$types';

function isThrownRedirect(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const status = 'status' in err ? err.status : undefined;
  const location = 'location' in err ? err.location : undefined;
  return typeof status === 'number' && status >= 300 && status < 400 && typeof location === 'string';
}

function paymentError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/publishable( api)? key|invalid api key|not configured|secret_key_required|more_permissions_required/i.test(message)) {
    return 'Payment is not set up.';
  }
  if (/cannot be charged|unit_amount|amount must|at least .+pence/i.test(message)) {
    return 'This amount cannot be charged.';
  }
  if (/checkout has expired/i.test(message)) return 'This checkout has expired.';
  if (/does not match the order/i.test(message)) return 'Payment is being checked.';
  return 'Payment could not be started. Try again.';
}

export const load: PageServerLoad = async ({ params }) => {
  const order = await getStore().getOrder(params.id);
  if (!order || order.payment_status !== 'pending') {
    error(404, 'Payment session not found');
  }
  return {
    order: {
      id: order.id,
      customer_email: order.customer_email,
      items: order.items,
      total_cents: order.total_cents
    },
    stripe: Boolean(config.stripeApiKey()),
    devMode: config.isDevMode(),
    expired: checkoutExpiresAt(order.created_at) === null
  };
};

export const actions: Actions = {
  pay: async ({ params, url }) => {
    const order = await getStore().getOrder(params.id);
    if (!order || order.payment_status !== 'pending') {
      error(400, 'This order is no longer awaiting payment');
    }
    if (checkoutExpiresAt(order.created_at) === null) {
      return fail(400, { error: 'This checkout has expired.' });
    }

    if (!config.stripeApiKey()) {
      if (!config.isDevMode()) return fail(400, { error: 'Payment is not set up.' });
      try {
        const ok = await fulfillPendingOrder(params.id, { book: false });
        if (!ok) error(400, 'This order is no longer awaiting payment');
      } catch (err) {
        const current = await getStore().getOrder(params.id);
        if (current?.payment_status !== 'paid') throw err;
        console.error('Could not finish the paid order', params.id, err);
      }
      redirect(303, `/checkout/success?orderId=${params.id}`);
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
