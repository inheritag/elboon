import { childrenOf, rootCategory, type CategoryRecord } from './catalog';
import type { ProductSummary } from './product';

export const CATALOG_SORTS = ['featured', 'price-asc', 'price-desc', 'name'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

/** How many products a homepage category row shows before "Shop all". */
export const BAND_PREVIEW = 8;

export interface ListingOption {
  id: string;
  label: string;
  priceCents: number;
  imageUrl: string | null;
}

export interface Listing {
  id: string;
  name: string;
  priceCents: number;
  priceMaxCents: number;
  currency: string;
  category: string;
  imageUrl: string | null;
  lowStock: boolean;
  remainingQty: number | null;
  offerEnabled: boolean;
  colors: ProductSummary['colors'];
  /** Size or colour labels when several uploads are one product. */
  choices: string[];
  options: ListingOption[];
}

export interface CatalogBand {
  slug: string;
  label: string;
  total: number;
  items: Listing[];
}

const SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', '4xl', '5xl'];

const TRAILING =
  /^(wide|straps|strap|non|wired|padding|comfort|plus|everyday|soft|slim|shockproof|protective|cover|with|casual|warm|knitted|sweater|pullover|sleeve|sleeves|lightweight)$/i;

export function parseSort(value: string | null | undefined): CatalogSort {
  return CATALOG_SORTS.includes(value as CatalogSort) ? (value as CatalogSort) : 'featured';
}

function tidy(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim();
}

function softenHyphens(text: string): string {
  return text.replace(/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/g, (token) => {
    const parts = token.split('-');
    if (parts.some((part) => part.length === 1)) return token;
    return parts.join(' ');
  });
}

function dropLeadingBrand(text: string): string {
  const words = text.split(' ').filter(Boolean);
  if (words.length < 3) return words.join(' ');
  const first = words[0] ?? '';
  const bare = first.replace(/[^A-Za-z0-9]/g, '');
  const letters = bare.replace(/[0-9]/g, '');
  const caps = letters.split('').filter((char) => char >= 'A' && char <= 'Z').length;
  const shoutyCode = /^[A-Z0-9]{3,}$/.test(bare);
  const mixedBrand = letters.length >= 3 && caps >= 2 && caps < letters.length;
  const possessiveLead = /^[A-Z]/.test(first) && /^(men's|women's|girls|boys|kids)$/i.test(words[1] ?? '');
  if (shoutyCode || mixedBrand || possessiveLead) return words.slice(1).join(' ');
  return words.join(' ');
}

/** Marketplace titles become a short shop name. The stored title is left alone. */
export function shopName(raw: string): string {
  let text = softenHyphens(tidy(raw).replace(/\s*[([][^)\]]*$/g, '').replace(/\s*[([][^)\]]+[)\]]/g, ' '));
  const compatible = text.match(/^(.*?)\bcompatible with\s+(.*)$/i);
  if (compatible) {
    const left = dropLeadingBrand(compatible[1]).trim();
    text = [left, compatible[2]].filter(Boolean).join(' ');
  }
  const beforeComma = text.split(',')[0]?.trim() ?? text;
  if (beforeComma.split(/\s+/).length >= 2) text = beforeComma;
  text = text.split(/\s+-\s+/)[0] ?? text;
  text = text.replace(/\b(?:\d{1,2}\/)+\d{1,2}\s*mm\b/gi, '');
  text = text.replace(/\b\d{1,2}\s*mm\b/gi, '');
  text = dropLeadingBrand(text.replace(/\s+/g, ' ').trim());
  const words = text.split(/\s+/).filter(Boolean).slice(0, 6);
  const name = words.join(' ').trim();
  return name || tidy(raw).slice(0, 48);
}

