import { describe, expect, it } from 'vitest';
import { COUNTRIES } from './countries';
import { addressSuggestion, matchesAddressQuery, SHIPPABLE_COUNTRY_CODES } from './address';

describe('addressSuggestion', () => {
  it('covers every country the shop ships to', () => {
    expect(new Set(Object.values(SHIPPABLE_COUNTRY_CODES))).toEqual(new Set(COUNTRIES));
  });

  it('builds a street address from a house number', () => {
    expect(
      addressSuggestion({
        housenumber: '10',
        street: 'Downing Street',
        city: 'London',
        postcode: 'SW1A 2AA',
        countrycode: 'gb'
      })
    ).toEqual({
      label: '10 Downing Street, London, SW1A 2AA',
      line1: '10 Downing Street',
      city: 'London',
      postcode: 'SW1A 2AA',
      country: 'United Kingdom'
    });
  });

  it('uses the place name when a street has no number', () => {
    expect(
      addressSuggestion({
        name: 'Adeola Odeku Street',
        city: 'Victoria Island',
        postcode: '101241',
        countrycode: 'NG'
      })?.line1
    ).toBe('Adeola Odeku Street');
  });

  it('drops a bare postcode and a country outside the shop', () => {
    expect(addressSuggestion({ name: 'M1 1AE', city: 'Manchester', countrycode: 'GB' })).toBeNull();
    expect(addressSuggestion({ street: 'Baker Street', city: 'Mannheim', countrycode: 'DE' })?.country).toBe(
      'Germany'
    );
    expect(addressSuggestion({ street: 'Main Road', city: 'Tokyo', countrycode: 'JP' })).toBeNull();
  });

  it('ignores a hit that does not mention the word typed', () => {
    const downing = addressSuggestion({
      housenumber: '10',
      street: 'Downing Street',
      city: 'London',
      postcode: 'SW1A 2AA',
      countrycode: 'GB'
    })!;
    const other = addressSuggestion({
      street: 'Ring Road',
      city: 'Bidhannagar',
      postcode: '700091',
      countrycode: 'IN'
    })!;
    expect(matchesAddressQuery(downing, '10 Downing Street')).toBe(true);
    expect(matchesAddressQuery(other, '10 Downing Street')).toBe(false);
    expect(matchesAddressQuery(downing, 'Baker Street')).toBe(false);
  });
});
