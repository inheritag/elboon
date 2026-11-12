import { describe, expect, it } from 'vitest';
import { isCompleteShipping } from './order';

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
