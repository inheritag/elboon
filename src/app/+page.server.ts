import {
  categoryNav,
  categoryPath,
  categoryTrail,
  inCategoryTree,
  type CategoryNavLevel,
  type CategoryRecord
} from '../domain/catalog';
import { heldMap, totalAvailable } from '../domain/inventory';
import { pickHero, type HeroPick, type HeroShot } from '../domain/hero';
import {
  deferHeroListing,
  familyKey,
  groupListings,
  mixByDepartment,
  parseSort,
  sortListings,
  type Listing
} from '../domain/listing';
import { paginate } from '../domain/paging';
import { productFromRow, toProductSummary, type Product, type ProductRow } from '../domain/product';
import { measureImages } from '../libs/image-measure';
import { getStore } from '../libs/store';
import type { PageServerLoad } from './$types';

function matchesQuery(row: ProductRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${row.name} ${row.description} ${row.category}`.toLowerCase().includes(needle);
}

const emptyNav: { top: CategoryRecord[]; levels: CategoryNavLevel[] } = { top: [], levels: [] };

function heroListingId(heroId: string | undefined, products: Product[], listings: Listing[]): string | null {
  if (!heroId) return null;
  if (listings.some((listing) => listing.id === heroId || listing.options.some((option) => option.id === heroId))) {
    return heroId;
  }
  const heroProduct = products.find((product) => product.id === heroId);
  if (!heroProduct) return heroId;
  const heroKey = `${heroProduct.category}::${familyKey(heroProduct.name)}`;
  const match = listings.find((listing) => `${listing.category}::${familyKey(listing.name)}` === heroKey);
  return match?.id ?? heroId;
}

function heroShots(products: Product[], held: Map<string, number>): HeroShot[] {
  const shots: HeroShot[] = [];
  for (const product of products) {
    const available = totalAvailable(product, held) > 0;
    const urls = [
      ...product.imageUrls,
      ...product.colors.flatMap((color) => color.imageUrls)
    ].filter((url, index, all) => url.trim() && all.indexOf(url) === index);
    for (const imageUrl of urls) {
      shots.push({ id: product.id, category: product.category, imageUrl, width: 0, height: 0, available });
    }
  }
  return shots;
}

async function campaignHero(products: Product[], categories: CategoryRecord[], held: Map<string, number>): Promise<HeroPick | null> {
  const shots = heroShots(products, held).filter((shot) => shot.available);
  if (shots.length === 0) return null;
  const sizes = await measureImages(shots.map((shot) => shot.imageUrl));
  for (const shot of shots) {
    const size = sizes.get(shot.imageUrl);
    if (!size) continue;
    shot.width = size.width;
    shot.height = size.height;
  }
  return pickHero(shots, categories, Math.floor(Math.random() * 0x7fffffff));
}

export const load: PageServerLoad = async ({ url }) => {
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q')?.trim() ?? '';
  const sort = q ? parseSort(url.searchParams.get('sort')) : 'featured';
  const requestedPage = Number(url.searchParams.get('page') ?? 1);
  try {
    const store = getStore();
    const [rows, categories, holds] = await Promise.all([
      store.listActiveProducts(),
      store.listCategories(),
      store.listHeldUnits()
    ]);
    const held = heldMap(holds);
    const products = rows
      .filter((row) => inCategoryTree(row.category, category, categories))
      .filter((row) => matchesQuery(row, q))
      .map(productFromRow);
    const matched = products.map((product) => toProductSummary(product, totalAvailable(product, held)));
    const grouped = sortListings(groupListings(matched), sort);
    const nav = categoryNav(category, categories);
    const browsingAll = !category && !q;
    const hero = browsingAll
      ? await campaignHero(products, categories, held).catch((err) => {
          console.error('Hero image', err);
          return null;
        })
      : null;
    const homeListings = browsingAll
      ? deferHeroListing(mixByDepartment(grouped, categories), heroListingId(hero?.id, products, grouped))
      : grouped;
    const window = paginate(homeListings, requestedPage);
    return {
      products: window.items,
      total: window.total,
      page: window.page,
      pages: window.pages,
      sort,
      category,
      categories,
      nav,
      trail: categoryTrail(category, categories),
      categoryLabel: category ? categoryPath(category, categories) : null,
      q,
      hero
    };
  } catch (err) {
    console.error('Failed to load catalog', err);
    return {
      products: [],
      total: 0,
      page: 1,
      pages: 1,
      sort,
      category,
      categories: [],
      nav: emptyNav,
      trail: [],
      categoryLabel: category,
      q,
      hero: null
    };
  }
};
