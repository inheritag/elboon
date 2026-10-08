/** Built-in shopper categories. Extra ones, including nested ones, can be added in admin. */
export const DEFAULT_CATEGORY_SLUGS = ['tech', 'accessories', 'fashion', 'home', 'beauty'] as const;

export type Category = (typeof DEFAULT_CATEGORY_SLUGS)[number] | string;

export interface CategoryRecord {
  slug: string;
  label: string;
  parentSlug: string | null;
}

export const DEFAULT_CATEGORIES: CategoryRecord[] = DEFAULT_CATEGORY_SLUGS.map((slug) => ({
  slug,
  label: slug,
  parentSlug: null
}));

/** Complementary pairings use the top-level category (tech ↔ accessories, and so on). */
export const COMPLEMENTARY: Record<string, string[]> = {
  tech: ['accessories'],
  accessories: ['tech', 'fashion'],
  fashion: ['accessories', 'beauty'],
  beauty: ['fashion', 'accessories'],
  home: ['accessories']
};

export const MAX_CATEGORY_DEPTH = 4;

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

export function childrenOf(slug: string | null, all: CategoryRecord[]): CategoryRecord[] {
  return all
    .filter((category) => (category.parentSlug ?? null) === slug)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function ancestors(slug: string, all: CategoryRecord[]): CategoryRecord[] {
  const chain: CategoryRecord[] = [];
  const seen = new Set<string>();
  let current = all.find((category) => category.slug === slug) ?? null;
  while (current?.parentSlug && !seen.has(current.slug)) {
    seen.add(current.slug);
    const parent = all.find((category) => category.slug === current!.parentSlug) ?? null;
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function rootCategory(slug: string, all: CategoryRecord[]): CategoryRecord | null {
  const self = all.find((category) => category.slug === slug) ?? null;
  return ancestors(slug, all)[0] ?? self;
}

export function withDescendants(slug: string, all: CategoryRecord[]): string[] {
  const out: string[] = [];
  const walk = (id: string) => {
    if (out.includes(id)) return;
    out.push(id);
    for (const child of childrenOf(id, all)) walk(child.slug);
  };
  walk(slug);
  return out;
}

/** Selected category plus every ancestor, root first. Unknown slugs stay as themselves. */
export function categoryTrail(selected: string | null, all: CategoryRecord[]): string[] {
  if (!selected) return [];
  const self = all.find((category) => category.slug === selected);
  if (!self) return [selected];
  return [...ancestors(selected, all).map((category) => category.slug), selected];
}

/** True when a product belongs to the selected category or one of its nested children. */
export function inCategoryTree(
  productCategory: string,
  selected: string | null,
  all: CategoryRecord[]
): boolean {
  if (!selected) return true;
  return withDescendants(selected, all).includes(productCategory);
}

export function depthOf(slug: string, all: CategoryRecord[]): number {
  return ancestors(slug, all).length;
}

export function categoryPath(slug: string, all: CategoryRecord[]): string {
  const self = all.find((category) => category.slug === slug);
  if (!self) return slug;
  return [...ancestors(slug, all), self].map((category) => category.label).join(' / ');
}

export function flattenTree(all: CategoryRecord[]): { slug: string; label: string; path: string; depth: number }[] {
  const out: { slug: string; label: string; path: string; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const row of childrenOf(parent, all)) {
      out.push({ slug: row.slug, label: row.label, path: categoryPath(row.slug, all), depth });
      walk(row.slug, depth + 1);
    }
  };
  walk(null, 0);
  for (const row of all) {
    if (!out.some((item) => item.slug === row.slug)) {
      out.push({ slug: row.slug, label: row.label, path: row.label, depth: 0 });
    }
  }
  return out;
}

export function canNestUnder(childSlug: string | null, parentSlug: string | null, all: CategoryRecord[]): boolean {
  if (!parentSlug) return true;
  if (!all.some((category) => category.slug === parentSlug)) return false;
  if (childSlug && parentSlug === childSlug) return false;
  if (childSlug && withDescendants(childSlug, all).includes(parentSlug)) return false;
  return depthOf(parentSlug, all) + 1 < MAX_CATEGORY_DEPTH;
}

export interface CategoryNavLevel {
  parentSlug: string;
  allLabel: string;
  items: CategoryRecord[];
}

export function categoryNav(
  selected: string | null,
  all: CategoryRecord[]
): { top: CategoryRecord[]; levels: CategoryNavLevel[] } {
  const top = childrenOf(null, all);
  if (!selected) return { top, levels: [] };
  const self = all.find((category) => category.slug === selected);
  if (!self) return { top, levels: [] };
  const trail = [...ancestors(selected, all), self];
  const levels: CategoryNavLevel[] = [];
  for (const node of trail) {
    const items = childrenOf(node.slug, all);
    if (items.length === 0) continue;
    levels.push({
      parentSlug: node.slug,
      allLabel: `All ${node.label}`,
      items
    });
  }
  return { top, levels };
}

/** @deprecated Use isCategorySlug. Kept so older imports still type-check during edit. */
export const CATEGORIES = DEFAULT_CATEGORY_SLUGS;
