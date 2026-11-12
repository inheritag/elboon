import type Stripe from 'stripe';
import { fulfillPendingOrder } from '../../../libs/fulfillment';
import { config } from '../../../libs/config';
import { stripeClient } from '../../../libs/stripe-pay';
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (session.payment_status === 'paid' && orderId) await fulfillPendingOrder(orderId);
  }

  return new Response('ok');
};