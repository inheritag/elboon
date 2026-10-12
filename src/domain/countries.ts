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
