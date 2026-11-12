import Stripe from 'stripe';
import { CHECKOUT_HOLD_MS } from '../domain/inventory';
import { config } from './config';
import { getStore, type OrderRecord } from './store';

let client: Stripe | null = null;

const STRIPE_MIN_LIFE_SEC = 30 * 60;

/** Where Stripe should send the shopper back. A live key rejects http://localhost. */
export function checkoutOrigin(requestOrigin: string, configured = config.siteUrl()): string {
  const site = configured.trim().replace(/\/$/, '');
  const fromRequest = requestOrigin.trim().replace(/\/$/, '');
  if (site.startsWith('https://')) return site;
  if (fromRequest.startsWith('https://')) return fromRequest;
  return site;
}

/** Unix time when the stock hold ends. */
export function holdExpiresAtSec(createdAt: string): number | null {
  const start = Date.parse(createdAt);
  if (!Number.isFinite(start)) return null;
  return Math.floor((start + CHECKOUT_HOLD_MS) / 1000);
}

/**
 * Checkout must end with the stock hold, and Stripe will not open a session
 * shorter than 30 minutes. Null means the pay button should refuse.
 */
export function checkoutExpiresAt(createdAt: string, now = Date.now()): number | null {
  const expires = holdExpiresAtSec(createdAt);
  if (expires === null) return null;
  if (expires < Math.floor(now / 1000) + STRIPE_MIN_LIFE_SEC) return null;
  return expires;
}

export interface PayableSession {
  status?: string | null;
  payment_status?: string | null;
  url?: string | null;
  expires_at?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: { orderId?: string | null } | null;
  client_reference_id?: string | null;
}

/** Paid, still open on this hold, or needs a replacement session. */
export function reuseCheckoutSession(
  session: PayableSession,
  order: { id: string; total_cents: number },
  holdExpiresAt: number
): 'open' | 'paid' | 'mismatch' | 'replace' {
  const claimsOrder = session.metadata?.orderId === order.id || session.client_reference_id === order.id;
  const amountOk = session.amount_total === order.total_cents && session.currency?.toLowerCase() === 'gbp';
  if (session.status === 'complete' && session.payment_status === 'paid') {
    return claimsOrder && amountOk ? 'paid' : 'mismatch';
  }
  const expiresAt = session.expires_at ?? 0;
  if (
    session.status === 'open' &&
    session.url &&
    claimsOrder &&
    amountOk &&
    Math.abs(expiresAt - holdExpiresAt) <= 60
  ) {
    return 'open';
  }
  return 'replace';
}

export function paidSessionMatches(session: PayableSession, order: { id: string; total_cents: number }): boolean {
  const claimsOrder = session.metadata?.orderId === order.id || session.client_reference_id === order.id;
  return Boolean(
    claimsOrder &&
      session.payment_status === 'paid' &&
      session.amount_total === order.total_cents &&
      session.currency?.toLowerCase() === 'gbp'
  );
}

function stripe(): Stripe | null {
  const key = config.stripeApiKey();
  if (!key) return null;
  if (key.startsWith('pk_')) {
    throw new Error('A Stripe publishable key cannot take payment');
  }
  if (!client) client = new Stripe(key);
  return client;
}

function successUrl(origin: string, orderId: string, sessionId: string): string {
  return `${origin}/checkout/success?orderId=${orderId}&session_id=${sessionId}`;
}

/** Open Checkout for this order, reusing a session that is still payable. */
export async function checkoutUrl(order: OrderRecord, requestOrigin = ''): Promise<string> {
  const api = stripe();
  if (!api) throw new Error('Stripe is not configured');
  const origin = checkoutOrigin(requestOrigin);
  const expiresAt = checkoutExpiresAt(order.created_at);
  if (expiresAt === null) throw new Error('This checkout has expired');

  let replaceId: string | null = null;
  if (order.stripe_session_id) {
    const existing = await api.checkout.sessions.retrieve(order.stripe_session_id);
    const reuse = reuseCheckoutSession(existing, order, expiresAt);
    if (reuse === 'paid') return successUrl(origin, order.id, existing.id);
    if (reuse === 'mismatch') throw new Error('This payment does not match the order');
    if (reuse === 'open' && existing.url) return existing.url;
    if (existing.status === 'open') await api.checkout.sessions.expire(existing.id);
    replaceId = existing.id;
  }

  const session = await api.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: order.customer_email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      expires_at: expiresAt,
      line_items: order.items.map((item) => {
        const unitAmount = Math.round(item.unitPriceCents);
        if (unitAmount < 30) throw new Error('This amount cannot be charged');
        return {
          quantity: item.quantity,
          price_data: {
            currency: 'gbp',
            unit_amount: unitAmount,
            product_data: { name: item.productName.trim().slice(0, 250) || 'Item' }
          }
        };
      }),
      success_url: `${origin}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`
    },
    { idempotencyKey: `checkout-${order.id}-${expiresAt}` }
  );

  if (!session.url) throw new Error('Stripe did not return a checkout link');
  const saved = await getStore().setStripeSession(order.id, session.id, replaceId);
  if (saved === 'kept') {
    const current = await getStore().getOrder(order.id);
    if (current?.stripe_session_id && current.stripe_session_id !== session.id) {
      const stored = await api.checkout.sessions.retrieve(current.stripe_session_id);
      const reuse = reuseCheckoutSession(stored, current, expiresAt);
      if (reuse === 'paid') return successUrl(origin, current.id, stored.id);
      if (reuse === 'open' && stored.url) return stored.url;
      if (reuse === 'mismatch') throw new Error('This payment does not match the order');
    }
  }
  return session.url;
}

/** Paid and the amount matches, unpaid, or a session we should not treat as unpaid. */
export async function sessionOutcome(
  sessionId: string,
  orderId: string
): Promise<'paid' | 'unpaid' | 'mismatch'> {
  const api = stripe();
  if (!api) return 'unpaid';
  const order = await getStore().getOrder(orderId);
  if (!order) return 'unpaid';
  const session = await api.checkout.sessions.retrieve(sessionId);
  const claimsOrder = session.metadata?.orderId === orderId || session.client_reference_id === orderId;
  if (!claimsOrder) return 'mismatch';
  if (session.payment_status !== 'paid') return 'unpaid';
  return paidSessionMatches(session, order) ? 'paid' : 'mismatch';
}

export function stripeClient(): Stripe | null {
  return stripe();
}
