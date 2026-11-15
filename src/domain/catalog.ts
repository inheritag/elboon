/** Built-in shopper categories. Extra ones, including nested ones, can be added in admin. */
export const DEFAULT_CATEGORY_SLUGS = ['tech', 'accessories', 'fashion', 'home', 'beauty'] as const;

export type Category = (typeof DEFAULT_CATEGORY_SLUGS)[number] | string;

export interface CategoryRecord {
  slug: string;
  label: string;
  parentSlug: string | null;
}

export interface CategoryMetric {
  category: string;
  activeCount: number;
  offerCount: number;
  discountedCount: number;
}

export const SIDE_MENU_CATEGORY_LIMIT = 6;

export const DEFAULT_CATEGORIES: CategoryRecord[] = DEFAULT_CATEGORY_SLUGS.map((slug) => ({
  slug,
  label: slug,
  parentSlug: null
}));

/** Pairings stay inside a kind of shop: clothes with beauty, tech with its accessories. */
export const COMPLEMENTARY: Record<string, string[]> = {
  tech: ['accessories'],
  accessories: ['tech'],
  fashion: ['beauty'],
  beauty: ['fashion'],
  home: []
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

/**
 * Check a new category, and its subcategory, before anything is saved.
 * A slug that already exists is refused, so Travel / Home cannot land in Home.
 */
export function planNewCategory(
  label: string,
  subcategory: string,
  parentSlug: string | null,
  all: CategoryRecord[]
): { slug: string; childSlug: string | null } | { error: string } {
  const name = label.trim();
  if (!name) return { error: 'Enter a name for the new category' };
  const parent = parentSlug || null;
  if (parent && !canNestUnder(null, parent, all)) {
    return { error: 'Choose a parent the new category can sit under' };
  }
  const slug = slugFromLabel(name);
  if (!slug) return { error: 'Enter a name for the new category' };
  if (all.some((category) => category.slug === slug)) return { error: 'That category already exists' };

  const childName = subcategory.trim();
  if (!childName) return { slug, childSlug: null };
  const childSlug = slugFromLabel(childName);
  if (!childSlug) return { error: 'Enter a name for the new category' };
  if (childSlug === slug || all.some((category) => category.slug === childSlug)) {
    return { error: 'That category already exists' };
  }
  const parentDepth = parent ? depthOf(parent, all) + 1 : 0;
  if (parentDepth + 1 >= MAX_CATEGORY_DEPTH) {
    return { error: 'Choose a parent the new category can sit under' };
  }
  return { slug, childSlug };
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

/**
 * Split top-level categories into a dynamic handful of the most interesting
 * departments (by live product volume, offers, discounts, and nested depth)
 * plus the alphabetical remainder for "List all categories".
 */
export function partitionSideMenuCategories(
  categories: CategoryRecord[],
  metrics: CategoryMetric[],
  limit = SIDE_MENU_CATEGORY_LIMIT
): { featured: CategoryRecord[]; rest: CategoryRecord[] } {
  const roots = childrenOf(null, categories);
  const cap = Math.max(1, Math.floor(limit) || SIDE_MENU_CATEGORY_LIMIT);
  if (roots.length <= cap) return { featured: roots, rest: [] };

  const totals = new Map<string, { active: number; offers: number; discounted: number }>();
  for (const metric of metrics) {
    const rootSlug = rootCategory(metric.category, categories)?.slug ?? metric.category;
    const current = totals.get(rootSlug) ?? { active: 0, offers: 0, discounted: 0 };
    current.active += Math.max(0, metric.activeCount);
    current.offers += Math.max(0, metric.offerCount);
    current.discounted += Math.max(0, metric.discountedCount);
    totals.set(rootSlug, current);
  }

  const scored = roots.map((root) => {
    const stat = totals.get(root.slug) ?? { active: 0, offers: 0, discounted: 0 };
    const descendants = Math.max(0, withDescendants(root.slug, categories).length - 1);
    const hasActive = stat.active > 0 ? 1 : 0;
    const score = stat.active * 10 + stat.offers * 4 + stat.discounted * 3 + Math.min(descendants, 6) * 2;
    return { root, hasActive, score };
  });

  scored.sort(
    (a, b) =>
      b.hasActive - a.hasActive ||
      b.score - a.score ||
      a.root.label.localeCompare(b.root.label)
  );

  const featured = scored.slice(0, cap).map((entry) => entry.root);
  const featuredSlugs = new Set(featured.map((row) => row.slug));
  const rest = roots.filter((row) => !featuredSlugs.has(row.slug));
  return { featured, rest };
}

/** @deprecated Use isCategorySlug. Kept so older imports still type-check during edit. */
export const CATEGORIES = DEFAULT_CATEGORY_SLUGS;
