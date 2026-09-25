import { isLowStock } from '../../../domain/stock';
import { getStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const store = getStore();
  const [products, offers, orders] = await Promise.all([
    store.listAllProducts(),
    store.listPendingOffers(),
    store.listOrders()
  ]);

  return {
    pendingOffers: offers,
    awaitingHandoff: orders.filter(
      (order) => order.payment_status === 'paid' && order.logistics_status === 'awaiting_partner'
    ),
    lowStock: products.filter((product) => isLowStock(product.stock_qty, product.low_stock_threshold))
  };
};
