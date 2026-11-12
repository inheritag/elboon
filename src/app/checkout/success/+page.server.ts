import { error } from '@sveltejs/kit';
import { config } from '../../../libs/config';
import { fulfillPendingOrder } from '../../../libs/fulfillment';
import { getStore } from '../../../libs/store';
import { sessionIsPaid } from '../../../libs/stripe-pay';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const orderId = url.searchParams.get('orderId');
  if (!orderId) error(404, 'Order not found');

  const sessionId = url.searchParams.get('session_id');
  if (sessionId && config.stripeApiKey()) {
    try {
      if (await sessionIsPaid(sessionId, orderId)) await fulfillPendingOrder(orderId);
    } catch (err) {
      console.error('Could not confirm Stripe payment', orderId, err);
    }
  }

  const order = await getStore().getOrder(orderId);
  if (!order) error(404, 'Order not found');

  return {
    orderId,
    paid: order.payment_status === 'paid',
    booked: Boolean(order.carrier_ref),
    tracking: order.tracking_number
  };
};