import { error } from '@sveltejs/kit';
import { config } from '../../../libs/config';
import { fulfillPendingOrder } from '../../../libs/fulfillment';
import { getStore } from '../../../libs/store';
import { sessionOutcome } from '../../../libs/stripe-pay';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const orderId = url.searchParams.get('orderId');
  if (!orderId) error(404, 'Order not found');

  let uncertain = false;
  const sessionId = url.searchParams.get('session_id');
  if (sessionId && config.stripeApiKey()) {
    try {
      const outcome = await sessionOutcome(sessionId, orderId);
      if (outcome === 'paid') await fulfillPendingOrder(orderId);
      else if (outcome === 'mismatch') uncertain = true;
    } catch (err) {
      console.error('Could not confirm Stripe payment', orderId, err);
      uncertain = true;
    }
  } else if (config.isDevMode() && !config.stripeApiKey()) {
    const existing = await getStore().getOrder(orderId);
    if (existing?.payment_status === 'paid') {
      try {
        await fulfillPendingOrder(orderId, { book: false });
      } catch (err) {
        console.error('Could not finish the paid order', orderId, err);
        uncertain = true;
      }
    }
  }

  const order = await getStore().getOrder(orderId);
  if (!order) error(404, 'Order not found');

  const view = order.payment_status === 'paid' ? 'paid' : uncertain ? 'checking' : 'unpaid';
  return {
    orderId,
    view,
    booked: Boolean(order.carrier_ref),
    tracking: order.tracking_number
  };
};
