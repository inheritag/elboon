import { describe, expect, it } from 'vitest';
import { clickAndDropOrder } from './shipment';

const shipping = {
  fullName: 'Ada Lovelace',
  phone: '+44 7700 900123 extra-digits',
  line1: '1 Computer Lane',
  line2: 'Flat 2',
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'United Kingdom'
};

describe('clickAndDropOrder', () => {
  it('builds a Royal Mail order in pounds with a country code', () => {
    const order = clickAndDropOrder({
      orderId: '11111111-1111-4111-8111-111111111111',
      email: 'ada@example.com',
      totalCents: 4999,
      orderedAt: '2026-11-12T10:00:00.000Z',
      shipping
    });

    expect(order?.recipient.address.countryCode).toBe('GBR');
    expect(order?.total).toBe(49.99);
    expect(order?.shippingCostCharged).toBe(0);
    expect(order?.recipient.phoneNumber).toHaveLength(25);
    expect(order?.recipient.address.addressLine2).toBe('Flat 2');
    expect(order?.currencyCode).toBe('GBP');
  });

  it('skips an address field that is not text', () => {
    expect(
      clickAndDropOrder({
        orderId: 'abc',
        email: 'ada@example.com',
        totalCents: 1000,
        orderedAt: '2026-11-12T10:00:00.000Z',
        shipping: { ...shipping, postcode: null as unknown as string }
      })
    ).toBeNull();
  });

  it('skips a country we cannot code', () => {
    expect(
      clickAndDropOrder({
        orderId: 'abc',
        email: 'ada@example.com',
        totalCents: 1000,
        orderedAt: '2026-11-12T10:00:00.000Z',
        shipping: { ...shipping, country: 'Atlantis' }
      })
    ).toBeNull();
  });
});