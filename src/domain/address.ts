import { COUNTRIES } from './countries';

export interface AddressHit {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  locality?: string;
  district?: string;
  postcode?: string;
  countrycode?: string;
}

export interface AddressSuggestion {
  label: string;
  line1: string;
  city: string;
  postcode: string;
  country: string;
}

/** ISO 3166-1 alpha-2 for the countries the shop ships to. */
const COUNTRY_BY_CODE: Record<string, (typeof COUNTRIES)[number]> = {
  GB: 'United Kingdom',
  IE: 'Ireland',
  NG: 'Nigeria',
  GH: 'Ghana',
  ZA: 'South Africa',
  US: 'United States',
  CA: 'Canada',
  FR: 'France',
  DE: 'Germany',
  NL: 'Netherlands',
  ES: 'Spain',
  IT: 'Italy',
  AE: 'United Arab Emirates',
  IN: 'India'
};

export const SHIPPABLE_COUNTRY_CODES = COUNTRY_BY_CODE;

function bareCode(value: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value) || /^\d{4,6}$/.test(value);
}

/** One map hit, or null when it is not a street we can ship to. */
export function addressSuggestion(hit: AddressHit): AddressSuggestion | null {
  const country = hit.countrycode ? COUNTRY_BY_CODE[hit.countrycode.toUpperCase()] : undefined;
  if (!country) return null;

  const street = [hit.housenumber, hit.street]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const line1 = street || hit.name?.trim() || '';
  if (!line1 || (!street && bareCode(line1))) return null;

  const city = hit.city?.trim() || hit.town?.trim() || hit.village?.trim() || hit.locality?.trim() || hit.district?.trim() || '';
  const postcode = hit.postcode?.trim() || '';
  const label = [line1, city, postcode].filter(Boolean).join(', ');
  return { label, line1, city, postcode, country };
}

const GENERIC_WORDS = new Set([
  'street',
  'road',
  'avenue',
  'lane',
  'close',
  'drive',
  'place',
  'court',
  'way',
  'hill',
  'park',
  'gardens'
]);

/** Keep a hit only when it actually mentions the distinctive word the shopper typed. */
export function matchesAddressQuery(suggestion: AddressSuggestion, query: string): boolean {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !GENERIC_WORDS.has(word));
  if (words.length === 0) return true;
  const longest = words.reduce((best, word) => (word.length > best.length ? word : best));
  const hay = `${suggestion.line1} ${suggestion.city} ${suggestion.postcode}`.toLowerCase();
  return hay.includes(longest);
}
