import { describe, expect, it } from 'vitest';
import { isCompleteShipping, ordersForShopper, shopperOrderStatus } from './order';

const address = {
  fullName: 'Ada Lovelace',
  phone: '+44 7700 900123',
  line1: '1 Computer Lane',
  line2: null,
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'United Kingdom'
};

describe('isCompleteShipping', () => {
  it('accepts a full address, including an empty postcode', () => {
    expect(isCompleteShipping(address)).toBe(true);
    expect(isCompleteShipping({ ...address, postcode: '' })).toBe(true);
  });

  it('rejects a missing country or a postcode that is not text', () => {
    expect(isCompleteShipping({ ...address, country: '' })).toBe(false);
    expect(isCompleteShipping({ ...address, postcode: null as unknown as string })).toBe(false);
  });
});

describe('shopper orders', () => {
  const base = {
    id: 'order-1',
    customer_email: 'Ada@elboon.test',
    items: [{ productId: 'p', productName: 'Wireless Earbuds', quantity: 1, unitPriceCents: 4999 }],
    total_cents: 4999,
    payment_status: 'paid' as const,
    logistics_status: 'awaiting_partner' as const,
    carrier_ref: null,
    tracking_number: null,
    created_at: '2026-11-01T00:00:00.000Z'
  };

  it('keeps paid orders for this email and hides everyone else', () => {
    const orders = ordersForShopper('ada@elboon.test', [
      base,
      { ...base, id: 'pending', payment_status: 'pending' },
      { ...base, id: 'other', customer_email: 'other@elboon.test' }
    ]);
    expect(orders.map((order) => order.id)).toEqual(['order-1']);
    expect(orders[0].status).toBe('Payment received. We will be in touch about delivery.');
    expect(orders[0].items[0]).toMatchObject({ name: 'Wireless Earbuds', quantity: 1 });
  });

  it('uses the same delivery lines as the order email', () => {
    expect(shopperOrderStatus({ ...base, carrier_ref: 'rm-1' })).toBe(
      'Payment received. We will send it with Royal Mail.'
    );
    expect(shopperOrderStatus({ ...base, logistics_status: 'handed_off' })).toBe('Sent.');
    expect(shopperOrderStatus({ ...base, tracking_number: 'AB123' })).toBe(
      'Payment received. Royal Mail tracking is AB123.'
    );
  });
});
