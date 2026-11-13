import { describe, expect, it } from 'vitest';
import { emailFailure, ownerOrderHtml } from './email';

describe('owner order email', () => {
  it('tells the shop who paid, what to send, and where', () => {
    const html = ownerOrderHtml({
      customerEmail: 'ada@example.com',
      total: '£49.99',
      items: [{ productId: '1', productName: 'Wireless Earbuds', quantity: 1, unitPriceCents: 4999, color: 'Black', size: null }],
      shipping: {
        fullName: 'Ada <script>',
        phone: '07000000000',
        line1: '1 Road',
        line2: null,
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      booked: false,
      trackingNumber: null,
      adminUrl: 'https://elboon.com/admin/orders'
    });

    expect(html).toContain('ada@example.com');
    expect(html).toContain('paid');
    expect(html).toContain('£49.99');
    expect(html).toContain('1 × Wireless Earbuds, Black');
    expect(html).toContain('Ada &lt;script&gt;');
    expect(html).toContain('Not booked with Royal Mail yet.');
    expect(html).toContain('https://elboon.com/admin/orders');
  });
});

describe('email send result', () => {
  it('treats a Resend error as a failed send', () => {
    expect(emailFailure({ data: null, error: { message: 'The domain is not verified' } })).toBe(
      'The domain is not verified'
    );
    expect(emailFailure({ data: null, error: { message: '' } })).toBe('Email was not sent');
  });

  it('treats a missing id as a failed send', () => {
    expect(emailFailure({ data: null, error: null })).toBe('Email was not sent');
  });

  it('accepts a send that returned an id', () => {
    expect(emailFailure({ data: { id: 'em_1' }, error: null })).toBeNull();
  });
});
