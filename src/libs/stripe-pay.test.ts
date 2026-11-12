import { describe, expect, it } from 'vitest';
import { CHECKOUT_HOLD_MS } from '../domain/inventory';
import { checkoutExpiresAt, checkoutOrigin, paidSessionMatches, reuseCheckoutSession } from './stripe-pay';

describe('checkoutOrigin', () => {
  it('uses an https site address ahead of the request', () => {
    expect(checkoutOrigin('https://elboon.com', 'https://elboon.com/')).toBe('https://elboon.com');
  });

  it('uses the live request when the configured address is localhost', () => {
    expect(checkoutOrigin('https://elboon.com', 'http://localhost:5173')).toBe('https://elboon.com');
  });

  it('keeps localhost for a local http request', () => {
    expect(checkoutOrigin('http://localhost:5173', 'http://localhost:5173')).toBe('http://localhost:5173');
  });
});

describe('checkout expiry', () => {
  const now = Date.parse('2026-11-12T12:00:00.000Z');

  it('ends the Checkout session when the stock hold ends', () => {
    const created = new Date(now - 10 * 60 * 1000).toISOString();
    expect(checkoutExpiresAt(created, now)).toBe(Math.floor((now - 10 * 60 * 1000 + CHECKOUT_HOLD_MS) / 1000));
  });

  it('refuses a session when under 30 minutes of the hold remain', () => {
    const created = new Date(now - 40 * 60 * 1000).toISOString();
    expect(checkoutExpiresAt(created, now)).toBeNull();
  });
});

describe('paid Checkout sessions', () => {
  const order = { id: 'order-1', total_cents: 840 };

  it('matches a paid session for this order and amount', () => {
    const session = {
      status: 'complete',
      payment_status: 'paid',
      amount_total: 840,
      currency: 'gbp',
      metadata: { orderId: 'order-1' },
      client_reference_id: 'order-1',
      expires_at: 1_700_000_000,
      url: 'https://checkout.stripe.com/c/pay/cs_test'
    };
    expect(paidSessionMatches(session, order)).toBe(true);
    expect(paidSessionMatches({ ...session, amount_total: 100 }, order)).toBe(false);
    expect(paidSessionMatches({ ...session, currency: 'usd' }, order)).toBe(false);
    expect(reuseCheckoutSession(session, order, 1_700_000_000)).toBe('paid');
  });

  it('reuses an open session on the same hold and replaces a longer one', () => {
    const open = {
      status: 'open',
      payment_status: 'unpaid',
      amount_total: 840,
      currency: 'gbp',
      metadata: { orderId: 'order-1' },
      url: 'https://checkout.stripe.com/c/pay/cs_test',
      expires_at: 1_700_000_000
    };
    expect(reuseCheckoutSession(open, order, 1_700_000_000)).toBe('open');
    expect(reuseCheckoutSession(open, order, 1_700_000_000 + 3600)).toBe('replace');
    expect(reuseCheckoutSession({ ...open, payment_status: 'paid', status: 'complete', amount_total: 100 }, order, 1_700_000_000)).toBe(
      'mismatch'
    );
  });
});
