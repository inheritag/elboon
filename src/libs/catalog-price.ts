import { availableFor, heldMap } from '../domain/inventory';
import { salePrice } from '../domain/price';
import { productFromRow, variantLabel } from '../domain/product';
import type { OrderItem } from '../domain/order';
import { getStore } from './store';

/** Prices come from the catalog, never from the client. */
export async function priceItemsFromCatalog(
  requestedItems: { productId: string; quantity: number; color?: string | null; size?: string | null }[]
): Promise<OrderItem[] | null> {
  const store = getStore();
  const held = heldMap(await store.listHeldUnits());
  const items: OrderItem[] = [];

  for (const requested of requestedItems) {
    const row = await store.getActiveProduct(requested.productId);
    if (!row) return null;
    const product = productFromRow(row);
    if (product.colors.length > 0 && !requested.color) return null;
    if (product.sizes.length > 0 && !requested.size) return null;
    if (availableFor(product, held, requested.color, requested.size) < requested.quantity) return null;
    const sale = salePrice(product.priceCents, product.discountPercent);

    items.push({
      productId: requested.productId,
      productName: variantLabel(product.name, requested.color, requested.size),
      quantity: requested.quantity,
      unitPriceCents: sale.priceCents,
      ...(sale.wasCents != null ? { wasCents: sale.wasCents, discountPercent: sale.discountPercent } : {}),
      color: requested.color ?? null,
      size: requested.size ?? null
    });
  }

  return items;
}
