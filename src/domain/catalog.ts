/** Shopper-facing categories from the Sep 1 MVP (tech and accessories called out explicitly). */
export const CATEGORIES = ['tech', 'accessories', 'fashion', 'home', 'beauty'] as const;

export type Category = (typeof CATEGORIES)[number];

/** Complementary categories used by the recommendation ranking. */
export const COMPLEMENTARY: Record<string, string[]> = {
  tech: ['accessories'],
  accessories: ['tech', 'fashion'],
  fashion: ['accessories', 'beauty'],
  beauty: ['fashion', 'accessories'],
  home: ['accessories']
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
