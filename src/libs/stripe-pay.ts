import Stripe from 'stripe';
import { config } from './config';
import { getStore, type OrderRecord } from './store';

let client: Stripe | null = null;

function stripe(): Stripe | null {
  const key = config.stripeApiKey();
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

/** Open Checkout for this order, reusing a session that is still payable. */
export async function checkoutUrl(order: OrderRecord): Promise<string> {
  const api = stripe();
  if (!api) throw new Error('Stripe is not configured');

  if (order.stripe_session_id) {
    const existing = await api.checkout.sessions.retrieve(order.stripe_session_id);
    if (existing.status === 'open' && existing.url) return existing.url;
    if (existing.status === 'complete') {
      return `${config.siteUrl()}/checkout/success?orderId=${order.id}&session_id=${existing.id}`;
    }
  }

  const session = await api.checkout.sessions.create({
    mode: 'payment',
    customer_email: order.customer_email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'gbp',
        unit_amount: item.unitPriceCents,
        product_data: { name: item.productName.slice(0, 250) }
      }
    })),
    success_url: `${config.siteUrl()}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.siteUrl()}/checkout/cancel`
  });

  if (!session.url) throw new Error('Stripe did not return a checkout link');
  await getStore().setStripeSession(order.id, session.id);
  return session.url;
}

/** True when this Checkout session is paid and belongs to the order. */
export async function sessionIsPaid(sessionId: string, orderId: string): Promise<boolean> {
  const api = stripe();
  if (!api) return false;
  const session = await api.checkout.sessions.retrieve(sessionId);
  const matches = session.metadata?.orderId === orderId || session.client_reference_id === orderId;
  return matches && session.payment_status === 'paid';
}

export function stripeClient(): Stripe | null {
  return stripe();
}