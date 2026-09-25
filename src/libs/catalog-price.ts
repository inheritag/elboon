import type { OrderItem } from '../domain/order';
import { getStore } from './store';

/** Prices come from the catalog, never from the client. */
export async function priceItemsFromCatalog(
  requestedItems: { productId: string; quantity: number }[]
): Promise<OrderItem[] | null> {
  const store = getStore();
  const items: OrderItem[] = [];

  for (const requested of requestedItems) {
    const product = await store.getActiveProduct(requested.productId);
    if (!product || product.stock_qty < requested.quantity) {
      return null;
    }

    items.push({
      productId: requested.productId,
      productName: product.name,
      quantity: requested.quantity,
      unitPriceCents: product.price_cents
    });
  }

  return items;
}
