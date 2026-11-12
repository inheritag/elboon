import type Stripe from 'stripe';
import { fulfillPendingOrder } from '../../../libs/fulfillment';
import { config } from '../../../libs/config';
import { paidSessionMatches, stripeClient } from '../../../libs/stripe-pay';
import { getStore } from '../../../libs/store';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const secret = config.stripeWebhookSecret();
  const stripe = stripeClient();
  if (!secret || !stripe) return new Response('Webhook is not set up', { status: 400 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response('Bad signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') return new Response('ok');

  const session = event.data.object;
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (session.payment_status !== 'paid' || !orderId) return new Response('ok');

  try {
    const order = await getStore().getOrder(orderId);
    if (!order) return new Response('ok');
    if (!paidSessionMatches(session, order)) {
      console.error('Stripe session does not match the order', orderId);
      return new Response('ok');
    }
    await fulfillPendingOrder(orderId);
  } catch (err) {
    console.error('Could not finish the paid order', orderId, err);
    return new Response('retry', { status: 500 });
  }

  return new Response('ok');
};
