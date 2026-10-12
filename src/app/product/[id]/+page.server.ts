import { error } from '@sveltejs/kit';
import { categoryPath } from '../../../domain/catalog';
import { heldMap, linesForProduct, totalAvailable } from '../../../domain/inventory';
import { choiceHeading, groupListings, listingToSummary, shopName } from '../../../domain/listing';
import { productFromRow, toProductSummary, type Product } from '../../../domain/product';
import { recommendProducts } from '../../../domain/recommend';
import { getStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const store = getStore();
  const row = await store.getActiveProduct(params.id);
  if (!row) {
    error(404, 'Product not found');
  }

  const product: Product = productFromRow(row);
  const [catalogRows, categories, holds] = await Promise.all([
    store.listActiveProducts(),
    store.listCategories(),
    store.listHeldUnits()
  ]);
  const held = heldMap(holds);
  const catalog = catalogRows.map(productFromRow).map((item) => toProductSummary(item, totalAvailable(item, held)));
  const listings = groupListings(catalog);
  const family = listings.find((listing) => listing.options.some((option) => option.id === product.id));
  const options = (family?.options ?? []).filter((option) => family && family.options.length > 1);
  const relatedPool = listings
    .filter((listing) => !listing.options.some((option) => option.id === product.id))
    .map(listingToSummary);

  return {
    product,
    displayName: shopName(product.name),
    options,
    optionHeading: choiceHeading(options.map((option) => option.label)),
    holds: linesForProduct(product, held).map((line) => ({
      color: line.color,
      size: line.size,
      held: line.held
    })),
    categoryLabel: categoryPath(product.category, categories),
    related: recommendProducts(product, relatedPool, 4, categories)
  };
};
