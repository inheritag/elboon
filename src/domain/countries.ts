/** Shoppers pick a country. Nothing is pre-selected. */
export const COUNTRIES = [
  'United Kingdom',
  'Ireland',
  'Nigeria',
  'Ghana',
  'South Africa',
  'United States',
  'Canada',
  'France',
  'Germany',
  'Netherlands',
  'Spain',
  'Italy',
  'United Arab Emirates',
  'India'
] as const;

export function countryOptions(current: string): string[] {
  const extra = current.trim();
  if (extra && !COUNTRIES.includes(extra as (typeof COUNTRIES)[number])) return [extra, ...COUNTRIES];
  return [...COUNTRIES];
}

/** ISO 3166-1 alpha-3, which is what Royal Mail asks for. */
const COUNTRY_CODES: Record<(typeof COUNTRIES)[number], string> = {
  'United Kingdom': 'GBR',
  Ireland: 'IRL',
  Nigeria: 'NGA',
  Ghana: 'GHA',
  'South Africa': 'ZAF',
  'United States': 'USA',
  Canada: 'CAN',
  France: 'FRA',
  Germany: 'DEU',
  Netherlands: 'NLD',
  Spain: 'ESP',
  Italy: 'ITA',
  'United Arab Emirates': 'ARE',
  India: 'IND'
};

export function countryCode(name: string): string | null {
  const code = COUNTRY_CODES[name.trim() as (typeof COUNTRIES)[number]];
  return code ?? null;
}
