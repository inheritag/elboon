import { productFromRow, stockFor } from '../domain/product';
import type { OrderItem } from '../domain/order';
import { getStore } from './store';

/** Prices come from the catalog, never from the client. */
export async function priceItemsFromCatalog(
  requestedItems: { productId: string; quantity: number; color?: string | null }[]
): Promise<OrderItem[] | null> {
  const store = getStore();
  const items: OrderItem[] = [];

  for (const requested of requestedItems) {
    const row = await store.getActiveProduct(requested.productId);
    if (!row) return null;
    const product = productFromRow(row);
    if (product.colors.length > 0 && !requested.color) return null;
    if (stockFor(product, requested.color) < requested.quantity) return null;

    items.push({
      productId: requested.productId,
      productName: requested.color ? `${product.name} · ${requested.color}` : product.name,
      quantity: requested.quantity,
      unitPriceCents: product.priceCents,
      color: requested.color ?? null
    });
  }

  return items;
}
