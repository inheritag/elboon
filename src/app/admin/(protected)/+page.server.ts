import { deskFigures } from '../../../domain/desk';
import { heldMap, lowStockLines } from '../../../domain/inventory';
import { productFromRow } from '../../../domain/product';
import { getStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const store = getStore();
  const [products, offers, orders, holds] = await Promise.all([
    store.listAllProducts(),
    store.listPendingOffers(),
    store.listOrders(),
    store.listHeldUnits()
  ]);
  const held = heldMap(holds);

  return {
    figures: deskFigures(products, orders, new Date(), held),
    pendingOffers: offers,
    awaitingHandoff: orders.filter(
      (order) => order.payment_status === 'paid' && order.logistics_status === 'awaiting_partner'
    ),
    lowStock: lowStockLines(products.map(productFromRow), held)
  };
};
