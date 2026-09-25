import { describe, expect, it } from 'vitest';
import { chargeCard, detectCardBrand, luhnValid } from './card';

describe('card', () => {
  it('detects Visa and Mastercard only', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa');
    expect(detectCardBrand('5555555555554444')).toBe('mastercard');
    expect(detectCardBrand('378282246310005')).toBeNull();
  });

  it('rejects numbers that fail Luhn', () => {
    expect(luhnValid('4242424242424242')).toBe(true);
    expect(luhnValid('4242424242424241')).toBe(false);
  });

  it('charges a valid Visa and returns only brand + last4', () => {
    const result = chargeCard({
      number: '4242 4242 4242 4242',
      expiry: '12/29',
      cvc: '123',
      nameOnCard: 'Ada Lovelace'
    });
    expect(result).toEqual({ brand: 'visa', last4: '4242' });
  });

  it('refuses Amex and other networks', () => {
    const result = chargeCard({
      number: '378282246310005',
      expiry: '12/29',
      cvc: '1234',
      nameOnCard: 'Ada Lovelace'
    });
    expect(result).toEqual({ error: 'We only accept Visa and Mastercard' });
  });
});
