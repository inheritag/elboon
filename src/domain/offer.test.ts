import { describe, expect, it } from 'vitest';
import { applyOfferAction, checkoutPriceForOffer, type Offer } from './offer';

function pendingOffer(offerPriceCents = 5000): Offer {
  return { status: 'pending', offerPriceCents, counterPriceCents: null };
}

describe('applyOfferAction', () => {
  it('accepts a pending offer at the customer price', () => {
    const result = applyOfferAction(pendingOffer(), { type: 'accept' });
    expect(result.status).toBe('accepted');
    expect(checkoutPriceForOffer(result)).toBe(5000);
  });

  it('ignores a pending offer without a checkout price', () => {
    const result = applyOfferAction(pendingOffer(), { type: 'ignore' });
    expect(result.status).toBe('ignored');
    expect(checkoutPriceForOffer(result)).toBeNull();
  });

  it('counters a pending offer with a new price', () => {
    const result = applyOfferAction(pendingOffer(), { type: 'counter', counterPriceCents: 6000 });
    expect(result.status).toBe('countered');
    expect(checkoutPriceForOffer(result)).toBe(6000);
  });

  it('refuses to resolve an offer that is already terminal', () => {
    const accepted = applyOfferAction(pendingOffer(), { type: 'accept' });
    expect(() => applyOfferAction(accepted, { type: 'ignore' })).toThrow();
  });
});