function variantLabel(raw: string): string | null {
  const tidyRaw = tidy(raw);
  const paren = tidyRaw.match(/[([]\s*([^)\]]+?)\s*[)\]]?\s*$/);
  if (paren && paren[1].trim().length > 0 && paren[1].trim().length <= 40) return paren[1].trim();
  const sizes = tidyRaw.match(/\b(?:\d{1,2}\/)+\d{1,2}\s*mm\b/i);
  if (sizes) return sizes[0];
  const strength = tidyRaw.match(/\+\d+(?:\.\d+)?/);
  if (strength) return strength[0];
  return null;
}

function keyText(raw: string): string {
  const words = shopName(raw).split(/\s+/).filter(Boolean);
  while (words.length > 3 && TRAILING.test(words[words.length - 1] ?? '')) words.pop();
  return words
    .join(' ')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\+\d+(?:\.\d+)?/g, '')
    .replace(/\b(?:xxs|xs|s|m|l|xl|xxl|2xl|3xl|4xl|5xl)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function familyKey(raw: string): string {
  return keyText(raw) || shopName(raw).toLowerCase();
}

function choiceRank(label: string): number {
  const token = label.toLowerCase().split(/[^a-z0-9+]/)[0] ?? label.toLowerCase();
  const index = SIZE_ORDER.indexOf(token);
  return index === -1 ? 100 : index;
}

export function choiceHeading(labels: string[]): 'Size' | 'Option' {
  if (labels.length === 0) return 'Option';
  const sizeish = labels.filter((label) =>
    /\b(xxs|xs|s|m|l|xl|xxl|2xl|3xl|4xl|5xl|small|medium|large|years?|months?)\b/i.test(label) || /\d/.test(label)
  ).length;
  return sizeish >= labels.length / 2 ? 'Size' : 'Option';
}

function prefer(current: ProductSummary, candidate: ProductSummary): ProductSummary {
  const currentImage = current.imageUrl ? 1 : 0;
  const candidateImage = candidate.imageUrl ? 1 : 0;
  if (candidateImage !== currentImage) return candidateImage > currentImage ? candidate : current;
  if (candidate.priceCents !== current.priceCents) return candidate.priceCents < current.priceCents ? candidate : current;
  return current;
}

/** Collapse size, colour, and repeated uploads into one listing. Order stays newest-first. */
export function groupListings(items: ProductSummary[]): Listing[] {
  const groups: { key: string; members: ProductSummary[] }[] = [];
  const index = new Map<string, number>();

  for (const item of items) {
    const key = `${item.category}::${familyKey(item.name)}`;
    const at = index.get(key);
    if (at === undefined) {
      index.set(key, groups.length);
      groups.push({ key, members: [item] });
    } else {
      groups[at].members.push(item);
    }
  }

  return groups.map((group) => {
    const labeled = new Map<string, ProductSummary>();
    const unlabeled: ProductSummary[] = [];
    for (const member of group.members) {
      const label = variantLabel(member.name);
      if (!label) {
        unlabeled.push(member);
        continue;
      }
      const existing = labeled.get(label.toLowerCase());
      labeled.set(label.toLowerCase(), existing ? prefer(existing, member) : member);
    }

    const options: ListingOption[] = [...labeled.entries()]
      .map(([key, member]) => ({
        id: member.id,
        label: variantLabel(member.name) ?? key,
        priceCents: member.priceCents,
        imageUrl: member.imageUrl
      }))
      .sort((a, b) => choiceRank(a.label) - choiceRank(b.label) || a.label.localeCompare(b.label));

    let representative = group.members[0];
    for (const member of group.members.slice(1)) representative = prefer(representative, member);
    if (unlabeled.length > 0 && options.length === 0) {
      representative = unlabeled.reduce((best, member) => prefer(best, member));
    }

    const choices =
      options.length > 0
        ? options.map((option) => option.label)
        : representative.sizes.map((size) => size.name);

    if (options.length === 0) {
      options.push({
        id: representative.id,
        label: choices[0] ?? shopName(representative.name),
        priceCents: representative.priceCents,
        imageUrl: representative.imageUrl
      });
    } else if (unlabeled.length > 0) {
      const plain = unlabeled.reduce((best, member) => prefer(best, member));
      options.unshift({
        id: plain.id,
        label: 'Standard',
        priceCents: plain.priceCents,
        imageUrl: plain.imageUrl
      });
      choices.unshift('Standard');
    }

    const prices = group.members.map((member) => member.priceCents);
    const colors = new Map<string, { name: string; hex: string }>();
    for (const member of group.members) {
      for (const color of member.colors) colors.set(color.name.toLowerCase(), color);
    }

    return {
      id: representative.id,
      name: shopName(representative.name),
      priceCents: Math.min(...prices),
      priceMaxCents: Math.max(...prices),
      currency: representative.currency,
      category: representative.category,
      imageUrl: representative.imageUrl,
      lowStock: representative.lowStock,
      remainingQty: representative.remainingQty,
      offerEnabled: group.members.some((member) => member.offerEnabled),
      colors: [...colors.values()],
      choices,
      options
    };
  });
}

export function sortListings(items: Listing[], sort: CatalogSort): Listing[] {
  const copy = [...items];
  if (sort === 'price-asc') copy.sort((a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name));
  if (sort === 'price-desc') copy.sort((a, b) => b.priceCents - a.priceCents || a.name.localeCompare(b.name));
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

/**
 * All-page order. One listing from each department in turn, in the same
 * department order as the category rail. Nested categories count as their
 * parent department. Input order is kept inside a department, so newest
 * stays first there. The result is stable until the catalogue changes.
 */
export function mixByDepartment(listings: Listing[], categories: CategoryRecord[]): Listing[] {
  const buckets = new Map<string, Listing[]>();
  for (const listing of listings) {
    const slug = rootCategory(listing.category, categories)?.slug ?? listing.category;
    const rows = buckets.get(slug) ?? [];
    rows.push(listing);
    buckets.set(slug, rows);
  }

  const order = childrenOf(null, categories).map((category) => category.slug);
  for (const slug of buckets.keys()) {
    if (!order.includes(slug)) order.push(slug);
  }

  const queues = order.map((slug) => buckets.get(slug) ?? []).filter((queue) => queue.length > 0);
  const mixed: Listing[] = [];
  const cursors = queues.map(() => 0);
  let remaining = listings.length;
  while (remaining > 0) {
    let took = false;
    for (let i = 0; i < queues.length; i += 1) {
      const next = queues[i][cursors[i]];
      if (!next) continue;
      cursors[i] += 1;
      mixed.push(next);
      remaining -= 1;
      took = true;
    }
    if (!took) break;
  }
  return mixed;
}

export function categoryBands(
  listings: Listing[],
  categories: CategoryRecord[],
  limit = BAND_PREVIEW
): CatalogBand[] {
  const bySlug = new Map<string, Listing[]>();
  for (const listing of listings) {
    const rows = bySlug.get(listing.category) ?? [];
    rows.push(listing);
    bySlug.set(listing.category, rows);
  }

  const order = childrenOf(null, categories).map((category) => category.slug);
  for (const slug of bySlug.keys()) {
    if (!order.includes(slug)) order.push(slug);
  }

  return order
    .filter((slug) => bySlug.has(slug))
    .map((slug) => {
      const items = bySlug.get(slug) ?? [];
      const known = categories.find((category) => category.slug === slug);
      return {
        slug,
        label: known?.label ?? slug,
        total: items.length,
        items: items.slice(0, limit)
      };
    });
}

export function listingToSummary(listing: Listing): ProductSummary {
  return {
    id: listing.id,
    name: listing.name,
    priceCents: listing.priceCents,
    currency: listing.currency,
    category: listing.category,
    imageUrl: listing.imageUrl,
    lowStock: listing.lowStock,
    remainingQty: listing.remainingQty,
    offerEnabled: listing.offerEnabled,
    colors: listing.colors,
    sizes: listing.choices.map((name) => ({ name }))
  };
}
