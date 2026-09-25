/** Built-in shopper categories. Extra ones can be added in admin. */
export const DEFAULT_CATEGORY_SLUGS = ['tech', 'accessories', 'fashion', 'home', 'beauty'] as const;

export type Category = (typeof DEFAULT_CATEGORY_SLUGS)[number] | string;

export interface CategoryRecord {
  slug: string;
  label: string;
}

export const DEFAULT_CATEGORIES: CategoryRecord[] = DEFAULT_CATEGORY_SLUGS.map((slug) => ({
  slug,
  label: slug
}));

/** Complementary categories used by the recommendation ranking. */
export const COMPLEMENTARY: Record<string, string[]> = {
  tech: ['accessories'],
  accessories: ['tech', 'fashion'],
  fashion: ['accessories', 'beauty'],
  beauty: ['fashion', 'accessories'],
  home: ['accessories']
};

export function slugFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isCategorySlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/** @deprecated Use isCategorySlug. Kept so older imports still type-check during edit. */
export const CATEGORIES = DEFAULT_CATEGORY_SLUGS;
